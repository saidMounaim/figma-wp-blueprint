# ACF local JSON shapes

ACF fills defaults for omitted field settings when it loads local JSON, so keep
files readable: include `key`, `label`, `name`, `type`, and the settings that
matter. Set `modified` to the current Unix time on every edit.

## Page builder: group_page_builder.json

One Flexible Content field. Each layout holds a single seamless Clone of its
section group, so section fields live in their own file.

```json
{
  "key": "group_page_builder",
  "title": "Page Builder",
  "fields": [
    {
      "key": "field_page_builder_page_sections",
      "label": "Sections",
      "name": "page_sections",
      "type": "flexible_content",
      "button_label": "Add Section",
      "layouts": {
        "layout_hero": {
          "key": "layout_hero",
          "name": "hero",
          "label": "Hero",
          "display": "block",
          "sub_fields": [
            {
              "key": "field_layout_hero_clone",
              "label": "Hero",
              "name": "hero",
              "type": "clone",
              "clone": ["group_section_hero"],
              "display": "seamless",
              "layout": "block",
              "prefix_label": 0,
              "prefix_name": 0
            }
          ]
        }
      }
    }
  ],
  "location": [
    [{ "param": "post_type", "operator": "==", "value": "page" }]
  ],
  "position": "normal",
  "style": "seamless",
  "label_placement": "top",
  "hide_on_screen": ["the_content"],
  "active": true,
  "modified": 1760000000
}
```

To add a section, add one entry under `layouts` with keys `layout_<layout>` and
`field_layout_<layout>_clone`.

## Section group: group_section_hero.json

Inactive, so it only appears through the clone. Templates read these with
`get_sub_field()` because the seamless clone keeps the original names.

```json
{
  "key": "group_section_hero",
  "title": "Section: Hero",
  "fields": [
    { "key": "field_section_hero_eyebrow", "label": "Eyebrow", "name": "eyebrow", "type": "text" },
    { "key": "field_section_hero_heading", "label": "Heading", "name": "heading", "type": "text", "required": 1 },
    { "key": "field_section_hero_text", "label": "Text", "name": "text", "type": "wysiwyg", "tabs": "visual", "toolbar": "basic", "media_upload": 0 },
    { "key": "field_section_hero_image", "label": "Image", "name": "image", "type": "image", "return_format": "id", "preview_size": "medium" },
    { "key": "field_section_hero_button", "label": "Button", "name": "button", "type": "link", "return_format": "array" },
    {
      "key": "field_section_hero_items",
      "label": "Items",
      "name": "items",
      "type": "repeater",
      "layout": "block",
      "button_label": "Add Item",
      "sub_fields": [
        { "key": "field_section_hero_items_title", "label": "Title", "name": "title", "type": "text" }
      ]
    }
  ],
  "location": [
    [{ "param": "post_type", "operator": "==", "value": "post" }]
  ],
  "active": false,
  "modified": 1760000000
}
```

## Options page: group_theme_settings.json

```json
{
  "key": "group_theme_settings",
  "title": "Theme Settings",
  "fields": [
    { "key": "field_theme_settings_tab_header", "label": "Header", "name": "", "type": "tab" },
    { "key": "field_theme_settings_header_cta", "label": "Header CTA", "name": "header_cta", "type": "link", "return_format": "array" },
    { "key": "field_theme_settings_tab_footer", "label": "Footer", "name": "", "type": "tab" },
    { "key": "field_theme_settings_footer_text", "label": "Footer text", "name": "footer_text", "type": "textarea", "rows": 3, "new_lines": "br" }
  ],
  "location": [
    [{ "param": "options_page", "operator": "==", "value": "theme-settings" }]
  ],
  "active": true,
  "modified": 1760000000
}
```

## CPT fields: group_project_fields.json

```json
{
  "key": "group_project_fields",
  "title": "Project Details",
  "fields": [
    { "key": "field_project_fields_client", "label": "Client", "name": "client", "type": "text" },
    { "key": "field_project_fields_gallery", "label": "Gallery", "name": "gallery", "type": "gallery", "return_format": "id" }
  ],
  "location": [
    [{ "param": "post_type", "operator": "==", "value": "project" }]
  ],
  "position": "acf_after_title",
  "active": true,
  "modified": 1760000000
}
```

## Reading fields safely

| Field type | Read | Output |
| --- | --- | --- |
| text, textarea | `get_sub_field( 'heading' )` | `esc_html( $heading )` |
| wysiwyg | `get_sub_field( 'text' )` | `wp_kses_post( $text )` |
| image (ID) | `get_sub_field( 'image' )` | `wp_get_attachment_image( $image, 'large', false, array( 'class' => 'x__image' ) )` |
| link (array) | `get_sub_field( 'button' )` | `esc_url( $button['url'] )`, `esc_html( $button['title'] )`, `esc_attr( $button['target'] ?: '_self' )` |
| url | `get_sub_field( 'url' )` | `esc_url( $url )` |
| repeater | `have_rows( 'items' )` / `the_row()` / `get_sub_field()` | per sub-field type |
| option | `{prefix}_option( 'footer_text' )` | per field type |
| CPT field | `get_field( 'client' )` inside the loop | per field type |
