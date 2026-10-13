#!/usr/bin/env node
// On-page SEO checker for figma-wp-blueprint. No dependencies (Node 18+).
// Read-only: it only sends GET/HEAD requests to the site you name.

const USAGE = `Usage: node .claude/skills/seo-check/scripts/seo.mjs <command> <url> [options]

Commands:
  site   <site-url>                 robots.txt, sitemap, search visibility, permalinks, SEO plugin
  pages  <site-url> [--type slug]   list published URLs (sitemap, then REST API fallback)
  check  <url> [url ...] [--links]  check each page; --links also checks internal link status

Output is JSON. Severities: error, warning, info.`;

const UA = "figma-wp-blueprint-seo-check/1.0";
const MAX_REDIRECTS = 5;
const MAX_LINKS = 200;

main().catch((error) => {
  const hint = /certificate|self[- ]signed|UNABLE_TO_VERIFY/i.test(String(error.cause ?? error.message))
    ? " (LocalWP SSL: use the http:// URL, or trust the LocalWP certificate)"
    : "";
  console.error(`Error: ${error.message}${hint}`);
  process.exit(1);
});

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift();
  const flags = { links: false, type: null };
  const urls = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--links") flags.links = true;
    else if (args[i] === "--type") flags.type = args[++i];
    else urls.push(args[i]);
  }
  if (!command || !urls.length) {
    console.log(USAGE);
    process.exit(command ? 1 : 0);
  }
  urls.forEach((u) => new URL(u)); // throws on a bad URL

  let result;
  if (command === "site") result = await site(urls[0]);
  else if (command === "pages") result = await pages(urls[0], flags.type);
  else if (command === "check") result = await checkPages(urls, flags.links);
  else {
    console.log(USAGE);
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
}

// ---------- HTTP ----------

async function get(url, method = "GET") {
  const chain = [];
  let current = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await fetch(current, { method, redirect: "manual", headers: { "user-agent": UA } });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      chain.push({ from: current, status: response.status });
      current = new URL(response.headers.get("location"), current).href;
      continue;
    }
    const body = method === "GET" ? await response.text() : "";
    return { url: current, status: response.status, headers: response.headers, body, redirects: chain };
  }
  throw new Error(`Too many redirects from ${url}`);
}

// ---------- HTML parsing (enough for server-rendered WordPress output) ----------

function decode(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function textOf(html) {
  return decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function attrs(source) {
  const out = {};
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(source))) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  return out;
}

