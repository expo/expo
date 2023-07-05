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

#include <math.h>

#include "CGSVGRenderer.h"
#include "base64.h"
#include "Config.h"

namespace SVGNative
{
CGSVGPath::CGSVGPath() { mPath = CGPathCreateMutable(); }

CGSVGPath::~CGSVGPath() { CGPathRelease(mPath); }

void CGSVGPath::Rect(float x, float y, float width, float height) { CGPathAddRect(mPath, 0, {{x, y}, {width, height}}); }

void CGSVGPath::RoundedRect(float x, float y, float width, float height, float rx, float ry)
{
    CGPathAddRoundedRect(mPath, nullptr, {{x, y}, {width, height}}, rx, ry);
}

void CGSVGPath::Ellipse(float cx, float cy, float rx, float ry)
{
    CGPathAddEllipseInRect(mPath, nullptr, {{cx - rx, cy - ry}, {2 * rx, 2 * ry}});
}

void CGSVGPath::MoveTo(float x, float y)
{
    CGPathMoveToPoint(mPath, nullptr, x, y);
    mCurrentX = x;
    mCurrentY = y;
}

void CGSVGPath::LineTo(float x, float y)
{
    CGPathAddLineToPoint(mPath, nullptr, x, y);
    mCurrentX = x;
    mCurrentY = y;
}

void CGSVGPath::CurveTo(float x1, float y1, float x2, float y2, float x3, float y3)
{
    CGPathAddCurveToPoint(mPath, nullptr, x1, y1, x2, y2, x3, y3);
    mCurrentX = x3;
    mCurrentY = y3;
}

void CGSVGPath::CurveToV(float x2, float y2, float x3, float y3)
{
    CGPathAddQuadCurveToPoint(mPath, nullptr, x2, y2, x3, y3);
    mCurrentX = x3;
    mCurrentY = y3;
}

void CGSVGPath::ClosePath() { CGPathCloseSubpath(mPath); }

CGSVGTransform::CGSVGTransform(float a, float b, float c, float d, float tx, float ty) { mTransform = {a, b, c, d, tx, ty}; }

void CGSVGTransform::Set(float a, float b, float c, float d, float tx, float ty) { mTransform = {a, b, c, d, tx, ty}; }

void CGSVGTransform::Rotate(float degree) {
    mTransform = CGAffineTransformRotate(mTransform, degree * M_PI / 180.0);
}

void CGSVGTransform::Translate(float tx, float ty) { mTransform = CGAffineTransformTranslate(mTransform, tx, ty); }

void CGSVGTransform::Scale(float sx, float sy) { mTransform = CGAffineTransformScale(mTransform, sx, sy); }

void CGSVGTransform::Concat(float a, float b, float c, float d, float tx, float ty)
{
    mTransform = CGAffineTransformConcat({a, b, c, d, tx, ty}, mTransform);
}

CGSVGImageData::CGSVGImageData(const std::string& base64, ImageEncoding encoding)
{
    std::string imageString = base64_decode(base64);
    auto dataProvider = CGDataProviderCreateWithCFData(CFDataCreate(NULL, (const UInt8*)imageString.data(), imageString.size()));
    if (encoding == ImageEncoding::kPNG)
        mImage = CGImageCreateWithPNGDataProvider(dataProvider, NULL, true, kCGRenderingIntentDefault);
    else if (encoding == ImageEncoding::kJPEG)
        mImage = CGImageCreateWithJPEGDataProvider(dataProvider, NULL, true, kCGRenderingIntentDefault);
}

CGSVGImageData::~CGSVGImageData()
{
    if (mImage)
        CGImageRelease(mImage);
    mImage = nullptr;
}

float CGSVGImageData::Width() const
{
    if (!mImage)
        return 0;
    return static_cast<float>(CGImageGetWidth(mImage));
}

float CGSVGImageData::Height() const
{
    if (!mImage)
        return 0;
    return static_cast<float>(CGImageGetHeight(mImage));
}

CGSVGRenderer::CGSVGRenderer() {}

void CGSVGRenderer::Save(const GraphicStyle& graphicStyle)
{
    SVG_ASSERT(mContext);
    CGContextSaveGState(mContext);
    if (graphicStyle.transform)
        CGContextConcatCTM(mContext, static_cast<CGSVGTransform*>(graphicStyle.transform.get())->mTransform);
    if (graphicStyle.clippingPath)
    {
        CGContextBeginPath(mContext);
        auto path = static_cast<const CGSVGPath*>(graphicStyle.clippingPath->path.get())->mPath;
        if (graphicStyle.clippingPath->transform)
        {
            auto newPath = CGPathCreateCopyByTransformingPath(path, &static_cast<CGSVGTransform*>(graphicStyle.clippingPath->transform.get())->mTransform);
            CGContextAddPath(mContext, newPath);
            CGPathRelease(newPath);
        }
        else
            CGContextAddPath(mContext, path);
        if (graphicStyle.clippingPath->clipRule == WindingRule::kEvenOdd)
            CGContextEOClip(mContext);
        else
            CGContextClip(mContext);
    }
    CGContextSetAlpha(mContext, graphicStyle.opacity);
    CGContextBeginTransparencyLayer(mContext, 0);
}

void CGSVGRenderer::Restore()
{
    SVG_ASSERT(mContext);
    CGContextEndTransparencyLayer(mContext);
    CGContextRestoreGState(mContext);
}

void CGSVGRenderer::DrawGradientToContext(const Gradient& gradient, float opacity)
{
    CGGradientDrawingOptions gradientDrawOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;
    std::vector<CGFloat> components;
    std::vector<CGFloat> locations;
    for (const auto& colorStop : gradient.colorStops)
    {
        locations.push_back(colorStop.first);
        const auto& color = colorStop.second;
        components.push_back(color[0]);
        components.push_back(color[1]);
        components.push_back(color[2]);
        components.push_back(color[3] * opacity);
    }
    auto colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    auto gradientCG = CGGradientCreateWithColorComponents(colorSpace, components.data(), locations.data(), locations.size());
    if (gradient.type == GradientType::kLinearGradient)
        CGContextDrawLinearGradient(mContext, gradientCG, {gradient.x1, gradient.y1}, {gradient.x2, gradient.y2}, gradientDrawOptions);
    else
        CGContextDrawRadialGradient(
            mContext, gradientCG, {gradient.fx, gradient.fx}, 0, {gradient.cx, gradient.cx}, gradient.r, gradientDrawOptions);
}

void CGSVGRenderer::DrawPath(const Path& path, const GraphicStyle& graphicStyle, const FillStyle& fillStyle, const StrokeStyle& strokeStyle)
{
    SVG_ASSERT(mContext);
    Save(graphicStyle);
    if (fillStyle.hasFill)
    {
        CGContextBeginPath(mContext);
        CGContextAddPath(mContext, static_cast<const CGSVGPath&>(path).mPath);
        if (fillStyle.paint.type() == typeid(Color))
        {
            const auto& color = boost::get<Color>(fillStyle.paint);
            CGContextSetRGBFillColor(mContext, color[0], color[1], color[2], color[3] * fillStyle.fillOpacity);
            if (fillStyle.fillRule == WindingRule::kEvenOdd)
                CGContextEOFillPath(mContext);
            else
                CGContextFillPath(mContext);
        }
        else if (fillStyle.paint.type() == typeid(Gradient))
        {
            const auto& gradient = boost::get<Gradient>(fillStyle.paint);
            CGContextSaveGState(mContext);

            if (gradient.transform)
                CGContextConcatCTM(mContext, static_cast<CGSVGTransform*>(gradient.transform.get())->mTransform);
            if (fillStyle.fillRule == WindingRule::kEvenOdd)
                CGContextEOClip(mContext);
            else
                CGContextClip(mContext);

            DrawGradientToContext(gradient, fillStyle.fillOpacity);

            CGContextRestoreGState(mContext);
        }
    }
    if (strokeStyle.hasStroke)
    {
        switch (strokeStyle.lineCap)
        {
        case LineCap::kButt:
            CGContextSetLineCap(mContext, kCGLineCapButt);
            break;
        case LineCap::kRound:
            CGContextSetLineCap(mContext, kCGLineCapRound);
            break;
        case LineCap::kSquare:
            CGContextSetLineCap(mContext, kCGLineCapSquare);
            break;
        }
        switch (strokeStyle.lineJoin)
        {
        case LineJoin::kMiter:
            CGContextSetLineJoin(mContext, kCGLineJoinMiter);
            break;
        case LineJoin::kRound:
            CGContextSetLineJoin(mContext, kCGLineJoinRound);
            break;
        case LineJoin::kBevel:
            CGContextSetLineJoin(mContext, kCGLineJoinBevel);
            break;
        }
        CGContextSetMiterLimit(mContext, strokeStyle.miterLimit);
        CGContextSetLineWidth(mContext, strokeStyle.lineWidth);

        CGContextBeginPath(mContext);
        CGContextAddPath(mContext, static_cast<const CGSVGPath&>(path).mPath);
        if (strokeStyle.paint.type() == typeid(Color))
        {
            const auto& color = boost::get<Color>(strokeStyle.paint);
            CGContextSetRGBStrokeColor(mContext, color[0], color[1], color[2], color[3] * strokeStyle.strokeOpacity);
            CGContextStrokePath(mContext);
        }
        else if (strokeStyle.paint.type() == typeid(Gradient))
        {
            const auto& gradient = boost::get<Gradient>(strokeStyle.paint);
            CGContextSaveGState(mContext);

            CGContextReplacePathWithStrokedPath(mContext);
            CGContextClip(mContext);
            if (gradient.transform)
                CGContextConcatCTM(mContext, static_cast<CGSVGTransform*>(gradient.transform.get())->mTransform);

            DrawGradientToContext(gradient, strokeStyle.strokeOpacity);

            CGContextRestoreGState(mContext);
        }
    }
    CGContextSetShouldAntialias(mContext, true);
    Restore();
}

void CGSVGRenderer::DrawImage(const ImageData& image, const GraphicStyle& graphicStyle, const Rect& clipArea, const Rect& fillArea)
{
    SVG_ASSERT(mContext);
    Save(graphicStyle);
    if (clipArea.width < fillArea.width || clipArea.height < fillArea.height)
        CGContextClipToRect(mContext, {{clipArea.x, clipArea.y}, {clipArea.width, clipArea.height}});
    // CG flips back the context for images
    CGContextTranslateCTM(mContext, 0, fillArea.y + fillArea.height);
    CGContextScaleCTM(mContext, 1, -1);
    CGContextDrawImage(mContext, {{fillArea.x, 0}, {fillArea.width, fillArea.height}}, static_cast<const CGSVGImageData&>(image).mImage);
    Restore();
}

} // namespace SVGNative
