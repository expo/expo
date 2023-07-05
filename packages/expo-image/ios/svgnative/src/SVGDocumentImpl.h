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

#pragma once

#include "Rect.h"
#include "SVGRenderer.h"
#ifdef STYLE_SUPPORT
#include "StyleSheet/Document.h"
#include "StyleSheet/Parser.h"
#endif

#include <array>
#include <map>
#include <set>
#include <stack>
#include <string>
#include <tuple>
#include <vector>

namespace SVGNative
{
namespace xml
{
    class XMLNode;
}

struct GradientImpl;

// At this point we just support 'currentColor'
enum class ColorKeys
{
    kCurrentColor
};

using Variable = std::pair<std::string, Color>;
using ColorImpl = boost::variant<Color, Variable, ColorKeys>;
using PaintImpl = boost::variant<Color, GradientImpl, Variable, ColorKeys>;
using ColorStopImpl = std::tuple<float, ColorImpl, float>;
#ifdef STYLE_SUPPORT
using PropertySet = StyleSheet::CssPropertySet;
#else
using PropertySet = std::map<std::string, std::string>;
#endif

struct GradientImpl : public Gradient
{
    std::vector<ColorStopImpl> internalColorStops;
};

struct FillStyleImpl : public FillStyle
{
    PaintImpl internalPaint = Color{{0.0f, 0.0f, 0.0f, 1.0f}};

    // Other inherited properties. We handle them here for simplicity.
    bool visibility{true};
    ColorImpl color = Color{{0.0f, 0.0f, 0.0f, 1.0f}};
    WindingRule clipRule = WindingRule::kNonZero;
};

struct StrokeStyleImpl : public StrokeStyle
{
    PaintImpl internalPaint = Color{{0.0f, 0.0f, 0.0f, 1.0f}};
};

struct GraphicStyleImpl : public GraphicStyle
{
    // Other non-inherited properties
    bool display{true};
    float stopOpacity{1.0f};
    ColorImpl stopColor = Color{{0.0f, 0.0f, 0.0f, 1.0f}};
};

class SVGDocumentImpl
{
public:
    enum class ElementType
    {
        kImage,
        kGraphic,
        kGroup,
        kReference
    };

    struct Element
    {
        Element(GraphicStyleImpl& aGraphicStyle, std::set<std::string>& aClasses)
            : graphicStyle{aGraphicStyle}
            , classNames{aClasses}
        {
        }

        virtual ~Element() = default;

        GraphicStyleImpl graphicStyle;
        std::set<std::string> classNames;
        virtual ElementType Type() const = 0;
    };

    struct Image : public Element
    {
        Image(GraphicStyleImpl& aGraphicStyle, std::set<std::string>& aClasses, std::shared_ptr<ImageData> aImageData,
            const Rect& aClipArea, const Rect& aFillArea)
            : Element(aGraphicStyle, aClasses)
            , imageData{std::move(aImageData)}
            , clipArea{aClipArea}
            , fillArea{aFillArea}
        {
        }

        std::shared_ptr<ImageData> imageData;
        Rect clipArea;
        Rect fillArea;
        ElementType Type() const override { return ElementType::kImage; }
    };

    struct Group : public Element
    {
        Group(GraphicStyleImpl& aGraphicStyle, std::set<std::string>& aClasses)
            : Element(aGraphicStyle, aClasses)
        {
        }

        std::vector<std::shared_ptr<Element>> children;
        ElementType Type() const override { return ElementType::kGroup; }
    };

    struct Graphic : public Element
    {
        Graphic(GraphicStyleImpl& aGraphicStyle, std::set<std::string>& aClasses, FillStyleImpl& aFillStyle, StrokeStyleImpl& aStrokeStyle,
            std::shared_ptr<Path> aPath)
            : Element(aGraphicStyle, aClasses)
            , fillStyle{aFillStyle}
            , strokeStyle{aStrokeStyle}
            , path{std::move(aPath)}
        {
        }

        FillStyleImpl fillStyle;
        StrokeStyleImpl strokeStyle;
        std::shared_ptr<Path> path;

        ElementType Type() const override { return ElementType::kGraphic; }
    };

    struct Reference : public Element
    {
        Reference(GraphicStyleImpl& aGraphicStyle, std::set<std::string>& aClasses, FillStyleImpl& aFillStyle, StrokeStyleImpl& aStrokeStyle,
            std::string aHref)
            : Element(aGraphicStyle, aClasses)
            , fillStyle{aFillStyle}
            , strokeStyle{aStrokeStyle}
            , href{std::move(aHref)}
        {
        }

        FillStyleImpl fillStyle;
        StrokeStyleImpl strokeStyle;
        std::string href;

