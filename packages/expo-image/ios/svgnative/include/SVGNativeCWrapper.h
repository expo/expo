/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#ifndef SVGViewer_CWrapper_h
#define SVGViewer_CWrapper_h

#ifdef __cplusplus

#include "Config.h"
#include <stddef.h>


extern "C" {
/**
 * A renderer type used by an SVG Native context.
 */
typedef enum svg_native_renderer_type_t_ {
    SVG_RENDERER_UNKNOWN,
    SVG_RENDERER_CAIRO,
    SVG_RENDERER_CG,
    SVG_RENDERER_GDIPLUS,
    SVG_RENDERER_SKIA,
    SVG_RENDERER_STRING
} svg_native_renderer_type_t;

typedef struct svg_native_t_ svg_native_t;
typedef struct svg_native_color_map_t_ svg_native_color_map_t;
typedef void svg_native_renderer_t;

/**
 * Create a new color map. Multiple color maps can be created in parallel.
 * @return Pointer to the newly created color map. May be NULL on error.
 */
SVG_IMP_EXP svg_native_color_map_t* svg_native_color_map_create();
/**
 * Add a color with the given name key and the float values for red, green, blue and alpha
 * to the given color map.
 * If the name key is in use already, no color gets added.
 * All color values should be in the range [0..1].
 * @param color_map A pointer to an existing color map.
 * @param color_key The nama key for the new color to add.
 * @param red A float value in the range [0..1].
 * @param blue A float value in the range [0..1].
 * @param green A float value in the range [0..1].
 * @param alpha A float value in the range [0..1].
 */
SVG_IMP_EXP void svg_native_color_map_add(svg_native_color_map_t* color_map, const char* color_key, float red, float green, float blue, float alpha);
/**
 * Cleans up the color map with the given pointer. Do not use the pointer afterwards.
 */
SVG_IMP_EXP void svg_native_color_map_destroy(svg_native_color_map_t* color_map);


/**
 * Creates a new SVG Native context.
 * @param render_type The renderer type used for this SVG Native context instance.
 * @param document_string The SVG document to parse as string. Should be UTF8 encoded. UTF16 maybe supported.
 * @return The pointer to the newly created SVG Native context. May be NULL on error.
 */
SVG_IMP_EXP svg_native_t* svg_native_create(svg_native_renderer_type_t renderer_type, const char* document_string);

/**
 * Sets a color map to the provided SVG Native context. Only one color map can be used at
 * a time. Calling this function again will replace the currently used color map.
 * @param sn The SVG Native context.
 * @param color_map A pointer to a color map.
 */
SVG_IMP_EXP void svg_native_set_color_map(svg_native_t* sn, svg_native_color_map_t* color_map);
/**
 * Sets the native renderer used for the provided SVG Native context. The renderer
 * must match the renderer type specified for the provided SVG Native context.
 * Native renderers may be of type:
 * - `cairo_t*`
 * - `CGContextRef`
 * - `Gdiplus::Graphics*`
 * - `SkCanvas*`
 *
 * @param sn The SVG Native context.
 * @param renderer A pointer to the native renderer used by the provided SVG Native context.
 */
SVG_IMP_EXP void svg_native_set_renderer(svg_native_t* sn, svg_native_renderer_t* renderer);

/**
 * The horizontal dimension of the SVG canvas.
 * @param sn The SVG Native context.
 * @return The horizonal dimension.
 */
SVG_IMP_EXP float svg_native_canvas_width(svg_native_t* sn);
/**
 * The vertical dimension of the SVG canvas.
 * @param sn The SVG Native context.
 * @return The vertical dimension.
 */
SVG_IMP_EXP float svg_native_canvas_height(svg_native_t* sn);

/**
 * Renders the parsed SVG document of the provided SVG Native context to the
 * renderer of that context.
 * A renderer must be set first.
 * @param sn The SVG Native context.
 */
SVG_IMP_EXP void svg_native_render(svg_native_t* sn);
/**
 * Renders the parsed SVG document of the provided SVG Native context to the
 * renderer of that context. The SVG document will be rendered to fit into
 * the dimensions of the passed width and height arguments.
 * A renderer must be set first.
 * @param sn The SVG Native context.
 * @param width The horizontal dimension the SVG document needs to fit into. Must not be 0 or negetive.
 * @param height The vertical dimension the SVG document needs to fit into. Must not be 0 or negetive.
 */
SVG_IMP_EXP void svg_native_render_size(svg_native_t* sn, float width, float height);

#ifdef USE_TEXT
/**
 * Copy the output of Text port to new buffer.
 * The copied content is NULL-terminated, and the client must free it after using it.
 * @param sn The SVG Native context.
 * @param buff The pointer to store the address to the copied content.
 * @param length The pointer to store the content length without the last NULL.
 */
SVG_IMP_EXP void svg_native_get_output(svg_native_t* sn, char** buff, size_t* length);
#endif

/**
 * Destroys the provided SVG Native context. Do not use the pointer afterwards.
 */
SVG_IMP_EXP void svg_native_destroy(svg_native_t*);

}

#endif // __cplusplus

#endif /* SVGViewer_CWrapper_h */
