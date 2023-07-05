/*
Copyright 2014 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#ifndef SVGViewer_SVGParser_h
#define SVGViewer_SVGParser_h

#ifdef __cplusplus

#include "Config.h"
#include "SVGRenderer.h"

#include <array>
#include <map>
#include <memory>
#include <string>
#include <vector>

#ifdef STYLE_SUPPORT
namespace StyleSheet
{
class CssDocument;
}
#endif

namespace SVGNative
{
class SVGDocumentImpl;
class SVGRenderer;
using ColorMap = std::map<std::string, std::array<float, 4>>;

class SVG_IMP_EXP SVGDocument
{
public:
    /**
     * Parses the passed string as SVG.
     * @param s SVG content as string.
     * @param renderer The renderer provides the Transform, Shape and Path interface needed at parse time and
     *      the actual renderer used during rendering process.
     * @return Returns a pointer to a new SVGDocument object.
     */
    static std::unique_ptr<SVGDocument> CreateSVGDocument(const char* s, std::shared_ptr<SVGNative::SVGRenderer> renderer);

    ~SVGDocument();

    /**
     * Get the horizontal dimension of the SVG document in local coordinates.
     * @return Horizontal dimension of the SVG document in local coordinates.
     */
    std::int32_t Width() const;

    /**
     * Get the vertical dimension of the SVG document in local coordinates.
     * @return Vertical dimension of the SVG document in local coordinates.
     */
    std::int32_t Height() const;

    /**
     * Renderer used to draw SVG content to. This was passed to ParserSVG() first.
     * @return SVGRenderer
     */
    SVGNative::SVGRenderer* Renderer() const;

#ifdef STYLE_SUPPORT
    /**
     * Add a custom CSS stylesheet to the cascading of the document.
     * @param cssDocument CSS style sheet.
     * @deprecated This method is deprecated and will get removed.
     */
    void AddCustomCSS(const StyleSheet::CssDocument* cssDocument);

    /**
     * Remove all CSS stylesheets added by AddCustomCSS.
     * @deprecated This method is deprecated and will get removed.
     */
    void ClearCustomCSS();
#endif

    /**
     * Renders the parsed SVG document to renderer. Some clients require a separation
     * between parsing and rendering to reuse the rendering tree with different
     * color variables.
     */
    void Render();

    /**
     * Renders the parsed SVG document to renderer. Some clients require a separation
     * between parsing and rendering to reuse the rendering tree with different
     * color variables.
     * The viewport of the SVG document will be scaled uniformly to fit into the area
     * defined by the width and height arguments.
     * @param width Horizontal dimension of surface.
     * @param height Vertical dimension of surface.
     */
    void Render(float width, float height);

    /**
     * Renders the parsed SVG document to renderer. Some clients require a separation
     * between parsing and rendering to reuse the rendering tree with different
     * color variables.
     * @param colorMap A string-to-Color map for pre-defined colors that replace
     *      CSS custom properties in the SVG file.
     *
     * @code
     * // Define the color map:
     * ColorMap colorMap = {
     *     {"myCustomFillColor",   {{0.52,  0.0, 0.0, 1.0}}},
     *     {"myCustomStrokeColor", {{ 0.0, 0.52, 0.0, 1.0}}}
     * };
     *
     * // Replaces colors defined in SVG with a CSS Custom Property:
     * // <svg viewBox="0 0 200 200">
     * //     <rect width="200" height="200" fill="var(--myCustomFillColor, #F00)"/>
     * //     <rect width="200" height="200" stroke="var(--myCustomStrokeColor, #0F0)"/>
     * // </svg>
     * // Note: var() consists of a custom name and, optionally, a comma separated fallback CSS color.
     * @encode
     */
    void Render(const ColorMap& colorMap);

    /**
     * Renders the parsed SVG document to renderer. Some clients require a separation
     * between parsing and rendering to reuse the rendering tree with different
     * color variables.
     * The viewport of the SVG document will be scaled uniformly to fit into the area
     * defined by the width and height arguments.
     * @param colorMap A string-to-Color map for pre-defined colors that replace
     *      CSS custom properties in the SVG file.
     * @param width Horizontal dimension of surface.
     * @param height Vertical dimension of surface.
     *
     * @code
     * // Define the color map:
     * ColorMap colorMap = {
     *     {"myCustomFillColor",   {{0.52,  0.0, 0.0, 1.0}}},
     *     {"myCustomStrokeColor", {{ 0.0, 0.52, 0.0, 1.0}}}
     * };
     *
     * // Replaces colors defined in SVG with a CSS Custom Property:
     * // <svg viewBox="0 0 200 200">
     * //     <rect width="200" height="200" fill="var(--myCustomFillColor, #F00)"/>
     * //     <rect width="200" height="200" stroke="var(--myCustomStrokeColor, #0F0)"/>
     * // </svg>
     * // Note: var() consists of a custom name and, optionally, a comma separated fallback CSS color.
     * @encode
     */
    void Render(const ColorMap& colorMap, float width, float height);

    /**
     * Renders the subtree of an element with the given XML ID.
     */
    void Render(const char* id);

    /**
     * Renders the subtree of an element with the given XML ID.
     * See /ref Render(float width, float height) for details.
     */
    void Render(const char* id, float width, float height);

    /**
     * Renders the subtree of an element with the given XML ID.
     * See /ref Render(const ColorMap& colorMap) for details.
     */
    void Render(const char* id, const ColorMap& colorMap);

    /**
     * Renders the subtree of an element with the given XML ID.
     * See /ref Render(const ColorMap& colorMap, float width, float height) for details.
     */
    void Render(const char* id, const ColorMap& colorMap, float width, float height);

    /**
     * Retrieves the bounds of the SVG Document.
     *
     * The bounds are as tightly computed as possible. The rendering port's canvas
     * is used to calculate the bounds so the user must make sure that a context has been
     * set, otherwise an assertion will fire.
     */
    bool GetBoundingBox(Rect& bounds);

    /**
     * Retrieves the bounds of the subtree of an element with the given XML ID.
     *
     * The bounds are as tightly computed as possible. The rendering port's canvas
     * is used to calculate the bounds so the user must make sure that a context has been
     * set, otherwise an assertion will fire.
     */
    bool GetBoundingBox(const char* id, Rect& bounds);
    
    void GetViewBox(Rect& viewBox);
    
private:
    SVGDocument();

    std::unique_ptr<SVGDocumentImpl> mDocument;
};

} // namespace SVGNative

#endif // __cplusplus

#endif // SVGViewer_SVGParser_h
