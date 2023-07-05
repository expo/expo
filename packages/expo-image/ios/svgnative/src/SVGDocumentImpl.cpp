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

#include "SVGDocumentImpl.h"

#include "Constants.h"
#include "SVGDocument.h"
#include "SVGRenderer.h"
#include "SVGStringParser.h"
#include "xml/XMLParser.h"

#include <cmath>
#include <limits>

using namespace SVGNative::xml;

namespace SVGNative
{
constexpr std::array<const char*, 14> gInheritedPropertyNames{{
    kColorProp,
    kClipRuleProp,
    kFillProp,
    kFillRuleProp,
    kFillOpacityProp,
    kStrokeProp,
    kStrokeDasharrayProp,
    kStrokeDashoffsetProp,
    kStrokeLinecapProp,
    kStrokeLinejoinProp,
    kStrokeMiterlimitProp,
    kStrokeOpacityProp,
    kStrokeWidthProp,
    kVisibilityProp
}};

constexpr std::array<const char*, 5> gNonInheritedPropertyNames{{
    kClipPathProp,
    kDisplayProp,
    kOpacityProp,
    kStopOpacityProp,
    kStopColorProp
}};

template <typename T>
bool isCloseToZero(T x)
{
    return std::abs(x) < std::numeric_limits<T>::epsilon();
}

SVGDocumentImpl::SVGDocumentImpl(std::shared_ptr<SVGRenderer> renderer)
    : mViewBox{{0, 0, 320.0f, 200.0f}}
    , mRenderer{renderer}
{
    mFillStyleStack.push(FillStyleImpl());
    mStrokeStyleStack.push(StrokeStyleImpl());

    GraphicStyleImpl graphicStyle{};
    std::set<std::string> classNames;
    mGroup = std::make_shared<Group>(graphicStyle, classNames);
    mGroupStack.push(mGroup);
}

void SVGDocumentImpl::TraverseSVGTree(XMLNode* rootNode)
{
    if (!rootNode || strcmp(rootNode->GetName(), kSvgElem))
        return;
    mRootNode = rootNode;

    auto viewBoxAttr = rootNode->GetAttribute(kViewBoxAttr);
    if (!viewBoxAttr.found)
    {
        mViewBox[0] = SVGDocumentImpl::ParseLengthFromAttr(rootNode, kXAttr, LengthType::kHorizontal, mViewBox[0]);
        mViewBox[1] = SVGDocumentImpl::ParseLengthFromAttr(rootNode, kYAttr, LengthType::kVertical, mViewBox[1]);
        mViewBox[2] = SVGDocumentImpl::ParseLengthFromAttr(rootNode, kWidthAttr, LengthType::kHorizontal, mViewBox[2]);
        mViewBox[3] = SVGDocumentImpl::ParseLengthFromAttr(rootNode, kHeightAttr, LengthType::kVertical, mViewBox[3]);
    }
    else
    {
        std::vector<float> numberList;
        if (SVGStringParser::ParseListOfNumbers(viewBoxAttr.value, numberList) && numberList.size() == 4)
            mViewBox = {{numberList[0], numberList[1], numberList[2], numberList[3]}};
    }

#if DEBUG
    auto dataNameAttr = rootNode->GetAttribute(kDataNameAttr);
    if (dataNameAttr.found)
        mTitle = dataNameAttr.value;
#endif

    ParseChild(rootNode);

    // Clear all temporary sets
    mGradients.clear();
    mClippingPaths.clear();
    mRootNode = nullptr;
}

float SVGDocumentImpl::RelativeLength(LengthType lengthType) const
{
    float relLength{};
    switch (lengthType)
    {
    case LengthType::kHorizontal:
        relLength = mViewBox[2];
        break;
    case LengthType::kVertical:
        relLength = mViewBox[3];
        break;
    case LengthType::kDiagonal:
        relLength = sqrtf(mViewBox[2] * mViewBox[2] + mViewBox[3] * mViewBox[3]);
        break;
    default:
        break;
    }
    return relLength;
}

float SVGDocumentImpl::ParseLengthFromAttr(const XMLNode* node, const char* attrName, LengthType lengthType, float fallback)
{
    if (!node)
        return fallback;

    float number{};
    auto attr = node->GetAttribute(attrName);
    if (!attr.found || !SVGStringParser::ParseLengthOrPercentage(attr.value, RelativeLength(lengthType), number, true))
        return fallback;

    return number;
}

void SVGDocumentImpl::ParseChildren(XMLNode* node)
{
    SVG_ASSERT(node != nullptr);

    for (auto child = node->GetFirstNode(); child != nullptr; child = child->GetNextSibling())
    {
        ParseChild(child.get());
    }
}

void SVGDocumentImpl::ParseChild(XMLNode* child)
{
    SVG_ASSERT(child != nullptr);

    auto fillStyle = mFillStyleStack.top();
    auto strokeStyle = mStrokeStyleStack.top();
    std::set<std::string> classNames;
    auto graphicStyle = ParseGraphic(child, fillStyle, strokeStyle, classNames);

    std::string idString;
    auto idAttr = child->GetAttribute(kIdAttr);
    if (idAttr.found)
        idString = idAttr.value;

    // Check if we have a shape rect, circle, ellipse, line, polygon, polyline
    // or path first.
    if (auto path = ParseShape(child))
    {
        AddChildToCurrentGroup(std::unique_ptr<Graphic>(new Graphic(graphicStyle, classNames, fillStyle, strokeStyle, std::move(path))), std::move(idString));
        return;
    }

    // Look at all elements that are no shapes.
    const auto elementName = child->GetName();
    if (!strcmp(elementName, kGElem) || (!strcmp(elementName, kSvgElem) && child == mRootNode))
    {
        mFillStyleStack.push(fillStyle);
        mStrokeStyleStack.push(strokeStyle);

        auto group = std::make_shared<Group>(graphicStyle, classNames);
        AddChildToCurrentGroup(group, std::move(idString));
        mGroupStack.push(group);

        ParseChildren(child);

        mGroupStack.pop();
        mFillStyleStack.pop();
        mStrokeStyleStack.pop();
    }
    else if (!strcmp(elementName, kDefsElem))
    {
        mFillStyleStack.push(fillStyle);
        mStrokeStyleStack.push(strokeStyle);

        // Create dummmy group. All children w/o id will get cleaned up.
        mGroupStack.push(std::make_shared<Group>(graphicStyle, classNames));

        ParseChildren(child);

        mGroupStack.pop();
        mFillStyleStack.pop();
        mStrokeStyleStack.pop();
    }
    else if (!strcmp(elementName, kImageElem))
    {
        std::unique_ptr<ImageData> imageData;
        auto hrefAttr = child->GetAttribute(kHrefAttr, kXlinkNS);
        if (hrefAttr.found)
        {
            const std::string dataURL = hrefAttr.value;
            ImageEncoding encoding{};
            unsigned short base64Offset{22};
            if (dataURL.find(kDataUrlPngVal) == 0)
                encoding = ImageEncoding::kPNG;
            else if (dataURL.find(kDataUrlJpgVal) == 0)
                encoding = ImageEncoding::kJPEG;
            else if (dataURL.find(kDataUrlJpegVal) == 0)
            {
                encoding = ImageEncoding::kJPEG;
                base64Offset = 23;
            }
            else
                return;
            imageData = mRenderer->CreateImageData(dataURL.substr(base64Offset), encoding);
        }

        if (imageData)
        {
            const float imageWidth = ParseLengthFromAttr(child, kWidthAttr, LengthType::kHorizontal);
            const float imageHeight = ParseLengthFromAttr(child, kHeightAttr, LengthType::kVertical);

            Rect clipArea{ParseLengthFromAttr(child, kXAttr, LengthType::kHorizontal),
                ParseLengthFromAttr(child, kYAttr, LengthType::kVertical),
                ParseLengthFromAttr(child, kWidthAttr, LengthType::kHorizontal, imageWidth),
                ParseLengthFromAttr(child, kHeightAttr, LengthType::kVertical, imageHeight)};

            std::string align;
            std::string meetOrSlice;
            std::vector<std::string> attrStringValues;
            auto preserveAspectRatioAttr = child->GetAttribute(kPreserveAspectRatioAttr);
            if (preserveAspectRatioAttr.found
                && SVGStringParser::ParseListOfStrings(preserveAspectRatioAttr.value, attrStringValues)
                && attrStringValues.size() >= 1 && attrStringValues.size() <= 2)
            {
                align = attrStringValues[0];
                if (attrStringValues.size() == 2)
                    meetOrSlice = attrStringValues[1];
            }

            Rect fillArea{clipArea};
            if (align.compare(kNoneVal) != 0)
            {
                fillArea.width = imageWidth;
                fillArea.height = imageHeight;
                float scaleX = clipArea.width / imageWidth;
                float scaleY = clipArea.height / imageHeight;
                float scale{};
                if (meetOrSlice.compare(kSliceVal) == 0)
                    scale = std::max(scaleX, scaleY);
                else
                    scale = std::min(scaleX, scaleY);
                fillArea.width *= scale;
                fillArea.height *= scale;

                if (align.compare(kXMinYMinVal) == 0)
                {
                    fillArea.x = clipArea.x;
                    fillArea.y = clipArea.y;
                }
                else if (align.compare(kXMidYMinVal) == 0)
                {
                    fillArea.x = (clipArea.x + clipArea.width / 2) - fillArea.width / 2;
                    fillArea.y = clipArea.y;
                }
                else if (align.compare(kXMaxYMinVal) == 0)
                {
                    fillArea.x = clipArea.x + clipArea.width - fillArea.width;
                    fillArea.y = clipArea.y;
                }
                else if (align.compare(kXMinYMidVal) == 0)
                {
                    fillArea.x = clipArea.x;
                    fillArea.y = (clipArea.y + clipArea.height / 2) - fillArea.height / 2;
                }
                else if (align.compare(kXMaxYMidVal) == 0)
                {
                    fillArea.x = clipArea.x + clipArea.width - fillArea.width;
                    fillArea.y = (clipArea.y + clipArea.height / 2) - fillArea.height / 2;
                }
                else if (align.compare(kXMinYMaxVal) == 0)
                {
                    fillArea.x = clipArea.x;
                    fillArea.y = clipArea.y + clipArea.height - fillArea.height;
                }
                else if (align.compare(kXMidYMaxVal) == 0)
                {
                    fillArea.x = (clipArea.x + clipArea.width / 2) - fillArea.width / 2;
                    fillArea.y = clipArea.y + clipArea.height - fillArea.height;
                }
                else if (align.compare(kXMaxYMaxVal) == 0)
                {
                    fillArea.x = clipArea.x + clipArea.width - fillArea.width;
                    fillArea.y = clipArea.y + clipArea.height - fillArea.height;
                }
                else // default and "xMidYMid"
                {
                    fillArea.x = (clipArea.x + clipArea.width / 2) - fillArea.width / 2;
                    fillArea.y = (clipArea.y + clipArea.height / 2) - fillArea.height / 2;
                }
            }

            // Do not render 0-sized elements.
            if (imageWidth && imageHeight && clipArea.width && clipArea.height && fillArea.width && fillArea.height)
            {
                auto image = std::unique_ptr<Image>(new Image(graphicStyle, classNames, std::move(imageData), clipArea, fillArea));
                AddChildToCurrentGroup(std::move(image), std::move(idString));
            }
        }
    }
    else if (!strcmp(elementName, kUseElem))
    {
        auto hrefAttr = child->GetAttribute(kHrefAttr, kXlinkNS);
        if (!hrefAttr.found || !hrefAttr.value || hrefAttr.value[0] != '#')
            return;

        const float x = ParseLengthFromAttr(child, kXAttr, LengthType::kHorizontal);
        const float y = ParseLengthFromAttr(child, kYAttr, LengthType::kVertical);
        if (!isCloseToZero(x) || !isCloseToZero(y))
        {
            if (!graphicStyle.transform)
                graphicStyle.transform = mRenderer->CreateTransform();
            graphicStyle.transform->Concat(1, 0, 0, 1, x, y);
        }

        std::string href{(hrefAttr.value + 1)};
        AddChildToCurrentGroup(std::make_shared<Reference>(graphicStyle, classNames, fillStyle, strokeStyle, std::move(href)), std::move(idString));
    }
    else if (!strcmp(elementName, kSymbolElem))
    {
        // FIXME: Do not render <symbol> outside of <defs> section.
        // FIXME: Remove support for symbol ASAP.
        auto attr = child->GetAttribute(kViewBoxAttr);
        if (attr.found)
        {
            std::vector<float> numberList;
            if (SVGStringParser::ParseListOfNumbers(attr.value, numberList) && numberList.size() == 4)
                graphicStyle.transform = mRenderer->CreateTransform(1, 0, 0, 1, -numberList[0], -numberList[1]);
        }

        auto group = std::make_shared<Group>(graphicStyle, classNames);
        AddChildToCurrentGroup(group, std::move(idString));
        mGroupStack.push(group);

        ParseChildren(child);

        mGroupStack.pop();
    }
    else if (!strcmp(elementName, kLinearGradientElem) || !strcmp(elementName, kRadialGradientElem))
    {
        mFillStyleStack.push(fillStyle);
        mStrokeStyleStack.push(strokeStyle);

        ParseGradient(child);

        mFillStyleStack.pop();
        mStrokeStyleStack.pop();
    }
#ifdef STYLE_SUPPORT
    else if (!strcmp(elementName, kStyleElem))
        ParseStyle(child);
#endif
    else if (!strcmp(elementName, kClipPathElem))
    {
        auto id = child->GetAttribute(kIdAttr);
        if (!id.found)
            return;

        mFillStyleStack.push(fillStyle);
        mStrokeStyleStack.push(strokeStyle);

        // SVG only allows shapes (and <use> elements referencing shapes) as children of
        // <clipPath>. Ignore all other elements.
        bool hasClipContent{false};
        for (auto clipPathChild = child->GetFirstNode(); clipPathChild != nullptr; clipPathChild = clipPathChild->GetNextSibling())
        {
            // WebKit and Blink allow the clipping path if there is at least one valid basic shape child.
            if (auto path = ParseShape(clipPathChild.get()))
            {
                std::unique_ptr<Transform> transform;
                auto attr = clipPathChild->GetAttribute(kTransformAttr);
                if (attr.found)
                {
                    SVG_ASSERT(mRenderer != nullptr);
                    transform = mRenderer->CreateTransform();
                    if (!SVGStringParser::ParseTransform(attr.value, *transform))
                        transform.reset();
                }
                auto fillStyleChild = mFillStyleStack.top();
                auto strokeStyleChild = mStrokeStyleStack.top();
                std::set<std::string> classNames;
                ParseGraphic(child, fillStyleChild, strokeStyleChild, classNames);
                mClippingPaths[id.value] = std::make_shared<ClippingPath>(true, fillStyleChild.clipRule, std::move(path), std::move(transform));
                hasClipContent = true;
                break;
            }
        }
        if (!hasClipContent)
            mClippingPaths[id.value] = std::make_shared<ClippingPath>(false, WindingRule::kNonZero, nullptr, nullptr);
        mFillStyleStack.pop();
        mStrokeStyleStack.pop();
    }
}

std::unique_ptr<Path> SVGDocumentImpl::ParseShape(XMLNode* child)
{
    SVG_ASSERT(child != nullptr);

    const auto elementName = child->GetName();
    if (!strcmp(elementName, kRectElem))
    {
        float x = ParseLengthFromAttr(child, kXAttr, LengthType::kHorizontal);
        float y = ParseLengthFromAttr(child, kYAttr, LengthType::kVertical);

        float width = ParseLengthFromAttr(child, kWidthAttr, LengthType::kHorizontal);
        float height = ParseLengthFromAttr(child, kHeightAttr, LengthType::kVertical);

        // SVG requires to disable rendering if width or height are 0.
        if (isCloseToZero(width) || isCloseToZero(height))
            return nullptr;

        auto rxAttr = child->GetAttribute(kRxAttr);
        auto ryAttr = child->GetAttribute(kRyAttr);

        float rx{};
        float ry{};
        if (rxAttr.found && ryAttr.found)
        {
            rx = ParseLengthFromAttr(child, kRxAttr, LengthType::kHorizontal);
            ry = ParseLengthFromAttr(child, kRyAttr, LengthType::kVertical);
        }
        else if (rxAttr.found)
        {
            // the svg spec says that rect elements that specify a rx but not a ry
            // should use the rx value for ry
            rx = ParseLengthFromAttr(child, kRxAttr, LengthType::kHorizontal);
            ry = rx;
        }
        else if (ryAttr.found)
        {
            // the svg spec says that rect elements that specify a ry but not a rx
            // should use the ry value for rx
            ry = ParseLengthFromAttr(child, kRyAttr, LengthType::kVertical);
            rx = ry;
        }
        else
        {
            rx = 0;
            ry = 0;
        }

        rx = std::min(rx, width / 2.0f);
        ry = std::min(ry, height / 2.0f);

        auto path = mRenderer->CreatePath();
        if (isCloseToZero(rx) || isCloseToZero(ry))
        {
            path->Rect(x, y, width, height);
        }
        else
        {
            path->RoundedRect(x, y, width, height, rx, ry);
        }
        return path;
    }
    else if (!strcmp(elementName, kEllipseElem) || !strcmp(elementName, kCircleElem))
    {
        float rx{}, ry{};

        if (!strcmp(elementName, kEllipseElem))
        {
            rx = ParseLengthFromAttr(child, kRxAttr, LengthType::kHorizontal);
            ry = ParseLengthFromAttr(child, kRyAttr, LengthType::kVertical);
        }
        else
        {
            rx = ParseLengthFromAttr(child, kRAttr, LengthType::kDiagonal);
            ry = rx;
        }

        // SVG requires to disable rendering if rx or ry are 0.
        if (isCloseToZero(rx) || isCloseToZero(ry))
            return nullptr;

        float cx = ParseLengthFromAttr(child, kCxAttr, LengthType::kHorizontal);
        float cy = ParseLengthFromAttr(child, kCyAttr, LengthType::kVertical);

        auto path = mRenderer->CreatePath();
        path->Ellipse(cx, cy, rx, ry);

        return path;
    }
    else if (!strcmp(elementName, kPolygonElem) || !strcmp(elementName, kPolylineElem))
    {
        auto attr = child->GetAttribute(kPointsAttr);
        if (!attr.found)
            return nullptr;
        // This does not follow the spec which requires at least one space or comma between
        // coordinate pairs. However, Blink and WebKit do it the same way.
        std::vector<float> numberList;
        SVGStringParser::ParseListOfNumbers(attr.value, numberList);
        auto size = numberList.size();
        auto path = mRenderer->CreatePath();
        if (size > 1)
        {
            if (size % 2 == 1)
                --size;
            decltype(size) i{};
            path->MoveTo(numberList[i], numberList[i + 1]);
            i += 2;
            for (; i < size; i += 2)
                path->LineTo(numberList[i], numberList[i + 1]);
            if (!strcmp(elementName, kPolygonElem))
                path->ClosePath();
        }

        return path;
    }
    else if (!strcmp(elementName, kPathElem))
    {
        auto attr = child->GetAttribute(kDAttr);
        if (!attr.found)
            return nullptr;

        auto path = mRenderer->CreatePath();
        SVGStringParser::ParsePathString(attr.value, *path);

        return path;
    }
    else if (!strcmp(elementName, kLineElem))
    {
        auto path = mRenderer->CreatePath();
        path->MoveTo(ParseLengthFromAttr(child, kX1Attr, LengthType::kHorizontal), ParseLengthFromAttr(child, kY1Attr, LengthType::kVertical));
        path->LineTo(ParseLengthFromAttr(child, kX2Attr, LengthType::kHorizontal), ParseLengthFromAttr(child, kY2Attr, LengthType::kVertical));

        return path;
    }
    return nullptr;
}

GraphicStyleImpl SVGDocumentImpl::ParseGraphic(
    const XMLNode* node, FillStyleImpl& fillStyle, StrokeStyleImpl& strokeStyle, std::set<std::string>& classNames)
{
    SVG_ASSERT(node != nullptr);

    std::vector<PropertySet> propertySets;
    propertySets.push_back(ParsePresentationAttributes(node));
    ParseStyleAttr(node, propertySets, classNames);

    GraphicStyleImpl graphicStyle{};
    for (const auto& propertySet : propertySets)
    {
        ParseGraphicsProperties(graphicStyle, propertySet);
        ParseFillProperties(fillStyle, propertySet);
        ParseStrokeProperties(strokeStyle, propertySet);
    }

    auto transformAttr = node->GetAttribute(kTransformAttr);
    if (transformAttr.found && node != mRootNode) // Ignore transforms on root SVG node
    {
        SVG_ASSERT(mRenderer != nullptr);
        graphicStyle.transform = mRenderer->CreateTransform();
        if (!SVGStringParser::ParseTransform(transformAttr.value, *graphicStyle.transform))
            graphicStyle.transform.reset();
    }

    return graphicStyle;
}

static inline void AddDetectedProperty(const XMLNode* node, PropertySet& propertySet, const char* propertyName)
{
    auto attr = node->GetAttribute(propertyName);
    if (attr.found)
        propertySet.insert({propertyName, attr.value});
}

PropertySet SVGDocumentImpl::ParsePresentationAttributes(const XMLNode* node)
{
    SVG_ASSERT(node != nullptr);

    PropertySet propertySet;
    for (const auto& propertyName : gInheritedPropertyNames)
        AddDetectedProperty(node, propertySet, propertyName);
    for (const auto& propertyName : gNonInheritedPropertyNames)
        AddDetectedProperty(node, propertySet, propertyName);
    return propertySet;
}

void SVGDocumentImpl::ParseFillProperties(FillStyleImpl& fillStyle, const PropertySet& propertySet)
{
    auto prop = propertySet.find(kFillProp);
    auto iterEnd = propertySet.end();
    if (prop != iterEnd)
    {
        auto result = SVGStringParser::ParsePaint(prop->second, mGradients, mViewBox, fillStyle.internalPaint);
        if (result == SVGDocumentImpl::Result::kDisabled)
            fillStyle.hasFill = false;
        else if (result == SVGDocumentImpl::Result::kSuccess)
            fillStyle.hasFill = true;
    }

    prop = propertySet.find(kFillOpacityProp);
    if (prop != iterEnd)
    {
        float opacity{};
        if (SVGStringParser::ParseAlphaValue(prop->second, opacity))
            fillStyle.fillOpacity = std::max<float>(0.0, std::min<float>(1.0, opacity));
    }

    prop = propertySet.find(kFillRuleProp);
    if (prop != iterEnd)
    {
        if (prop->second == kEvenoddVal)
            fillStyle.fillRule = WindingRule::kEvenOdd;
        else if (prop->second == kNonzeroVal)
            fillStyle.fillRule = WindingRule::kNonZero;
    }

    // Other inherited properties
    prop = propertySet.find(kColorProp);
    if (prop != iterEnd)
    {
        ColorImpl color = Color{{0.0f, 0.0f, 0.0f, 1.0f}};
        auto result = SVGStringParser::ParseColor(prop->second, color, false);
        if (result == SVGDocumentImpl::Result::kSuccess)
            fillStyle.color = color;
    }

    prop = propertySet.find(kVisibilityProp);
    if (prop != iterEnd)
    {
        const auto& visibilityString = prop->second;
        if (visibilityString == kHiddenVal)
            fillStyle.visibility = false;
        else if (visibilityString == kCollapseVal || visibilityString == kVisibleVal)
            fillStyle.visibility = true;
    }

    prop = propertySet.find(kClipRuleProp);
    if (prop != iterEnd)
    {
        if (prop->second == kEvenoddVal)
            fillStyle.clipRule = WindingRule::kEvenOdd;
        else if (prop->second == kNonzeroVal)
            fillStyle.clipRule = WindingRule::kNonZero;
    }
}

void SVGDocumentImpl::ParseStrokeProperties(StrokeStyleImpl& strokeStyle, const PropertySet& propertySet)
{
    auto prop = propertySet.find(kStrokeProp);
    auto iterEnd = propertySet.end();
    if (prop != iterEnd)
    {
        auto result = SVGStringParser::ParsePaint(prop->second, mGradients, mViewBox, strokeStyle.internalPaint);
        if (result == SVGDocumentImpl::Result::kDisabled)
            strokeStyle.hasStroke = false;
        else if (result == SVGDocumentImpl::Result::kSuccess)
            strokeStyle.hasStroke = true;
    }

    prop = propertySet.find(kStrokeWidthProp);
    if (prop != iterEnd)
    {
        float strokeWidth{};
        // Ignore stroke-width if invalid or negative.
        if (SVGStringParser::ParseLengthOrPercentage(prop->second, RelativeLength(LengthType::kDiagonal), strokeWidth, true)
            && strokeWidth >= 0)
            strokeStyle.lineWidth = strokeWidth;
        // Disable stroke on a stroke-width of 0.
        if (strokeWidth == 0.0)
            strokeStyle.hasStroke = false;
    }

    prop = propertySet.find(kStrokeLinecapProp);
    if (prop != iterEnd)
    {
        if (prop->second == kRoundVal)
            strokeStyle.lineCap = LineCap::kRound;
        else if (prop->second == kSquareVal)
            strokeStyle.lineCap = LineCap::kSquare;
    }

    prop = propertySet.find(kStrokeLinejoinProp);
    if (prop != iterEnd)
    {
        if (prop->second == kRoundVal)
            strokeStyle.lineJoin = LineJoin::kRound;
        else if (prop->second == kBevelVal)
            strokeStyle.lineJoin = LineJoin::kBevel;
    }

    prop = propertySet.find(kStrokeMiterlimitProp);
    if (prop != iterEnd)
    {
        float miter{};
        // Miter must be bigger 1. Otherwise ignore.
        if (SVGStringParser::ParseNumber(prop->second, miter) && miter >= 1)
            strokeStyle.miterLimit = miter;
    }

    prop = propertySet.find(kStrokeDashoffsetProp);
    if (prop != iterEnd)
    {
        float strokeDashoffset{};
        if (SVGStringParser::ParseLengthOrPercentage(prop->second, RelativeLength(LengthType::kDiagonal), strokeDashoffset, true))
            strokeStyle.dashOffset = strokeDashoffset;
    }

    prop = propertySet.find(kStrokeDasharrayProp);
    if (prop != iterEnd)
    {
        float diagonal = sqrtf(mViewBox[2] * mViewBox[2] + mViewBox[3] * mViewBox[3]);
        if (!SVGStringParser::ParseListOfLengthOrPercentage(prop->second.c_str(), diagonal, strokeStyle.dashArray, true))
            strokeStyle.dashArray.clear();
        for (auto it = strokeStyle.dashArray.begin(); it < strokeStyle.dashArray.end(); ++it)
        {
            if (*it < 0)
            {
                strokeStyle.dashArray.clear();
                break;
            }
        }
        const auto sizeOfDashArray = strokeStyle.dashArray.size();
        if (sizeOfDashArray % 2 != 0)
        {
            // If stroke-dasharray[] is odd-sized, the array should be twiced.
            // See SVG 1.1 (2nd ed), 11.4 "Stroke Properties" for detail.
            strokeStyle.dashArray.reserve(sizeOfDashArray * 2);
            for (size_t i = 0; i < sizeOfDashArray; ++i)
                strokeStyle.dashArray.push_back(strokeStyle.dashArray[i]);
        }
    }

    prop = propertySet.find(kStrokeOpacityProp);
    if (prop != iterEnd)
    {
        float opacity{};
        if (SVGStringParser::ParseAlphaValue(prop->second, opacity))
            strokeStyle.strokeOpacity = std::max<float>(0.0, std::min<float>(1.0, opacity));
    }
}

void SVGDocumentImpl::ParseGraphicsProperties(GraphicStyleImpl& graphicStyle, const PropertySet& propertySet)
{
    auto prop = propertySet.find(kOpacityProp);
    auto iterEnd = propertySet.end();
    if (prop != iterEnd)
    {
        float opacity{};
        if (SVGStringParser::ParseAlphaValue(prop->second, opacity))
            graphicStyle.opacity = std::max<float>(0.0, std::min<float>(1.0, opacity));
    }

    prop = propertySet.find(kClipPathProp);
    if (prop != iterEnd)
    {
        // FIXME: Use proper parser.
        const auto urlLength = strlen(kUrlVal);
        const auto& valueString = prop->second;
        auto id = valueString.substr(urlLength, valueString.size() - urlLength - 1);
        auto clippingPathIt = mClippingPaths.find(id);
        if (clippingPathIt != mClippingPaths.end())
            graphicStyle.clippingPath = clippingPathIt->second;
    }

    prop = propertySet.find(kDisplayProp);
    if (prop != iterEnd)
    {
        if (prop->second.compare(kNoneVal))
            graphicStyle.display = false;
    }

    prop = propertySet.find(kStopOpacityProp);
    if (prop != iterEnd)
    {
        float opacity{};
        if (SVGStringParser::ParseAlphaValue(prop->second, opacity))
            graphicStyle.stopOpacity = std::max<float>(0.0, std::min<float>(1.0, opacity));
    }

    prop = propertySet.find(kStopColorProp);
    if (prop != iterEnd)
    {
        ColorImpl color = Color{{0.0f, 0.0f, 0.0f, 1.0f}};
        const auto result = SVGStringParser::ParseColor(prop->second, color, true);
        if (result == SVGDocumentImpl::Result::kSuccess)
            graphicStyle.stopColor = color;
    }
}

float SVGDocumentImpl::ParseColorStop(const XMLNode* node, std::vector<ColorStopImpl>& colorStops, float lastOffset)
{
    SVG_ASSERT(node != nullptr);

    auto fillStyle = mFillStyleStack.top();
    auto strokeStyle = mStrokeStyleStack.top();
    std::set<std::string> classNames;
    auto graphicStyle = ParseGraphic(node, fillStyle, strokeStyle, classNames);

    // * New stops may never appear before previous stops. Use offset of previous stop otherwise.
    // * Stops must be in the range [0.0, 1.0].
    float offset{};
    auto attr = node->GetAttribute(kOffsetAttr);
    offset = (attr.found && SVGStringParser::ParseAlphaValue(attr.value, offset)) ? offset : lastOffset;
    offset = std::max<float>(lastOffset, offset);
    offset = std::min<float>(1.0, std::max<float>(0.0, offset));

    ColorImpl& paint = graphicStyle.stopColor;
    if (paint.type() == typeid(ColorKeys))
    {
        // Value is "currentColor". Simply set value to CSS color property.
        paint = fillStyle.color;
    }

    graphicStyle.stopOpacity = std::max<float>(0.0, std::min<float>(1.0, graphicStyle.stopOpacity));

    colorStops.push_back(std::make_tuple(offset, paint, graphicStyle.stopOpacity));
    return offset;
}

void SVGDocumentImpl::ParseColorStops(XMLNode* node, GradientImpl& gradient)
{
    SVG_ASSERT(node != nullptr);

    float lastOffset{};
    std::vector<ColorStopImpl> colorStops;
    for (auto child = node->GetFirstNode(); child != nullptr; child = child->GetNextSibling())
    {
        if (!strcmp(child->GetName(), kStopElem))
            lastOffset = ParseColorStop(child.get(), colorStops, lastOffset);
    }
    // Make sure we always have stops in the range 0% and 100%.
    if (colorStops.size() > 1)
    {
        const auto& firstStop = colorStops.front();
        if (std::get<0>(firstStop) != 0.0f)
            colorStops.insert(colorStops.begin(), std::make_tuple(0.0f, std::get<1>(firstStop), std::get<2>(firstStop)));
        const auto& lastStop = colorStops.back();
        if (std::get<0>(lastStop) != 1.0f)
            colorStops.push_back(std::make_tuple(1.0f, std::get<1>(lastStop), std::get<2>(lastStop)));
    }
    // Keep the color stops from referenced gradients if the current gradient
    // has none.
    if (!colorStops.empty())
        gradient.internalColorStops = colorStops;
}

void SVGDocumentImpl::ParseGradient(XMLNode* node)
{
    SVG_ASSERT(node != nullptr);

    GradientImpl gradient{};

    // SVG allows referencing other gradients. For now, we only look at already parsed
    // gradients. Since we add the current gradient after successful parsing,
    // this also avoids circular references.
    // https://www.w3.org/TR/SVG11/pservers.html#LinearGradientElementHrefAttribute
    auto attr = node->GetAttribute(kHrefAttr, kXlinkNS);
    if (attr.found)
    {
        std::string href{attr.value};
        // href starts with a #, ignore it.
        auto it = mGradients.find(href.substr(1));
        if (it != mGradients.end())
            gradient = it->second;
    }

    ParseColorStops(node, gradient);

    const auto elementName = node->GetName();
    if (!strcmp(elementName, kLinearGradientElem))
        gradient.type = GradientType::kLinearGradient;
    else if (!strcmp(elementName, kRadialGradientElem))
        gradient.type = GradientType::kRadialGradient;
    else
    {
        SVG_ASSERT_MSG(false, "Gradient parser called with invalid element");
        return;
    }

    // TODO: Do we want to support `gradientUnits="objectBoundingBox"` at all?
    // This would require us to get the bounding box of the filled/stroked shape
    // when the gradient gets applied.

    if (gradient.type == GradientType::kLinearGradient)
    {
        // https://www.w3.org/TR/SVG11/pservers.html#LinearGradients
        gradient.x1 = ParseLengthFromAttr(node, kX1Attr, LengthType::kHorizontal, gradient.x1);
        gradient.y1 = ParseLengthFromAttr(node, kY1Attr, LengthType::kVertical, gradient.y1);
        gradient.x2 = ParseLengthFromAttr(node, kX2Attr, LengthType::kHorizontal, gradient.x2);
        gradient.y2 = ParseLengthFromAttr(node, kY2Attr, LengthType::kVertical, gradient.y2);
    }
    else
    {
        // https://www.w3.org/TR/SVG11/pservers.html#RadialGradients
        gradient.cx = ParseLengthFromAttr(node, kCxAttr, LengthType::kHorizontal, gradient.cx);
        gradient.cy = ParseLengthFromAttr(node, kCyAttr, LengthType::kVertical, gradient.cy);
        gradient.fx = ParseLengthFromAttr(node, kFxAttr, LengthType::kHorizontal, gradient.fx);
        gradient.fy = ParseLengthFromAttr(node, kFyAttr, LengthType::kVertical, gradient.fy);
        gradient.r = ParseLengthFromAttr(node, kRAttr, LengthType::kDiagonal, gradient.r);
    }

    attr = node->GetAttribute(kSpreadMethodAttr);
    if (attr.found)
    {
        const auto spreadMethodString = attr.value;
        if (!strcmp(spreadMethodString, kPadVal))
            gradient.method = SpreadMethod::kPad;
        else if (!strcmp(spreadMethodString, kReflectVal))
            gradient.method = SpreadMethod::kReflect;
        else if (!strcmp(spreadMethodString, kRepeatVal))
            gradient.method = SpreadMethod::kRepeat;
    }
    attr = node->GetAttribute(kGradientTransformAttr);
    if (attr.found)
    {
        SVG_ASSERT(mRenderer != nullptr);
        gradient.transform = mRenderer->CreateTransform();
        if (!SVGStringParser::ParseTransform(attr.value, *gradient.transform))
            gradient.transform.reset();
    }

    attr = node->GetAttribute(kIdAttr);
    if (attr.found)
        mGradients.insert({attr.value, gradient});
}

void SVGDocumentImpl::Render(const ColorMap& colorMap, float width, float height)
{
    SVG_ASSERT(mGroup);
    if (!mGroup)
        return;

    RenderElement(*mGroup, colorMap, width, height);
}

void SVGDocumentImpl::Render(const char* id, const ColorMap& colorMap, float width, float height)
{
    // Referenced glyph identifiers shall be rendered as if they were contained in a <defs> section under
    // the root SVG element:
    // Therefore, the referenced shape/group should:
    // * inherit property values from the root SVG element,
    // * ignore all styling and transforms on ancestors.
    // https://docs.microsoft.com/en-us/typography/opentype/spec/svg#glyph-identifiers
    auto elementIter = mIdToElementMap.find(id);
    if (elementIter != mIdToElementMap.end())
        RenderElement(*elementIter->second, colorMap, width, height);
}

void SVGDocumentImpl::RenderElement(const Element& element, const ColorMap& colorMap, float width, float height)
{
    float scale = width / mViewBox[2];
    if (scale > height / mViewBox[3])
        scale = height / mViewBox[3];

    GraphicStyleImpl graphicStyle{};
    graphicStyle.transform = mRenderer->CreateTransform();
  graphicStyle.transform->Scale(scale, scale);
    graphicStyle.transform->Translate(-1 * mViewBox[0], -1 * mViewBox[1]);

    auto saveRestore = SaveRestoreHelper{mRenderer, graphicStyle};

    TraverseTree(colorMap, element);
    SVG_ASSERT(mVisitedElements.empty());
}

bool SVGDocumentImpl::GetBoundingBox(Rect& bound)
{
    SVG_ASSERT(mGroup);
    if (!mGroup)
        return false;

    GraphicStyleImpl graphicStyle{};
    graphicStyle.transform = mRenderer->CreateTransform();
    graphicStyle.transform->Translate(-1 * mViewBox[0], -1 * mViewBox[1]);
    auto saveRestore = SaveRestoreHelper{mRenderer, graphicStyle};
    ExtractBounds(*mGroup);
    SVG_ASSERT(mVisitedElements.empty());

    Rect sumBound{0, 0, 0, 0};
#ifdef DEBUG_API
    for(auto const& bound : mBounds)
        sumBound = sumBound | bound;
#else
    sumBound = mBound;
#endif
    bound = sumBound;
    return true;
}

bool SVGDocumentImpl::GetBoundingBox(const char* id, Rect& bound)
{
    SVG_ASSERT(mGroup);
    if (!mGroup)
        return false;

    // TODO: Maybe this needs fixing as I'm not doing any scaling, we must
    // figure out a way to supply width/height for this I guess?
    GraphicStyleImpl graphicStyle{};
    graphicStyle.transform = mRenderer->CreateTransform();
    graphicStyle.transform->Translate(-1 * mViewBox[0], -1 * mViewBox[1]);
    auto saveRestore = SaveRestoreHelper{mRenderer, graphicStyle};
    const auto elementIter = mIdToElementMap.find(id);
    SVG_ASSERT(elementIter != mIdToElementMap.end());
    ExtractBounds(*elementIter->second);
    SVG_ASSERT(mVisitedElements.empty());

    Rect sumBound{0, 0, 0, 0};
#ifdef DEBUG_API
    for(auto const& bound : mBounds)
        sumBound = sumBound | bound;
#else
    sumBound = mBound;
#endif
    bound = sumBound;
    return true;
}

#ifdef DEBUG_API
bool GetSubBoundingBoxes(std::vector<Rect>& bounds);
{
    SVG_ASSERT(mGroup);
    if (!mGroup)
        return false;
    GraphicStyleImpl graphicStyle{};
    graphicStyle.transform = mRenderer->CreateTransform();
    graphicStyle.transform->Translate(-1 * mViewBox[0], -1 * mViewBox[1]);
    auto saveRestore = SaveRestoreHelper{mRenderer, graphicStyle};
    ExtractBounds(*mGroup);
    SVG_ASSERT(mVisitedElements.empty());
    bounds = mBounds;
    return true;
}

bool GetSubBoundingBoxes(const char* id, std::vector<Rect>& bounds);
{
    SVG_ASSERT(mGroup);
    if (!mGroup)
        return false;
    GraphicStyleImpl graphicStyle{};
    graphicStyle.transform = mRenderer->CreateTransform();
    graphicStyle.transform->Translate(-1 * mViewBox[0], -1 * mViewBox[1]);
    auto saveRestore = SaveRestoreHelper{mRenderer, graphicStyle};
    const auto elementIter = mIdToElementMap.find(id);
    SVG_ASSERT(elementIter != mIdToElementMap.end());
    ExtractBounds(*elementIter->second);
    SVG_ASSERT(mVisitedElements.empty());
    bounds = mBounds;
    return true;
}
#endif

void SVGDocumentImpl::ExtractBounds(const Element& element)
{
    // This function is based on the TraverseTree function, we just calculate
    // the bounds instead of doing any drawing.

    auto graphicStyle = element.graphicStyle;
    FillStyleImpl fillStyle{};
    StrokeStyleImpl strokeStyle{};
    // Has no bound contribution if there is no clipContent and clip path is set
    if (graphicStyle.clippingPath && !graphicStyle.clippingPath->hasClipContent)
        return;

    switch (element.Type())
    {
        case ElementType::kReference:
            {
                const auto& reference = static_cast<const Reference&>(element);
                const auto it = mVisitedElements.find(&reference);
                if (it != mVisitedElements.end())
                    break; // We found a cycle. Do not continue rendering.
                auto insertResult = mVisitedElements.insert(&reference);

                // Render referenced content.
                auto refIt = mIdToElementMap.find(reference.href);
                if (refIt != mIdToElementMap.end())
                {
                    ApplyCSSStyle(reference.classNames, graphicStyle, fillStyle, strokeStyle);
                    auto saveRestore = SaveRestoreHelper{mRenderer, reference.graphicStyle};
                    ExtractBounds(*(refIt->second));
                }

                // Done processing current element.
                mVisitedElements.erase(insertResult.first);
                break;
            }
        case ElementType::kGraphic:
            {
                const auto& graphic = static_cast<const Graphic&>(element);
                // TODO: Since we keep the original fill, stroke and color property values
                // we should be able to do w/o a copy.
                fillStyle = graphic.fillStyle;
                strokeStyle = graphic.strokeStyle;
                ApplyCSSStyle(graphic.classNames, graphicStyle, fillStyle, strokeStyle);
                Rect bounds = mRenderer->GetBounds(*(graphic.path.get()), graphicStyle, fillStyle, strokeStyle);
                if (!bounds.IsEmpty())
                {
#ifdef DEBUG_API
                    mBounds.push_back(bounds);
#else
                    mBound = mBound | bounds;
#endif
                }
                break;
            }
        case ElementType::kImage:
            {
                const auto& image = static_cast<const Image&>(element);
                ApplyCSSStyle(image.classNames, graphicStyle, fillStyle, strokeStyle);
                // TODO: How to handle image's bounds?
                auto path = mRenderer->CreatePath();
                path->Rect(image.fillArea.x, image.fillArea.y, image.fillArea.width, image.fillArea.height);
                Rect bounds = mRenderer->GetBounds(*path.get(), GraphicStyle{}, FillStyle{}, StrokeStyle{});
                if (!bounds.IsEmpty())
                {
#ifdef DEBUG_API
                    mBounds.push_back(bounds);
#else
                    mBound = mBound | bounds;
#endif
                }
                break;
            }
        case ElementType::kGroup:
            {
                const auto& group = static_cast<const Group&>(element);
                ApplyCSSStyle(group.classNames, graphicStyle, fillStyle, strokeStyle);
                auto saveRestore = SaveRestoreHelper{mRenderer, group.graphicStyle};
                for (const auto& child : group.children)
                    ExtractBounds(*child);
                break;
            }
        default:
            SVG_ASSERT_MSG(false, "Unknown element type");
    }
}

void SVGDocumentImpl::AddChildToCurrentGroup(std::shared_ptr<Element> element, std::string idString)
{
    SVG_ASSERT(!mGroupStack.empty());
    if (mGroupStack.empty())
        return;

    mGroupStack.top()->children.push_back(element);

    if (!idString.empty() && mIdToElementMap.find(idString) == mIdToElementMap.end())
        mIdToElementMap.emplace(std::move(idString), element);
}

static void ResolveColorImpl(const ColorMap& colorMap, const ColorImpl& colorImpl, Color& color)
{
    if (colorImpl.type() == typeid(Variable))
    {
        const auto& var = boost::get<Variable>(colorImpl);
        const auto colorIt = colorMap.find(var.first);
        color = colorIt != colorMap.end() ? colorIt->second : var.second;
    }
    else if (colorImpl.type() == typeid(Color))
        color = boost::get<Color>(colorImpl);
    else
        // Can only be reached if fallback color value of var() is currentColor.
        color = Color{{0.0f, 0.0f, 0.0f, 1.0f}};
}

static void ResolvePaintImpl(const ColorMap& colorMap, const PaintImpl& internalPaint, const Color& currentColor, Paint& paint)
{
    if (internalPaint.type() == typeid(Variable))
    {
        const auto& var = boost::get<Variable>(internalPaint);
        const auto colorIt = colorMap.find(var.first);
        paint = colorIt != colorMap.end() ? colorIt->second : var.second;
    }
    else if (internalPaint.type() == typeid(GradientImpl))
    {
        // Stop colors may have variables as well.
        const auto& internalGradient = boost::get<GradientImpl>(internalPaint);
        paint = std::move(internalGradient);
        auto& gradient = boost::get<Gradient>(paint);
        for (const auto& colorStop : internalGradient.internalColorStops)
        {
            Color stopColor{{0, 0, 0, 1.0}};
            const auto& colorImpl = std::get<1>(colorStop);
            if (colorImpl.type() == typeid(Variable))
            {
                const auto& var = boost::get<Variable>(colorImpl);
                const auto colorIt = colorMap.find(var.first);
                stopColor = colorIt != colorMap.end() ? colorIt->second : var.second;
            }
            else if (colorImpl.type() == typeid(Color))
                stopColor = boost::get<Color>(colorImpl);
            else
            {
                SVG_ASSERT_MSG(false, "Unhandled ColorImpl type");
            }
            stopColor[3] *= std::get<2>(colorStop);
            gradient.colorStops.push_back({std::get<0>(colorStop), stopColor});
        }
    }
    else if (internalPaint.type() == typeid(Color))
        paint = boost::get<Color>(internalPaint);
    else if (internalPaint.type() == typeid(ColorKeys))
        // currentColor is the only possible enum value for now.
        paint = currentColor;
    else
        SVG_ASSERT_MSG(false, "Unhandled PaintImpl type");
}

void SVGDocumentImpl::TraverseTree(const ColorMap& colorMap, const Element& element)
{
    // Inheritance doesn't work for override styles. Since override styles
    // are deprecated, we are not going to fix this nor is this expected by
    // (still existing) clients.
    auto graphicStyle = element.graphicStyle;
    FillStyleImpl fillStyle{};
    StrokeStyleImpl strokeStyle{};
    // Do not draw element if an applied clipPath has no content.
    if (graphicStyle.clippingPath && !graphicStyle.clippingPath->hasClipContent)
        return;
    switch (element.Type())
    {
    case ElementType::kReference:
    {
        const auto& reference = static_cast<const Reference&>(element);
        const auto it = mVisitedElements.find(&reference);
        if (it != mVisitedElements.end())
            break; // We found a cycle. Do not continue rendering.
        auto insertResult = mVisitedElements.insert(&reference);

        // Render referenced content.
        auto refIt = mIdToElementMap.find(reference.href);
        if (refIt != mIdToElementMap.end())
        {
            ApplyCSSStyle(reference.classNames, graphicStyle, fillStyle, strokeStyle);
            auto saveRestore = SaveRestoreHelper{mRenderer, reference.graphicStyle};
            TraverseTree(colorMap, *(refIt->second));
        }

        // Done processing current element.
        mVisitedElements.erase(insertResult.first);
        break;
    }
    case ElementType::kGraphic:
    {
        const auto& graphic = static_cast<const Graphic&>(element);
        // TODO: Since we keep the original fill, stroke and color property values
        // we should be able to do w/o a copy.
        fillStyle = graphic.fillStyle;
        strokeStyle = graphic.strokeStyle;
        ApplyCSSStyle(graphic.classNames, graphicStyle, fillStyle, strokeStyle);
        // If we have a CSS var() function we need to replace the placeholder with
        // an actual color from our externally provided color map here.
        Color color{{0.0f, 0.0f, 0.0f, 1.0f}};
        ResolveColorImpl(colorMap, fillStyle.color, color);
        ResolvePaintImpl(colorMap, fillStyle.internalPaint, color, fillStyle.paint);
        ResolvePaintImpl(colorMap, strokeStyle.internalPaint, color, strokeStyle.paint);
        mRenderer->DrawPath(*(graphic.path.get()), graphicStyle, fillStyle, strokeStyle);
        break;
    }
    case ElementType::kImage:
    {
        const auto& image = static_cast<const Image&>(element);
        ApplyCSSStyle(image.classNames, graphicStyle, fillStyle, strokeStyle);
        mRenderer->DrawImage(*(image.imageData.get()), graphicStyle, image.clipArea, image.fillArea);
        break;
    }
    case ElementType::kGroup:
    {
        const auto& group = static_cast<const Group&>(element);
        ApplyCSSStyle(group.classNames, graphicStyle, fillStyle, strokeStyle);
        auto saveRestore = SaveRestoreHelper{mRenderer, group.graphicStyle};
        for (const auto& child : group.children)
            TraverseTree(colorMap, *child);
        break;
    }
    default:
        SVG_ASSERT_MSG(false, "Unknown element type");
    }
}

#ifndef STYLE_SUPPORT
// Deprecated style support
void SVGDocumentImpl::ApplyCSSStyle(
    const std::set<std::string>&, GraphicStyleImpl&, FillStyleImpl&, StrokeStyleImpl&) {}
void SVGDocumentImpl::ParseStyleAttr(const XMLNode*, std::vector<PropertySet>&, std::set<std::string>&) {}
void SVGDocumentImpl::ParseStyle(const XMLNode*) {}
#endif

} // namespace SVGNative
