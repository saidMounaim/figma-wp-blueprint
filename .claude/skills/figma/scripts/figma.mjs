#!/usr/bin/env node
// Figma REST API helper for wp-ai-workflow. No dependencies (Node 18+).
// Token: FIGMA_TOKEN env var, or FIGMA_TOKEN=... in .env at the project root.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const API = "https://api.figma.com/v1";
const CACHE_DIR = "blueprint/.state/figma";

const USAGE = `Usage: node .claude/skills/figma/scripts/figma.mjs <command> [url] [options]

Commands:
  check                      verify the token works
  parse   <url>              show file key and node id from a Figma URL
  outline <url> [--depth N]  print the layer tree (default depth 3)
  node    <url> [--depth N] [--out file]
                             save a simplified JSON tree of the node (default: full depth)
  tokens  <url>              aggregate colors, text styles, spacing, radii, effects
  images  <url> [--ids a:b,c:d] [--scale 2] [--format png|jpg|svg] [--out dir]
                             render nodes as images (default: the URL node)
  fills   <url> [--out dir]  download image fills (photos) used inside the node

URLs: figma.com/design|file|proto|board/<key>/...?node-id=12-34`;

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

async function main() {
  const [command, url, ...rest] = process.argv.slice(2);
  const options = parseOptions(rest);

  switch (command) {
    case "check":
      return check();
    case "parse":
      return console.log(JSON.stringify(parseUrl(url), null, 2));
    case "outline":
      return outline(parseUrl(url), Number(options.depth ?? 3));
    case "node":
      return saveNode(parseUrl(url), options);
    case "tokens":
      return tokens(parseUrl(url));
    case "images":
      return images(parseUrl(url), options);
    case "fills":
      return fills(parseUrl(url), options);
    default:
      console.log(USAGE);
      process.exit(command ? 1 : 0);
  }
}

function parseOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) options[args[i].slice(2)] = args[++i];
  }
  return options;
}

export function parseUrl(url) {
  if (!url) throw new Error("A Figma URL is required.");
  const parsed = new URL(url);
  const match = parsed.pathname.match(/\/(?:design|file|proto|board)\/([A-Za-z0-9]+)/);
  if (!match) throw new Error(`Not a Figma file URL: ${url}`);
  // Branch URLs: /design/<key>/branch/<branchKey>/...
  const branch = parsed.pathname.match(/\/branch\/([A-Za-z0-9]+)/);
  const nodeParam = parsed.searchParams.get("node-id") ?? parsed.searchParams.get("starting-point-node-id");
  return {
    fileKey: branch ? branch[1] : match[1],
    nodeId: nodeParam ? decodeURIComponent(nodeParam).replace("-", ":") : null,
  };
}

async function token() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN.trim();
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    const line = (await readFile(envPath, "utf8"))
      .split(/\r?\n/)
      .find((l) => l.startsWith("FIGMA_TOKEN="));
    if (line) return line.slice("FIGMA_TOKEN=".length).trim().replace(/^["']|["']$/g, "");
  }
  throw new Error(
    "No Figma token. Create one at figma.com > Settings > Security > Personal access tokens " +
      "(scope: file content read-only), then add FIGMA_TOKEN=... to .env in the project root."
  );
}

async function api(path, attempt = 0) {
  const response = await fetch(`${API}${path}`, { headers: { "X-Figma-Token": await token() } });
  if (response.status === 429 && attempt < 3) {
    const wait = Number(response.headers.get("retry-after") ?? 10);
    console.error(`Rate limited, waiting ${wait}s...`);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return api(path, attempt + 1);
  }
  if (response.status === 403) throw new Error("403 from Figma: token invalid, expired, or no access to this file.");
  if (response.status === 404) throw new Error("404 from Figma: file or node not found (check the URL and file access).");
  if (!response.ok) throw new Error(`Figma API ${response.status}: ${await response.text()}`);
  return response.json();
}

async function check() {
  const me = await api("/me");
  console.log(`Token OK for ${me.handle}.`);
}