        ElementType Type() const override { return ElementType::kReference; }
    };

    SVGDocumentImpl(std::shared_ptr<SVGRenderer> renderer);
    ~SVGDocumentImpl() {}

    void TraverseSVGTree(xml::XMLNode* rootNode);

    enum class Result
    {
        kSuccess,
        kInvalid,
        kDisabled
    };

    enum class LengthType
    {
        kHorizontal,
        kVertical,
        kDiagonal
    };

#ifdef STYLE_SUPPORT
    void AddCustomCSS(const StyleSheet::CssDocument* cssDocument);
    void ClearCustomCSS();
#endif
    void Render(const ColorMap& colorMap, float width, float height);
    void Render(const char* id, const ColorMap& colorMap, float width, float height);

    bool GetBoundingBox(Rect& bounds);
    bool GetBoundingBox(const char* id, Rect& bounds);
#ifdef DEBUG_API
    bool GetSubBoundingBoxes(std::vector<Rect>& bounds);
    bool GetSubBoundingBoxes(const char* id, std::vector<Rect>& bounds);
#endif

    std::array<float, 4> mViewBox;
    std::shared_ptr<SVGRenderer> mRenderer;

private:
    float ParseLengthFromAttr(const xml::XMLNode* child, const char* attrName, LengthType lengthType = LengthType::kHorizontal, float fallback = 0);
    float RelativeLength(LengthType lengthType) const;

    float ParseColorStop(const xml::XMLNode* node, std::vector<SVGNative::ColorStopImpl>& colorStops, float lastOffset);
    void ParseColorStops(xml::XMLNode* node, SVGNative::GradientImpl& gradient);
    void ParseGradient(xml::XMLNode* gradient);

    void ParseChildren(xml::XMLNode* node);
    void ParseChild(xml::XMLNode* node);

    std::unique_ptr<Path> ParseShape(xml::XMLNode* node);

    GraphicStyleImpl ParseGraphic(const xml::XMLNode* node, FillStyleImpl& fillStyle, StrokeStyleImpl& strokeStyle, std::set<std::string>& classNames);
    void ParseFillProperties(FillStyleImpl& fillStyle, const PropertySet& propertySet);
    void ParseStrokeProperties(StrokeStyleImpl& strokeStyle, const PropertySet& propertySet);
    void ParseGraphicsProperties(GraphicStyleImpl& graphicsStyle, const PropertySet& propertySet);

    PropertySet ParsePresentationAttributes(const xml::XMLNode* node);

    void RenderElement(const Element& element, const ColorMap& colorMap, float width, float height);
    void ExtractBounds(const Element& element);

    void TraverseTree(const ColorMap& colorMap, const Element&);

    void ApplyCSSStyle(
        const std::set<std::string>& classNames, GraphicStyleImpl& graphicStyle, FillStyleImpl& fillStyle, StrokeStyleImpl& strokeStyle);
    void ParseStyleAttr(const xml::XMLNode* node, std::vector<PropertySet>& propertySets, std::set<std::string>& classNames);
    void ParseStyle(const xml::XMLNode* child);

    void AddChildToCurrentGroup(std::shared_ptr<Element> element, std::string idString);

private:
    const xml::XMLNode* mRootNode{};

    // All stroke and fill CSS properties are so called
    // inherited CSS properties. Ancestors can define the
    // stroke properties for descendants. Descendants override
    // specifies from ancestors.
    // We need to keep the stack of settings in based on DOM
    // hierarchy.
    std::stack<StrokeStyleImpl> mStrokeStyleStack;
    std::stack<FillStyleImpl> mFillStyleStack;
#ifdef DEBUG_API
    std::vector<Rect> mBounds;
#else
    Rect mBound{0, 0, 0, 0};
#endif

#ifdef STYLE_SUPPORT
    const StyleSheet::CssDocument* mOverrideStyle{};
    StyleSheet::CssDocument mCSSInfo;
    StyleSheet::CssDocument mCustomCSSInfo;
#endif

    // Temporary resources. Will get cleaned-up after parsing.
    std::map<std::string, GradientImpl> mGradients;
    std::map<std::string, std::shared_ptr<ClippingPath>> mClippingPaths;
    std::stack<std::shared_ptr<Group>> mGroupStack;

    // Render tree created during parsing.
    std::shared_ptr<Group> mGroup;
    std::map<std::string, std::shared_ptr<Element>> mIdToElementMap;

    // Visited nodes to detect cycles.
    std::set<const Element*> mVisitedElements;

#if DEBUG
    std::string mTitle;
#endif
};

} // namespace SVGNative