function tags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*)>`, "gi");
  return [...html.matchAll(re)].map((m) => attrs(m[1]));
}

function parse(raw) {
  const plugin =
    /Yoast SEO/i.test(raw) ? "Yoast SEO" :
    /Rank Math/i.test(raw) ? "Rank Math" :
    /The SEO Framework/i.test(raw) ? "The SEO Framework" :
    /All in One SEO/i.test(raw) ? "All in One SEO" : null;

  const jsonLd = [...raw.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1].trim()
  );

  const html = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, "");

  const head = (html.match(/<head\b[\s\S]*?<\/head>/i) ?? [html])[0];
  const metas = tags(head, "meta");
  const linkTags = tags(head, "link");
  const meta = (key, value) => metas.find((m) => (m[key] ?? "").toLowerCase() === value)?.content ?? null;

  return {
    plugin,
    lang: tags(html, "html")[0]?.lang ?? null,
    titles: [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => textOf(m[1])),
    description: meta("name", "description"),
    robots: meta("name", "robots"),
    viewport: meta("name", "viewport"),
    canonicals: linkTags.filter((l) => (l.rel ?? "").toLowerCase() === "canonical").map((l) => l.href),
    icon: linkTags.some((l) => /(^|\s)icon(\s|$)/i.test(l.rel ?? "")),
    og: {
      title: meta("property", "og:title"),
      description: meta("property", "og:description"),
      image: meta("property", "og:image"),
      url: meta("property", "og:url"),
    },
    twitterCard: meta("name", "twitter:card"),
    headings: [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
      level: Number(m[1]),
      text: textOf(m[2]),
    })),
    images: tags(html, "img"),
    links: [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => {
      const a = attrs(m[1]);
      const imgAlt = tags(m[2], "img").map((i) => i.alt ?? "").join(" ").trim();
      return { href: a.href ?? null, rel: a.rel ?? "", text: textOf(m[2]) || a["aria-label"] || a.title || imgAlt };
    }),
    jsonLd,
  };
}

// ---------- site ----------

async function site(siteUrl) {
  const base = installBase(siteUrl);
  const issues = [];
  const add = (severity, check, found, expected) => issues.push({ severity, check, found, expected });

  const robots = await get(new URL("/robots.txt", base).href);
  const robotsBody = robots.status === 200 ? robots.body : "";
  if (robots.status !== 200) add("warning", "robots-txt", `HTTP ${robots.status}`, "robots.txt returns 200");
  if (/User-agent:\s*\*[\s\S]*?^Disallow:\s*\/\s*$/im.test(robotsBody))
    add("error", "robots-disallow-all", "Disallow: / for all crawlers", "Crawlers allowed on the live site");

  const sitemapUrls = [...robotsBody.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const candidates = [...new Set([...sitemapUrls, new URL("wp-sitemap.xml", base).href])];
  let sitemap = null;
  for (const url of candidates) {
    const res = await get(url).catch(() => null);
    if (res?.status === 200 && /<(sitemapindex|urlset)\b/i.test(res.body)) {
      sitemap = res.url;
      break;
    }
  }
  if (!sitemap) add("warning", "sitemap", "No XML sitemap found", "/wp-sitemap.xml or an SEO plugin sitemap");

  const home = await get(base);
  const parsed = parse(home.body);
  const noindex = /noindex/i.test(`${parsed.robots ?? ""} ${home.headers.get("x-robots-tag") ?? ""}`);
  if (noindex)
    add(
      "error",
      "search-visibility",
      "Home page is noindex",
      "Settings > Reading > 'Discourage search engines' unchecked on the live site (often on in LocalWP on purpose)"
    );

  const plain = parsed.links.some((l) => /[?&](p|page_id)=\d+/.test(l.href ?? ""));
  if (plain) add("warning", "permalinks", "Plain ?p= / ?page_id= links", "Settings > Permalinks: Post name");

  const rest = await get(new URL("wp-json/", base).href).catch(() => null);

  return {
    site: base,
    homeStatus: home.status,
    seoPlugin: parsed.plugin,
    robotsTxt: robots.status,
    sitemap,
    searchVisible: !noindex,
    restApi: rest?.status === 200,
    issues,
  };
}

// ---------- pages ----------

async function pages(siteUrl, type) {
  const base = installBase(siteUrl);
  const robots = await get(new URL("/robots.txt", base).href).catch(() => null);
  const declared = robots?.status === 200 ? [...robots.body.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]) : [];
  let list = [];
  let source = null;
  for (const url of [...new Set([...declared, new URL("wp-sitemap.xml", base).href])]) {
    list = (await sitemapUrls(url).catch(() => [])).filter((p) => p.url.startsWith(base));
    if (list.length) {
      source = url;
      break;
    }
  }

  if (!list.length) {
    // Core sitemaps are disabled while "Discourage search engines" is on: use the REST API.
    source = "rest-api";
    list = [];
    const typesRes = await get(new URL("wp-json/wp/v2/types", base).href);
    if (typesRes.status !== 200) throw new Error(`No sitemap and REST API returned ${typesRes.status}`);
    const types = JSON.parse(typesRes.body);
    for (const [slug, info] of Object.entries(types)) {
      if (!info.rest_base || ["attachment", "nav_menu_item", "wp_block", "wp_template", "wp_template_part", "wp_navigation", "wp_font_family", "wp_font_face", "wp_global_styles"].includes(slug)) continue;
      for (let page = 1; page <= 20; page++) {
        const url = new URL(`wp-json/${info.rest_namespace ?? "wp/v2"}/${info.rest_base}`, base);
        url.search = new URLSearchParams({ per_page: "100", page: String(page), _fields: "link" }).toString();
        const res = await get(url.href);
        if (res.status !== 200) break;
        const items = JSON.parse(res.body);
        items.forEach((item) => list.push({ url: item.link, type: slug }));
        if (items.length < 100) break;
      }
    }
    if (!list.some((p) => p.url === base)) list.unshift({ url: base, type: "home" });
  }

  if (type) list = list.filter((p) => p.type === type);
  const counts = {};
  list.forEach((p) => (counts[p.type] = (counts[p.type] ?? 0) + 1));
  return { source, total: list.length, counts, pages: list };
}

async function sitemapUrls(url, type = null, depth = 0) {
  const res = await get(url);
  if (res.status !== 200 || depth > 2) return [];
  const locs = [...res.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
  if (/<sitemapindex\b/i.test(res.body)) {
    const out = [];
    for (const loc of locs) {
      if (/wp-sitemap-users|\/author-sitemap/i.test(loc)) continue; // author archives are not pages to check
      const m = loc.match(/wp-sitemap-(posts|taxonomies)-([a-z0-9_-]+?)-\d+\.xml/i);
      const plugin = loc.match(/\/([a-z0-9_-]+?)-sitemap\d*\.xml/i);
      const childType = m ? (m[1] === "taxonomies" ? `taxonomy:${m[2]}` : m[2]) : plugin ? plugin[1] : null;
      out.push(...(await sitemapUrls(loc, childType, depth + 1)));
    }
    return out;
  }
  return locs.map((loc) => ({ url: loc, type: type ?? "url" }));
}

// ---------- check ----------

async function checkPages(urls, withLinks) {
  const results = [];
  for (const url of urls) results.push(await checkPage(url));

  // Duplicates across the checked pages
  const duplicates = [];
  for (const field of ["title", "description"]) {
    const seen = new Map();
    results.forEach((r) => {
      const value = r.data?.[field];
      if (value) seen.set(value, [...(seen.get(value) ?? []), r.url]);
    });
    for (const [value, pagesWithIt] of seen)
      if (pagesWithIt.length > 1) duplicates.push({ severity: "warning", check: `duplicate-${field}`, value, pages: pagesWithIt });
  }

  if (withLinks) {
    const origin = new URL(urls[0]).origin;
    const internal = new Set();
    results.forEach((r) =>
      (r.internalLinks ?? []).forEach((href) => internal.size < MAX_LINKS && internal.add(href))
    );
    const broken = [];
    for (const href of internal) {
      let res = await get(href, "HEAD").catch(() => null);
      if (!res || res.status === 405) res = await get(href).catch(() => null);
      if (!res || res.status >= 400) {
        const on = results.filter((r) => r.internalLinks?.includes(href)).map((r) => r.url);
        broken.push({ severity: "error", check: "broken-link", href, status: res?.status ?? "no response", on });
      }
    }
    results.forEach((r) => delete r.internalLinks);
    return { origin, pages: results, duplicates, linksChecked: internal.size, brokenLinks: broken, summary: summary(results, duplicates, broken) };
  }

  results.forEach((r) => delete r.internalLinks);
  return { pages: results, duplicates, summary: summary(results, duplicates, []) };
}

function summary(results, duplicates, broken) {
  const count = (sev) =>
    results.reduce((n, r) => n + r.issues.filter((i) => i.severity === sev).length, 0) +
    [...duplicates, ...broken].filter((i) => i.severity === sev).length;
  return { pages: results.length, errors: count("error"), warnings: count("warning"), info: count("info") };
}

async function checkPage(url) {
  const issues = [];
  const add = (severity, check, found, expected) => issues.push({ severity, check, found, expected });

  let res;
  try {
    res = await get(url);
  } catch (error) {
    return { url, status: null, issues: [{ severity: "error", check: "fetch", found: error.message, expected: "Page loads" }] };
  }
  if (res.status !== 200) add("error", "http-status", `HTTP ${res.status}`, "200");
  if (res.redirects.length) add("warning", "redirect", `${url} -> ${res.url}`, "Link to the final URL directly");
  if (!/text\/html/i.test(res.headers.get("content-type") ?? "")) {
    return { url, status: res.status, issues };
  }

  const p = parse(res.body);
  const finalUrl = res.url;
  const title = p.titles[0] ?? null;

  // Head
  if (!p.lang) add("error", "html-lang", "Missing", "<html lang> via language_attributes()");
  if (!p.viewport) add("error", "viewport", "Missing", '<meta name="viewport">');
  if (!title) add("error", "title", "Missing", "add_theme_support('title-tag') and a page title");
  else if (title.length < 30 || title.length > 60) add("warning", "title-length", `${title.length} chars: "${title}"`, "30-60 characters");
  if (p.titles.length > 1) add("error", "title-multiple", `${p.titles.length} <title> tags`, "Exactly one");

  if (!p.description) add("warning", "meta-description", "Missing", "A unique description per page (SEO plugin or theme field)");
  else if (p.description.length < 70 || p.description.length > 160)
    add("warning", "meta-description-length", `${p.description.length} chars`, "70-160 characters");

  const xRobots = res.headers.get("x-robots-tag") ?? "";
  if (/noindex/i.test(`${p.robots ?? ""} ${xRobots}`)) add("error", "noindex", p.robots ?? `X-Robots-Tag: ${xRobots}`, "Indexable");
  else if (/nofollow/i.test(p.robots ?? "")) add("warning", "nofollow", p.robots, "Links followed");

  if (!p.canonicals.length) add("warning", "canonical", "Missing", '<link rel="canonical"> to this URL');
  else if (p.canonicals.length > 1) add("error", "canonical-multiple", `${p.canonicals.length} canonical tags`, "Exactly one");
  else if (normalize(new URL(p.canonicals[0], finalUrl).href) !== normalize(finalUrl))
    add("warning", "canonical-target", p.canonicals[0], `${finalUrl} (unless intentional)`);

  const ogMissing = Object.entries(p.og).filter(([, v]) => !v).map(([k]) => `og:${k}`);
  if (ogMissing.length) add("warning", "open-graph", `Missing ${ogMissing.join(", ")}`, "og:title, og:description, og:image, og:url");
  if (!p.twitterCard) add("info", "twitter-card", "Missing", '<meta name="twitter:card">');
  if (!p.icon) add("info", "site-icon", "Missing", "Appearance > Customize > Site Identity > Site Icon");

  // Headings
  const h1s = p.headings.filter((h) => h.level === 1);
  if (!h1s.length) add("error", "h1", "Missing", "Exactly one h1");
  else if (h1s.length > 1) add("error", "h1-multiple", h1s.map((h) => `"${h.text}"`).join(", "), "Exactly one h1");
  if (h1s.some((h) => !h.text)) add("error", "h1-empty", "Empty h1", "h1 with text");
  let previous = 0;
  for (const h of p.headings) {
    if (previous && h.level > previous + 1) add("warning", "heading-order", `h${previous} -> h${h.level} "${h.text}"`, "No skipped levels");
    previous = h.level;
  }

  // Images
  p.images.forEach((img, index) => {
    const src = img.src ?? img["data-src"] ?? "(no src)";
    const name = src.split("/").pop();
    if (!("alt" in img)) add("error", "img-alt", name, "alt attribute (Media Library alt text)");
    else if (!img.alt.trim()) add("info", "img-alt-empty", name, "Empty alt is correct only for decorative images");
    if (!img.width || !img.height) add("warning", "img-dimensions", name, "width and height attributes (prevents layout shift)");
    if (index === 0 && img.loading === "lazy") add("warning", "first-image-lazy", name, "Above-the-fold image: loading=eager, fetchpriority=high");
  });

  // Links
  const origin = new URL(finalUrl).origin;
  const internalLinks = new Set();
  p.links.forEach((link) => {
    const href = (link.href ?? "").trim();
    if (!href || href === "#" || /^javascript:/i.test(href)) {
      add("warning", "link-placeholder", `href="${href}" text "${link.text}"`, "A real URL, or a <button> for actions");
      return;
    }
    if (!link.text) add("warning", "link-text", href, "Visible text, aria-label, or image alt");
    let abs;
    try {
      abs = new URL(href, finalUrl);
    } catch {
      add("warning", "link-invalid", href, "Valid URL");
      return;
    }
    if (abs.origin === origin && /^https?:$/.test(abs.protocol)) {
      abs.hash = "";
      if (!/\/wp-(admin|login)/.test(abs.pathname)) internalLinks.add(abs.href);
      if (/\bnofollow\b/i.test(link.rel)) add("info", "internal-nofollow", href, "Internal links followed");
    }
  });

  // Structured data
  if (!p.jsonLd.length) add("info", "structured-data", "None", "JSON-LD (Organization, WebSite, BreadcrumbList) when wanted");
  p.jsonLd.forEach((block, i) => {
    try {
      JSON.parse(block);
    } catch (error) {
      add("error", "structured-data-invalid", `JSON-LD block ${i + 1}: ${error.message}`, "Valid JSON");
    }
  });

  return {
    url,
    finalUrl,
    status: res.status,
    data: {
      title,
      description: p.description,
      canonical: p.canonicals[0] ?? null,
      robots: p.robots,
      lang: p.lang,
      seoPlugin: p.plugin,
      h1: h1s.map((h) => h.text),
      headings: p.headings.map((h) => `h${h.level} ${h.text}`.slice(0, 90)),
      images: p.images.length,
      links: p.links.length,
      jsonLdBlocks: p.jsonLd.length,
    },
    issues,
    internalLinks: [...internalLinks],
  };
}

function installBase(url) {
  const u = new URL(url);
  u.search = "";
  u.hash = "";
  if (!u.pathname.endsWith("/")) u.pathname += "/";
  return u.href;
}

function normalize(url) {
  const u = new URL(url);
  u.hash = "";
  return u.href.replace(/\/$/, "");
}
