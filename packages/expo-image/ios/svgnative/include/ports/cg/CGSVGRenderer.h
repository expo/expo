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

#ifndef SVGViewer_CGSVGRenderer_h
#define SVGViewer_CGSVGRenderer_h

#ifdef __cplusplus

#import <CoreGraphics/CoreGraphics.h>
#import <ExpoImage/SVGRenderer.h>

namespace SVGNative
{
class CGSVGPath final : public Path
{
public:
    CGSVGPath();
    ~CGSVGPath();

    void Rect(float x, float y, float width, float height) override;
    void RoundedRect(float x, float y, float width, float height, float rx, float ry) override;
    void Ellipse(float cx, float cy, float rx, float ry) override;

    void MoveTo(float x, float y) override;
    void LineTo(float x, float y) override;
    void CurveTo(float x1, float y1, float x2, float y2, float x3, float y3) override;
    void CurveToV(float x2, float y2, float x3, float y3) override;
    void ClosePath() override;

    CGMutablePathRef mPath;

private:
    float mCurrentX{};
    float mCurrentY{};
};

class CGSVGTransform final : public Transform
{
public:
    CGSVGTransform(float a, float b, float c, float d, float tx, float ty);

    void Set(float a, float b, float c, float d, float tx, float ty) override;
    void Rotate(float r) override;
    void Translate(float tx, float ty) override;
    void Scale(float sx, float sy) override;
    void Concat(float a, float b, float c, float d, float tx, float ty) override;

    CGAffineTransform mTransform;
};

class CGSVGImageData final : public ImageData
{
public:
    CGSVGImageData(const std::string& base64, ImageEncoding encoding);

    ~CGSVGImageData();

    float Width() const override;

    float Height() const override;

    CGImageRef mImage{};
};

class SVG_IMP_EXP CGSVGRenderer final : public SVGRenderer
{
public:
    CGSVGRenderer();

    virtual ~CGSVGRenderer() { ReleaseGraphicsContext(); }

    std::unique_ptr<ImageData> CreateImageData(const std::string& base64, ImageEncoding encoding) override { return std::unique_ptr<CGSVGImageData>(new CGSVGImageData(base64, encoding)); }

    std::unique_ptr<Path> CreatePath() override { return std::unique_ptr<CGSVGPath>(new CGSVGPath); }

    std::unique_ptr<Transform> CreateTransform(
        float a = 1.0, float b = 0.0, float c = 0.0, float d = 1.0, float tx = 0.0, float ty = 0.0) override
    {
        return std::unique_ptr<CGSVGTransform>(new CGSVGTransform(a, b, c, d, tx, ty));
    }

    void Save(const GraphicStyle& graphicStyle) override;
    void Restore() override;

    void DrawPath(const Path& path, const GraphicStyle& graphicStyle, const FillStyle& fillStyle, const StrokeStyle& strokeStyle) override;
    void DrawImage(const ImageData& image, const GraphicStyle& graphicStyle, const Rect& clipArea, const Rect& fillArea) override;

    void SetGraphicsContext(CGContextRef context)
    {
        ReleaseGraphicsContext();
        mContext = CGContextRetain(context);
    }

    void ReleaseGraphicsContext()
    {
        if (!mContext)
            return;

        CGContextRelease(mContext);
        mContext = nullptr;
    }

private:
    void DrawGradientToContext(const Gradient& gradient, float opacity);

    CGContextRef mContext{};
};

} // namespace SVGNative

#endif // __cplusplus

#endif // SVGViewer_CGSVGRenderer_h
