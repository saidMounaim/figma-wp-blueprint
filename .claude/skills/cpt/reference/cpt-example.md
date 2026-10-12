# CPT example: project

## inc/post-types/project.php

```php
<?php
defined( 'ABSPATH' ) || exit;

function {prefix}_register_project() {
	register_post_type(
		'project',
		array(
			'labels'        => array(
				'name'               => __( 'Projects', '{text-domain}' ),
				'singular_name'      => __( 'Project', '{text-domain}' ),
				'add_new_item'       => __( 'Add New Project', '{text-domain}' ),
				'edit_item'          => __( 'Edit Project', '{text-domain}' ),
				'new_item'           => __( 'New Project', '{text-domain}' ),
				'view_item'          => __( 'View Project', '{text-domain}' ),
				'search_items'       => __( 'Search Projects', '{text-domain}' ),
				'not_found'          => __( 'No projects found', '{text-domain}' ),
				'not_found_in_trash' => __( 'No projects found in Trash', '{text-domain}' ),
				'all_items'          => __( 'All Projects', '{text-domain}' ),
				'menu_name'          => __( 'Projects', '{text-domain}' ),
			),
			'public'        => true,
			'has_archive'   => true,
			'rewrite'       => array(
				'slug'       => 'projects',
				'with_front' => false,
			),
			'menu_icon'     => 'dashicons-portfolio',
			'menu_position' => 20,
			'supports'      => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
			'show_in_rest'  => true,
		)
	);

	register_taxonomy(
		'project_category',
		'project',
		array(
			'labels'            => array(
				'name'          => __( 'Project Categories', '{text-domain}' ),
				'singular_name' => __( 'Project Category', '{text-domain}' ),
			),
			'hierarchical'      => true,
			'public'            => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => array(
				'slug'       => 'projects/category',
				'with_front' => false,
			),
		)
	);
}
add_action( 'init', '{prefix}_register_project' );

function {prefix}_project_archive_query( $query ) {
	if ( ! is_admin() && $query->is_main_query() && ( $query->is_post_type_archive( 'project' ) || $query->is_tax( 'project_category' ) ) ) {
		$query->set( 'posts_per_page', 9 );
	}
}
add_action( 'pre_get_posts', '{prefix}_project_archive_query' );
```

## archive-project.php

```php
<?php
defined( 'ABSPATH' ) || exit;

get_header();
?>
<main id="main" class="site-main project-archive">
	<div class="container">
		<h1 class="project-archive__title"><?php post_type_archive_title(); ?></h1>

		<?php if ( have_posts() ) : ?>
			<div class="project-archive__grid">
				<?php
				while ( have_posts() ) {
					the_post();
					get_template_part( 'template-parts/components/project-card' );
				}
				?>
			</div>
			<?php the_posts_pagination(); ?>
		<?php else : ?>
			<p class="project-archive__empty"><?php esc_html_e( 'No projects yet.', '{text-domain}' ); ?></p>
		<?php endif; ?>
	</div>
</main>
<?php
get_footer();
```

## Listing the CPT inside a section

```php
$projects = new WP_Query(
	array(
		'post_type'      => 'project',
		'posts_per_page' => 3,
		'no_found_rows'  => true,
	)
);

if ( $projects->have_posts() ) {
	while ( $projects->have_posts() ) {
		$projects->the_post();
		get_template_part( 'template-parts/components/project-card' );
	}
	wp_reset_postdata();
}
```
