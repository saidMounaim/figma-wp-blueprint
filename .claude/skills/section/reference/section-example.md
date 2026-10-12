# Section example: hero

ACF layout `hero`, files `hero.php`, `hero.css`, `hero.js`. Field shapes are in
`../../acf/reference/acf-json.md`.

## template-parts/sections/hero.php

```php
<?php
defined( 'ABSPATH' ) || exit;

$eyebrow = get_sub_field( 'eyebrow' );
$heading = get_sub_field( 'heading' );
$text    = get_sub_field( 'text' );
$image   = get_sub_field( 'image' );
$button  = get_sub_field( 'button' );

if ( ! $heading ) {
	return;
}
?>
<section class="hero" data-section="hero">
	<div class="container hero__inner">
		<div class="hero__content">
			<?php if ( $eyebrow ) : ?>
				<p class="hero__eyebrow"><?php echo esc_html( $eyebrow ); ?></p>
			<?php endif; ?>

			<h1 class="hero__title"><?php echo esc_html( $heading ); ?></h1>

			<?php if ( $text ) : ?>
				<div class="hero__text"><?php echo wp_kses_post( $text ); ?></div>
			<?php endif; ?>

			<?php if ( $button ) : ?>
				<?php get_template_part( 'template-parts/components/button', null, array( 'link' => $button ) ); ?>
			<?php endif; ?>
		</div>

		<?php if ( $image ) : ?>
			<?php
			echo wp_get_attachment_image(
				$image,
				'large',
				false,
				array(
					'class'         => 'hero__image',
					'loading'       => 'eager',
					'fetchpriority' => 'high',
				)
			);
			?>
		<?php endif; ?>
	</div>
</section>
```

## template-parts/components/button.php

```php
<?php
defined( 'ABSPATH' ) || exit;

$link    = $args['link'] ?? null;
$variant = $args['variant'] ?? 'primary';

if ( empty( $link['url'] ) ) {
	return;
}
?>
<a class="button button--<?php echo esc_attr( $variant ); ?>"
	href="<?php echo esc_url( $link['url'] ); ?>"
	target="<?php echo esc_attr( $link['target'] ?: '_self' ); ?>"
	<?php echo '_blank' === $link['target'] ? 'rel="noopener"' : ''; ?>>
	<?php echo esc_html( $link['title'] ); ?>
</a>
```

## assets/css/sections/hero.css

```css
.hero {
	--hero-gap: var(--space-8);

	padding-block: clamp(var(--space-12), 8vw, var(--space-24));
	background-color: var(--color-surface);
}

.hero__inner {
	display: grid;
	gap: var(--hero-gap);
	align-items: center;
}

.hero__eyebrow {
	font-size: var(--fs-eyebrow);
	letter-spacing: var(--ls-eyebrow);
	text-transform: uppercase;
	color: var(--color-primary);
}

.hero__title {
	font-size: var(--fs-h1);
	line-height: var(--lh-h1);
	margin-block: var(--space-4) var(--space-6);
}

.hero__image {
	width: 100%;
	height: auto;
	aspect-ratio: 4 / 3;
	object-fit: cover;
	border-radius: var(--radius-lg);
}

@media (min-width: 1024px) {
	.hero__inner {
		grid-template-columns: 1fr 1fr;
	}
}
```

## assets/js/sections/hero.js (only when needed)

```js
{
	const roots = document.querySelectorAll('[data-section="hero"]');

	roots.forEach((root) => {
		// behavior scoped to this root
	});
}
```
