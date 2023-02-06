#pragma once

#include <memory>
#include <utility>
#include <vector>

#include "JsiSkFont.h"
#include "JsiSkHostObjects.h"
#include "JsiSkImage.h"
#include "JsiSkMatrix.h"
#include "JsiSkPaint.h"
#include "JsiSkPath.h"
#include "JsiSkPicture.h"
#include "JsiSkPoint.h"
#include "JsiSkRRect.h"
#include "JsiSkSVG.h"
#include "JsiSkTextBlob.h"
#include "JsiSkVertices.h"

#include <jsi/jsi.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkCanvas.h"
#include "SkFont.h"
#include "SkPaint.h"
#include "SkPath.h"
#include "SkPicture.h"
#include "SkRegion.h"
#include "SkSurface.h"
#include "SkTypeface.h"

#pragma clang diagnostic pop

namespace RNSkia {
namespace jsi = facebook::jsi;

class JsiSkCanvas : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(drawPaint) {
    auto paint = JsiSkPaint::fromValue(runtime, arguments[0]);
    _canvas->drawPaint(*paint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawLine) {
    SkScalar x1 = arguments[0].asNumber();
    SkScalar y1 = arguments[1].asNumber();
    SkScalar x2 = arguments[2].asNumber();
    SkScalar y2 = arguments[3].asNumber();
    auto paint = JsiSkPaint::fromValue(runtime, arguments[4]);
    _canvas->drawLine(x1, y1, x2, y2, *paint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawRect) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    auto paint = JsiSkPaint::fromValue(runtime, arguments[1]);
    _canvas->drawRect(*rect, *paint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawImage) {
    auto image = JsiSkImage::fromValue(runtime, arguments[0]);
    auto x = arguments[1].asNumber();
    auto y = arguments[2].asNumber();
    std::shared_ptr<SkPaint> paint;
    if (count == 4) {
      paint = JsiSkPaint::fromValue(runtime, arguments[3]);
    }
    _canvas->drawImage(image, x, y, SkSamplingOptions(), paint.get());
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawImageRect) {
    auto image = JsiSkImage::fromValue(runtime, arguments[0]);
    auto src = JsiSkRect::fromValue(runtime, arguments[1]);
    auto dest = JsiSkRect::fromValue(runtime, arguments[2]);
    auto paint = JsiSkPaint::fromValue(runtime, arguments[3]);
    auto fastSample = count < 5 ? false : arguments[4].getBool();
    _canvas->drawImageRect(image, *src, *dest, SkSamplingOptions(), paint.get(),
                           fastSample ? SkCanvas::kFast_SrcRectConstraint
                                      : SkCanvas::kStrict_SrcRectConstraint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawImageCubic) {
    auto image = JsiSkImage::fromValue(runtime, arguments[0]);
    auto x = arguments[1].asNumber();
    auto y = arguments[2].asNumber();
    float B = arguments[3].asNumber();
    float C = arguments[4].asNumber();
    std::shared_ptr<SkPaint> paint;
    if (count == 6) {
      if (!arguments[5].isNull()) {
        paint = JsiSkPaint::fromValue(runtime, arguments[5]);
      }
    }
    _canvas->drawImage(image, x, y, SkSamplingOptions({B, C}), paint.get());
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawImageOptions) {
    auto image = JsiSkImage::fromValue(runtime, arguments[0]);
    auto x = arguments[1].asNumber();
    auto y = arguments[2].asNumber();
    auto fm = (SkFilterMode)arguments[3].asNumber();
    auto mm = (SkMipmapMode)arguments[4].asNumber();
    std::shared_ptr<SkPaint> paint;
    if (count == 6) {
      if (!arguments[5].isNull()) {
        paint = JsiSkPaint::fromValue(runtime, arguments[5]);
      }
    }
    _canvas->drawImage(image, x, y, SkSamplingOptions(fm, mm), paint.get());
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawImageNine) {
    auto image = JsiSkImage::fromValue(runtime, arguments[0]);
    auto center = JsiSkRect::fromValue(runtime, arguments[1]);
    auto dest = JsiSkRect::fromValue(runtime, arguments[2]);
    auto fm = (SkFilterMode)arguments[3].asNumber();
    std::shared_ptr<SkPaint> paint;
    if (count == 5) {
      if (!arguments[4].isNull()) {
        paint = JsiSkPaint::fromValue(runtime, arguments[4]);
      }
    }
    _canvas->drawImageNine(image.get(), center->round(), *dest, fm,
                           paint.get());
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawImageRectCubic) {
    auto image = JsiSkImage::fromValue(runtime, arguments[0]);
    auto src = JsiSkRect::fromValue(runtime, arguments[1]);
    auto dest = JsiSkRect::fromValue(runtime, arguments[2]);
    float B = arguments[3].asNumber();
    float C = arguments[4].asNumber();
    std::shared_ptr<SkPaint> paint;
    if (count == 6) {
      if (!arguments[5].isNull()) {
        paint = JsiSkPaint::fromValue(runtime, arguments[5]);
      }
    }
    auto constraint =
        SkCanvas::kStrict_SrcRectConstraint; // TODO: get from caller
    _canvas->drawImageRect(image.get(), *src, *dest, SkSamplingOptions({B, C}),
                           paint.get(), constraint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawImageRectOptions) {
    auto image = JsiSkImage::fromValue(runtime, arguments[0]);
    auto src = JsiSkRect::fromValue(runtime, arguments[1]);
    auto dest = JsiSkRect::fromValue(runtime, arguments[2]);
    auto filter = (SkFilterMode)arguments[3].asNumber();
    auto mipmap = (SkMipmapMode)arguments[4].asNumber();
    std::shared_ptr<SkPaint> paint;
    if (count == 6) {
      if (!arguments[5].isNull()) {
        paint = JsiSkPaint::fromValue(runtime, arguments[5]);
      }
    }
    auto constraint = SkCanvas::kStrict_SrcRectConstraint;
    _canvas->drawImageRect(image.get(), *src, *dest, {filter, mipmap},
                           paint.get(), constraint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawCircle) {
    SkScalar cx = arguments[0].asNumber();
    SkScalar cy = arguments[1].asNumber();
    SkScalar radius = arguments[2].asNumber();

    auto paint = JsiSkPaint::fromValue(runtime, arguments[3]);
    _canvas->drawCircle(cx, cy, radius, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawArc) {
    auto oval = JsiSkRect::fromValue(runtime, arguments[0]);

    SkScalar startAngle = arguments[1].asNumber();
    SkScalar sweepAngle = arguments[2].asNumber();
    bool useCenter = arguments[3].getBool();

    auto paint = JsiSkPaint::fromValue(runtime, arguments[4]);
    _canvas->drawArc(*oval, startAngle, sweepAngle, useCenter, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawRRect) {
    auto rect = JsiSkRRect::fromValue(runtime, arguments[0]);
    auto paint = JsiSkPaint::fromValue(runtime, arguments[1]);

    _canvas->drawRRect(*rect, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawDRRect) {
    auto outer = JsiSkRRect::fromValue(runtime, arguments[0]);
    auto inner = JsiSkRRect::fromValue(runtime, arguments[1]);
    auto paint = JsiSkPaint::fromValue(runtime, arguments[2]);

    _canvas->drawDRRect(*outer, *inner, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawOval) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    auto paint = JsiSkPaint::fromValue(runtime, arguments[1]);

    _canvas->drawOval(*rect, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(restoreToCount) {
    auto c = arguments[0].asNumber();
    _canvas->restoreToCount(c);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(getSaveCount) {
    return static_cast<int>(_canvas->getSaveCount());
  }

  JSI_HOST_FUNCTION(drawPoints) {
    auto pointMode = arguments[0].asNumber();
    std::vector<SkPoint> points;

    auto jsiPoints = arguments[1].asObject(runtime).asArray(runtime);
    auto pointsSize = jsiPoints.size(runtime);
    points.reserve(pointsSize);

    for (int i = 0; i < pointsSize; i++) {
      std::shared_ptr<SkPoint> point = JsiSkPoint::fromValue(
          runtime, jsiPoints.getValueAtIndex(runtime, i).asObject(runtime));
      points.push_back(*point.get());
    }

    auto paint = JsiSkPaint::fromValue(runtime, arguments[2]);

    _canvas->drawPoints((SkCanvas::PointMode)pointMode, pointsSize,
                        points.data(), *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawVertices) {
    auto vertices = JsiSkVertices::fromValue(runtime, arguments[0]);
    auto blendMode = (SkBlendMode)arguments[1].getNumber();
    auto paint = JsiSkPaint::fromValue(runtime, arguments[2]);
    _canvas->drawVertices(vertices, blendMode, *paint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawPatch) {
    std::vector<SkPoint> cubics;
    std::vector<SkColor> colors;
    std::vector<SkPoint> texs;

    auto jsiCubics = arguments[0].asObject(runtime).asArray(runtime);
    auto cubicsSize = jsiCubics.size(runtime);
    cubics.reserve(cubicsSize);
    for (int i = 0; i < cubicsSize; i++) {
      std::shared_ptr<SkPoint> point = JsiSkPoint::fromValue(
          runtime, jsiCubics.getValueAtIndex(runtime, i).asObject(runtime));
      cubics.push_back(*point.get());
    }

    if (count >= 2 && !arguments[1].isNull() && !arguments[1].isUndefined()) {
      auto jsiColors = arguments[1].asObject(runtime).asArray(runtime);
      auto colorsSize = jsiColors.size(runtime);
      colors.reserve(colorsSize);
      for (int i = 0; i < colorsSize; i++) {
        SkColor color = JsiSkColor::fromValue(
            runtime, jsiColors.getValueAtIndex(runtime, i));
        colors.push_back(color);
      }
    }

    if (count >= 3 && !arguments[2].isNull() && !arguments[2].isUndefined()) {
      auto jsiTexs = arguments[2].asObject(runtime).asArray(runtime);
      auto texsSize = jsiTexs.size(runtime);
      texs.reserve(texsSize);
      for (int i = 0; i < texsSize; i++) {
        auto point = JsiSkPoint::fromValue(
            runtime, jsiTexs.getValueAtIndex(runtime, i).asObject(runtime));
        texs.push_back(*point.get());
      }
    }

    auto paint =
        count >= 4 ? JsiSkPaint::fromValue(runtime, arguments[4]) : nullptr;
    auto blendMode = static_cast<SkBlendMode>(arguments[3].asNumber());
    _canvas->drawPatch(cubics.data(), colors.data(), texs.data(), blendMode,
                       *paint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawPath) {
    auto path = JsiSkPath::fromValue(runtime, arguments[0]);
    auto paint = JsiSkPaint::fromValue(runtime, arguments[1]);

    _canvas->drawPath(*path, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawText) {
    auto textVal = arguments[0].asString(runtime).utf8(runtime);
    auto text = textVal.c_str();
    SkScalar x = arguments[1].asNumber();
    SkScalar y = arguments[2].asNumber();

    auto paint = JsiSkPaint::fromValue(runtime, arguments[3]);
    auto font = JsiSkFont::fromValue(runtime, arguments[4]);

    _canvas->drawSimpleText(text, strlen(text), SkTextEncoding::kUTF8, x, y,
                            *font, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawTextBlob) {
    auto blob = JsiSkTextBlob::fromValue(runtime, arguments[0]);
    SkScalar x = arguments[1].asNumber();
    SkScalar y = arguments[2].asNumber();
    auto paint = JsiSkPaint::fromValue(runtime, arguments[3]);
    _canvas->drawTextBlob(blob, x, y, *paint);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawGlyphs) {
    auto jsiGlyphs = arguments[0].asObject(runtime).asArray(runtime);
    auto jsiPositions = arguments[1].asObject(runtime).asArray(runtime);
    auto x = arguments[2].asNumber();
    auto y = arguments[3].asNumber();
    auto font = JsiSkFont::fromValue(runtime, arguments[4]);
    auto paint = JsiSkPaint::fromValue(runtime, arguments[5]);
    SkPoint origin = SkPoint::Make(x, y);

    std::vector<SkPoint> positions;
    int pointsSize = static_cast<int>(jsiPositions.size(runtime));
    positions.reserve(pointsSize);
    for (int i = 0; i < pointsSize; i++) {
      std::shared_ptr<SkPoint> point = JsiSkPoint::fromValue(
          runtime, jsiPositions.getValueAtIndex(runtime, i).asObject(runtime));
      positions.push_back(*point.get());
    }

    std::vector<SkGlyphID> glyphs;
    int glyphsSize = static_cast<int>(jsiGlyphs.size(runtime));
    glyphs.reserve(glyphsSize);
    for (int i = 0; i < glyphsSize; i++) {
      glyphs.push_back(jsiGlyphs.getValueAtIndex(runtime, i).asNumber());
    }

    _canvas->drawGlyphs(glyphsSize, glyphs.data(), positions.data(), origin,
                        *font, *paint);

    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawSvg) {
    auto svgdom = JsiSkSVG::fromValue(runtime, arguments[0]);
    if (count == 3) {
      // read size
      auto w = arguments[1].asNumber();
      auto h = arguments[2].asNumber();
      svgdom->setContainerSize(SkSize::Make(w, h));
    } else {
      auto canvasSize = _canvas->getBaseLayerSize();
      svgdom->setContainerSize(SkSize::Make(canvasSize));
    }
    svgdom->render(_canvas);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(clipPath) {
    auto path = JsiSkPath::fromValue(runtime, arguments[0]);
    auto op = (SkClipOp)arguments[1].asNumber();
    auto doAntiAlias = arguments[2].getBool();
    _canvas->clipPath(*path, op, doAntiAlias);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(clipRect) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    auto op = (SkClipOp)arguments[1].asNumber();
    auto doAntiAlias = arguments[2].getBool();
    _canvas->clipRect(*rect, op, doAntiAlias);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(clipRRect) {
    auto rrect = JsiSkRRect::fromValue(runtime, arguments[0]);
    auto op = (SkClipOp)arguments[1].asNumber();
    auto doAntiAlias = arguments[2].getBool();
    _canvas->clipRRect(*rrect, op, doAntiAlias);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(save) { return jsi::Value(_canvas->save()); }

  JSI_HOST_FUNCTION(saveLayer) {
    SkPaint *paint = (count >= 1 && !arguments[0].isUndefined())
                         ? JsiSkPaint::fromValue(runtime, arguments[0]).get()
                         : nullptr;
    SkRect *bounds =
        count >= 2 && !arguments[1].isNull() && !arguments[1].isUndefined()
            ? JsiSkRect::fromValue(runtime, arguments[1]).get()
            : nullptr;
    SkImageFilter *backdrop =
        count >= 3 && !arguments[2].isNull() && !arguments[2].isUndefined()
            ? JsiSkImageFilter::fromValue(runtime, arguments[2]).get()
            : nullptr;
    SkCanvas::SaveLayerFlags flags = count >= 4 ? arguments[3].asNumber() : 0;
    return jsi::Value(_canvas->saveLayer(
        SkCanvas::SaveLayerRec(bounds, paint, backdrop, flags)));
  }

  JSI_HOST_FUNCTION(restore) {
    _canvas->restore();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(rotate) {
    SkScalar degrees = arguments[0].asNumber();
    SkScalar rx = arguments[1].asNumber();
    SkScalar ry = arguments[2].asNumber();
    _canvas->rotate(degrees, rx, ry);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(translate) {
    SkScalar dx = arguments[0].asNumber();
    SkScalar dy = arguments[1].asNumber();
    _canvas->translate(dx, dy);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(scale) {
    SkScalar sx = arguments[0].asNumber();
    SkScalar sy = arguments[1].asNumber();
    _canvas->scale(sx, sy);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(skew) {
    SkScalar sx = arguments[0].asNumber();
    SkScalar sy = arguments[1].asNumber();
    _canvas->skew(sx, sy);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawColor) {
    SkColor cl = JsiSkColor::fromValue(runtime, arguments[0]);
    if (count == 1) {
      _canvas->drawColor(cl);
    } else {
      auto mode = static_cast<SkBlendMode>(arguments[1].asNumber());
      _canvas->drawColor(cl, mode);
    }
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(clear) {
    SkColor cl = JsiSkColor::fromValue(runtime, arguments[0]);
    _canvas->clear(cl);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(concat) {
    auto matrix = JsiSkMatrix::fromValue(runtime, arguments[0]);
    _canvas->concat(*matrix.get());
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(drawPicture) {
    auto picture = JsiSkPicture::fromValue(runtime, arguments[0]);
    _canvas->drawPicture(picture);
    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkCanvas, drawPaint),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawLine),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawRect),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawImage),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawImageRect),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawImageCubic),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawImageOptions),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawImageNine),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawImageRectCubic),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawImageRectOptions),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawCircle),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawArc),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawRRect),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawDRRect),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawOval),
                       JSI_EXPORT_FUNC(JsiSkCanvas, restoreToCount),
                       JSI_EXPORT_FUNC(JsiSkCanvas, getSaveCount),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawPoints),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawPatch),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawPath),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawVertices),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawText),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawTextBlob),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawGlyphs),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawSvg),
                       JSI_EXPORT_FUNC(JsiSkCanvas, clipPath),
                       JSI_EXPORT_FUNC(JsiSkCanvas, clipRect),
                       JSI_EXPORT_FUNC(JsiSkCanvas, clipRRect),
                       JSI_EXPORT_FUNC(JsiSkCanvas, save),
                       JSI_EXPORT_FUNC(JsiSkCanvas, saveLayer),
                       JSI_EXPORT_FUNC(JsiSkCanvas, restore),
                       JSI_EXPORT_FUNC(JsiSkCanvas, rotate),
                       JSI_EXPORT_FUNC(JsiSkCanvas, translate),
                       JSI_EXPORT_FUNC(JsiSkCanvas, scale),
                       JSI_EXPORT_FUNC(JsiSkCanvas, skew),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawColor),
                       JSI_EXPORT_FUNC(JsiSkCanvas, clear),
                       JSI_EXPORT_FUNC(JsiSkCanvas, concat),
                       JSI_EXPORT_FUNC(JsiSkCanvas, drawPicture))

  explicit JsiSkCanvas(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}

  JsiSkCanvas(std::shared_ptr<RNSkPlatformContext> context, SkCanvas *canvas)
      : JsiSkCanvas(std::move(context)) {
    setCanvas(canvas);
  }

  void setCanvas(SkCanvas *canvas) { _canvas = canvas; }
  SkCanvas *getCanvas() { return _canvas; }

private:
  SkCanvas *_canvas;
};
} // namespace RNSkia