async function fetchNode({ fileKey, nodeId }, depth) {
  const depthParam = depth ? `&depth=${depth}` : "";
  if (!nodeId) {
    const file = await api(`/files/${fileKey}?depth=${depth ?? 2}`);
    return { document: file.document, styles: file.styles ?? {}, components: file.components ?? {}, name: file.name };
  }
  const data = await api(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}${depthParam}`);
  const entry = data.nodes[nodeId];
  if (!entry) throw new Error(`Node ${nodeId} not found in file ${fileKey}.`);
  return { document: entry.document, styles: entry.styles ?? {}, components: entry.components ?? {}, name: data.name };
}

async function outline(ref, depth) {
  const { document, name } = await fetchNode(ref, depth + 1);
  console.log(`File: ${name}`);
  const walk = (node, level) => {
    if (level > depth) return;
    const box = node.absoluteBoundingBox;
    const size = box ? ` ${Math.round(box.width)}x${Math.round(box.height)}` : "";
    const hidden = node.visible === false ? " (hidden)" : "";
    console.log(`${"  ".repeat(level)}${node.type} "${node.name}" [${node.id}]${size}${hidden}`);
    for (const child of node.children ?? []) walk(child, level + 1);
  };
  walk(document, 0);
}

async function saveNode(ref, options) {
  const raw = await fetchNode(ref, options.depth ? Number(options.depth) : undefined);
  const origin = raw.document.absoluteBoundingBox ?? { x: 0, y: 0 };
  const tree = simplify(raw.document, origin, raw.styles, raw.components);
  const out = options.out ?? join(CACHE_DIR, `${ref.fileKey}-${(ref.nodeId ?? "root").replace(":", "-")}.json`);
  await mkdir(resolve(out, ".."), { recursive: true });
  await writeFile(out, JSON.stringify({ file: raw.name, fileKey: ref.fileKey, ...tree }, null, 1));
  console.log(`Saved ${out}`);
}

const round = (n) => (typeof n === "number" ? Math.round(n * 100) / 100 : n);

function hex({ r, g, b }) {
  return "#" + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function paint(p) {
  if (p.visible === false) return null;
  const opacity = round((p.opacity ?? 1) * (p.color?.a ?? 1));
  if (p.type === "SOLID") return opacity === 1 ? hex(p.color) : `${hex(p.color)} @${opacity}`;
  if (p.type === "IMAGE") return { image: p.imageRef, scaleMode: p.scaleMode };
  if (p.type.startsWith("GRADIENT")) {
    return { gradient: p.type, stops: p.gradientStops.map((s) => `${hex(s.color)} @${round(s.color.a)} ${round(s.position * 100)}%`) };
  }
  return { type: p.type };
}

function effect(e) {
  if (e.visible === false) return null;
  if (e.type.includes("SHADOW")) {
    return `${e.type === "INNER_SHADOW" ? "inset " : ""}${round(e.offset.x)}px ${round(e.offset.y)}px ${round(e.radius)}px ${round(e.spread ?? 0)}px ${hex(e.color)} @${round(e.color.a)}`;
  }
  return `${e.type} ${round(e.radius)}px`;
}

function simplify(node, origin, styles, components) {
  const out = { id: node.id, name: node.name, type: node.type };
  if (node.visible === false) out.hidden = true;
  const box = node.absoluteBoundingBox;
  if (box) out.box = { x: round(box.x - origin.x), y: round(box.y - origin.y), w: round(box.width), h: round(box.height) };

  if (node.layoutMode && node.layoutMode !== "NONE") {
    out.layout = {
      mode: node.layoutMode,
      gap: node.itemSpacing,
      padding: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].map((v) => v ?? 0),
      main: node.primaryAxisAlignItems,
      cross: node.counterAxisAlignItems,
      wrap: node.layoutWrap === "WRAP" ? true : undefined,
    };
  }
  if (node.layoutSizingHorizontal) out.sizing = [node.layoutSizingHorizontal, node.layoutSizingVertical];
  if (node.cornerRadius) out.radius = node.cornerRadius;
  if (node.rectangleCornerRadii) out.radius = node.rectangleCornerRadii;
  if (node.opacity !== undefined && node.opacity !== 1) out.opacity = round(node.opacity);
  if (node.clipsContent) out.clips = true;

  const fills = (node.fills ?? []).map(paint).filter(Boolean);
  if (fills.length) out.fills = fills;
  const strokes = (node.strokes ?? []).map(paint).filter(Boolean);
  if (strokes.length) out.stroke = { paints: strokes, weight: node.strokeWeight, align: node.strokeAlign };
  const effects = (node.effects ?? []).map(effect).filter(Boolean);
  if (effects.length) out.effects = effects;

  if (node.styles) {
    out.styleNames = Object.fromEntries(
      Object.entries(node.styles).map(([kind, id]) => [kind, styles[id]?.name ?? id])
    );
  }
  if (node.type === "INSTANCE" && components[node.componentId]) out.component = components[node.componentId].name;

  if (node.type === "TEXT") {
    const s = node.style ?? {};
    out.text = node.characters;
    out.font = {
      family: s.fontFamily,
      weight: s.fontWeight,
      size: s.fontSize,
      lineHeight: s.lineHeightPx ? round(s.lineHeightPx) : undefined,
      letterSpacing: s.letterSpacing ? round(s.letterSpacing) : undefined,
      case: s.textCase,
      decoration: s.textDecoration,
      align: s.textAlignHorizontal,
      italic: s.italic || undefined,
    };
    if (node.characterStyleOverrides?.some((v) => v !== 0)) out.mixedStyles = true;
  }

  if (node.children?.length) out.children = node.children.map((c) => simplify(c, origin, styles, components));
  return out;
}

async function tokens(ref) {
  const { document } = await fetchNode(ref);
  const count = () => new Map();
  const add = (map, key) => key !== undefined && key !== null && map.set(key, (map.get(key) ?? 0) + 1);
  const colors = count(), text = count(), families = count(), spacing = count(), radii = count(), shadows = count(), frames = count();

  const walk = (node, depth) => {
    if (node.visible === false) return;
    if (depth === 1 && node.absoluteBoundingBox) add(frames, `${node.name} - ${Math.round(node.absoluteBoundingBox.width)}px`);
    for (const p of [...(node.fills ?? []), ...(node.strokes ?? [])]) {
      const v = paint(p);
      if (typeof v === "string") add(colors, v);
    }
    for (const e of node.effects ?? []) if (e.type.includes("SHADOW") && e.visible !== false) add(shadows, effect(e));
    if (node.layoutMode && node.layoutMode !== "NONE") {
      add(spacing, node.itemSpacing);
      for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) add(spacing, node[k]);
    }
    if (node.cornerRadius) add(radii, node.cornerRadius);
    if (node.type === "TEXT" && node.style) {
      const s = node.style;
      add(families, `${s.fontFamily} ${s.fontWeight}${s.italic ? " italic" : ""}`);
      add(text, `${s.fontFamily} ${s.fontWeight} ${s.fontSize}px / ${round(s.lineHeightPx)}px ls ${round(s.letterSpacing ?? 0)}${s.textCase ? " " + s.textCase : ""}`);
    }
    for (const child of node.children ?? []) walk(child, depth + 1);
  };
  walk(document, 0);

  const sorted = (map, numeric) =>
    [...map.entries()].filter(([k]) => !numeric || k > 0).sort((a, b) => (numeric ? a[0] - b[0] : b[1] - a[1]));
  const print = (title, map, numeric = false) => {
    console.log(`\n## ${title}`);
    for (const [k, n] of sorted(map, numeric)) console.log(`- ${k}  (x${n})`);
  };
  console.log(`# Tokens from ${ref.fileKey} ${ref.nodeId ?? "(file)"}`);
  print("Direct children (the breakpoint frames when the URL is a page)", frames);
  print("Colors", colors);
  print("Font families and weights", families);
  print("Text styles", text);
  print("Spacing values (gap and padding, px)", spacing, true);
  print("Corner radii (px)", radii, true);
  print("Shadows", shadows);
}

async function download(url, file) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed ${response.status} for ${file}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}

async function images(ref, options) {
  const ids = options.ids ?? ref.nodeId;
  if (!ids) throw new Error("Pass a URL with node-id or --ids.");
  const format = options.format ?? "png";
  const scale = options.scale ?? (format === "svg" ? 1 : 2);
  const out = options.out ?? "blueprint/reference";
  await mkdir(out, { recursive: true });
  const data = await api(`/images/${ref.fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`);
  if (data.err) throw new Error(data.err);
  for (const [id, url] of Object.entries(data.images)) {
    if (!url) {
      console.error(`No render for ${id} (empty or hidden node).`);
      continue;
    }
    const file = join(out, `${options.name ?? "node"}-${id.replace(/[:;]/g, "-")}.${format}`);
    await download(url, file);
    console.log(`Saved ${file}`);
  }
}

async function fills(ref, options) {
  const { document } = await fetchNode(ref);
  const refs = new Set();
  const walk = (node) => {
    for (const p of node.fills ?? []) if (p.type === "IMAGE" && p.imageRef) refs.add(p.imageRef);
    for (const child of node.children ?? []) walk(child);
  };
  walk(document);
  if (!refs.size) return console.log("No image fills in this node.");
  const data = await api(`/files/${ref.fileKey}/images`);
  const out = options.out ?? "blueprint/reference/fills";
  await mkdir(out, { recursive: true });
  for (const imageRef of refs) {
    const url = data.meta?.images?.[imageRef];
    if (!url) continue;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed ${response.status} for ${imageRef}`);
    const type = response.headers.get("content-type") ?? "";
    const ext = type.includes("jpeg") ? "jpg" : type.includes("gif") ? "gif" : type.includes("webp") ? "webp" : "png";
    const file = join(out, `${imageRef}.${ext}`);
    await writeFile(file, Buffer.from(await response.arrayBuffer()));
    console.log(`Saved ${file}`);
  }
}
