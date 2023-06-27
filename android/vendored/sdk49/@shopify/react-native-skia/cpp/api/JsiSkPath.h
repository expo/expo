#pragma once

#include <memory>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "JsiSkMatrix.h"
#include "JsiSkPoint.h"
#include "JsiSkRRect.h"
#include "JsiSkRect.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkDashPathEffect.h"
#include "SkParsePath.h"
#include "SkPath.h"
#include "SkPathEffect.h"
#include "SkPathOps.h"
#include "SkPathTypes.h"
#include "SkPathUtils.h"
#include "SkString.h"
#include "SkStrokeRec.h"
#include "SkTextUtils.h"
#include "SkTrimPathEffect.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkPath : public JsiSkWrappingSharedPtrHostObject<SkPath> {

public:
  JSI_HOST_FUNCTION(addPath) {
    auto src = JsiSkPath::fromValue(runtime, arguments[0]);
    auto matrix =
        count > 1 && !arguments[1].isUndefined() && !arguments[1].isNull()
            ? JsiSkMatrix::fromValue(runtime, arguments[1])
            : nullptr;
    auto mode = count > 2 && arguments[2].isBool() && arguments[2].getBool()
                    ? SkPath::kExtend_AddPathMode
                    : SkPath::kAppend_AddPathMode;
    if (matrix == nullptr) {
      getObject()->addPath(*src, mode);
    } else {
      getObject()->addPath(*src, *matrix, mode);
    }
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(addArc) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    auto start = arguments[1].asNumber();
    auto sweep = arguments[2].asNumber();
    getObject()->addArc(*rect, start, sweep);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(addOval) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    auto direction = SkPathDirection::kCW;
    if (count >= 2 && arguments[1].getBool()) {
      direction = SkPathDirection::kCCW;
    }
    unsigned startIndex = count < 3 ? 0 : arguments[2].asNumber();
    auto result = getObject()->addOval(*rect, direction, startIndex);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(addPoly) {
    std::vector<SkPoint> points;
    auto jsiPoints = arguments[0].asObject(runtime).asArray(runtime);
    auto close = arguments[1].getBool();
    auto pointsSize = jsiPoints.size(runtime);
    points.reserve(pointsSize);
    for (int i = 0; i < pointsSize; i++) {
      std::shared_ptr<SkPoint> point = JsiSkPoint::fromValue(
          runtime, jsiPoints.getValueAtIndex(runtime, i).asObject(runtime));
      points.push_back(*point.get());
    }
    getObject()->addPoly(points.data(), static_cast<int>(points.size()), close);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(addRect) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    auto direction = SkPathDirection::kCW;
    if (count >= 2 && arguments[1].getBool()) {
      direction = SkPathDirection::kCCW;
    }
    getObject()->addRect(*rect, direction);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(addRRect) {
    auto rrect = JsiSkRRect::fromValue(runtime, arguments[0]);
    auto direction = SkPathDirection::kCW;
    if (count >= 2 && arguments[1].getBool()) {
      direction = SkPathDirection::kCCW;
    }
    getObject()->addRRect(*rrect, direction);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(arcToOval) {
    auto rect = JsiSkRect::fromValue(runtime, arguments[0]);
    auto start = arguments[1].asNumber();
    auto sweep = arguments[2].asNumber();
    auto forceMoveTo = arguments[3].getBool();
    getObject()->arcTo(*rect, start, sweep, forceMoveTo);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(arcToRotated) {
    auto rx = arguments[0].asNumber();
    auto ry = arguments[1].asNumber();
    auto xAxisRotate = arguments[2].asNumber();
    auto useSmallArc = arguments[3].getBool();
    auto arcSize = useSmallArc ? SkPath::ArcSize::kSmall_ArcSize
                               : SkPath::ArcSize::kLarge_ArcSize;
    auto sweep =
        arguments[4].getBool() ? SkPathDirection::kCCW : SkPathDirection::kCW;
    auto x = arguments[5].asNumber();
    auto y = arguments[6].asNumber();
    getObject()->arcTo(rx, ry, xAxisRotate, arcSize, sweep, x, y);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(rArcTo) {
    auto rx = arguments[0].asNumber();
    auto ry = arguments[1].asNumber();
    auto xAxisRotate = arguments[2].asNumber();
    auto useSmallArc = arguments[3].getBool();
    auto arcSize = useSmallArc ? SkPath::ArcSize::kSmall_ArcSize
                               : SkPath::ArcSize::kLarge_ArcSize;
    auto sweep =
        arguments[4].getBool() ? SkPathDirection::kCCW : SkPathDirection::kCW;
    auto x = arguments[5].asNumber();
    auto y = arguments[6].asNumber();
    getObject()->rArcTo(rx, ry, xAxisRotate, arcSize, sweep, x, y);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(arcToTangent) {
    auto x1 = arguments[0].asNumber();
    auto y1 = arguments[1].asNumber();
    auto x2 = arguments[2].asNumber();
    auto y2 = arguments[3].asNumber();
    auto r = arguments[4].asNumber();
    getObject()->arcTo(x1, y1, x2, y2, r);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(computeTightBounds) {
    auto result = getObject()->computeTightBounds();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkRect>(getContext(), std::move(result)));
  }

  // TODO-API: Should this be a property?
  JSI_HOST_FUNCTION(getBounds) {
    auto result = getObject()->getBounds();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkRect>(getContext(), std::move(result)));
  }

  JSI_HOST_FUNCTION(conicTo) {
    auto x1 = arguments[0].asNumber();
    auto y1 = arguments[1].asNumber();
    auto x2 = arguments[2].asNumber();
    auto y2 = arguments[3].asNumber();
    auto w = arguments[4].asNumber();
    getObject()->conicTo(x1, y1, x2, y2, w);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(rConicTo) {
    auto x1 = arguments[0].asNumber();
    auto y1 = arguments[1].asNumber();
    auto x2 = arguments[2].asNumber();
    auto y2 = arguments[3].asNumber();
    auto w = arguments[4].asNumber();
    getObject()->rConicTo(x1, y1, x2, y2, w);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(contains) {
    auto x = arguments[0].asNumber();
    auto y = arguments[1].asNumber();
    return jsi::Value(getObject()->contains(x, y));
  }

  JSI_HOST_FUNCTION(dash) {
    SkScalar on = arguments[0].asNumber();
    SkScalar off = arguments[1].asNumber();
    auto phase = arguments[2].asNumber();
    SkScalar intervals[] = {on, off};
    auto pe = SkDashPathEffect::Make(intervals, 2, phase);
    if (!pe) {
      // TODO: SkDebugf("Invalid args to dash()\n");
      return jsi::Value(false);
    }
    SkStrokeRec rec(SkStrokeRec::InitStyle::kHairline_InitStyle);
    SkPath &path = *getObject();
    // TODO: why we don't need to swap here? In trim() which is the same
    // API, we need to swap
    if (pe->filterPath(&path, path, &rec, nullptr)) {
      return jsi::Value(true);
    }
    SkDebugf("Could not make dashed path\n");
    return jsi::Value(false);
  }

  JSI_HOST_FUNCTION(equals) {
    auto p1 = JsiSkPath::fromValue(runtime, arguments[0]).get();
    auto p2 = JsiSkPath::fromValue(runtime, arguments[1]).get();
    return jsi::Value(p1 == p2);
  }

  // TODO-API: Property?
  JSI_HOST_FUNCTION(getFillType) {
    auto fillType = getObject()->getFillType();
    return jsi::Value(static_cast<int>(fillType));
  }

  // TODO-API: Property?
  JSI_HOST_FUNCTION(setFillType) {
    auto ft = (SkPathFillType)arguments[0].asNumber();
    getObject()->setFillType(ft);
    return jsi::Value::undefined();
  }

  // TODO-API: Property?
  JSI_HOST_FUNCTION(setIsVolatile) {
    auto v = arguments[0].getBool();
    getObject()->setIsVolatile(v);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(isVolatile) {
    return jsi::Value(getObject()->isVolatile());
  }

  JSI_HOST_FUNCTION(transform) {
    auto m3 = *JsiSkMatrix::fromValue(runtime, arguments[0]);
    getObject()->transform(m3);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(stroke) {
    auto path = *getObject();
    auto opts = arguments[0].asObject(runtime);
    SkPaint p;
    p.setStyle(SkPaint::kStroke_Style);

    auto jsiCap = opts.getProperty(runtime, "cap");
    if (!jsiCap.isUndefined()) {
      auto cap = (SkPaint::Cap)jsiCap.asNumber();
      p.setStrokeCap(cap);
    }

    auto jsiJoin = opts.getProperty(runtime, "join");
    if (!jsiJoin.isUndefined()) {
      auto join = (SkPaint::Join)jsiJoin.asNumber();
      p.setStrokeJoin(join);
    }

    auto jsiWidth = opts.getProperty(runtime, "width");
    if (!jsiWidth.isUndefined()) {
      auto width = jsiWidth.asNumber();
      p.setStrokeWidth(width);
    }

    auto jsiMiterLimit = opts.getProperty(runtime, "miter_limit");
    if (!jsiMiterLimit.isUndefined()) {
      auto miter_limit = opts.getProperty(runtime, "miter_limit").asNumber();
      p.setStrokeMiter(miter_limit);
    }

    auto jsiPrecision = opts.getProperty(runtime, "precision");
    auto precision = jsiPrecision.isUndefined() ? 1 : jsiPrecision.asNumber();
    auto result =
        skpathutils::FillPathWithPaint(path, p, &path, nullptr, precision);
    if (result) {
      getObject()->swap(path);
    }
    return result ? thisValue.getObject(runtime) : jsi::Value::null();
  }

  JSI_HOST_FUNCTION(trim) {
    auto start = arguments[0].asNumber();
    auto end = arguments[1].asNumber();
    auto isComplement = arguments[2].getBool();
    auto path = *getObject();
    auto mode = isComplement ? SkTrimPathEffect::Mode::kInverted
                             : SkTrimPathEffect::Mode::kNormal;
    auto pe = SkTrimPathEffect::Make(start, end, mode);
    if (!pe) {
      // SkDebugf("Invalid args to trim(): startT and stopT must be in
      // [0,1]\n");
      return jsi::Value::null();
    }
    SkStrokeRec rec(SkStrokeRec::InitStyle::kHairline_InitStyle);
    if (pe->filterPath(&path, path, &rec, nullptr)) {
      getObject()->swap(path);
      return thisValue.getObject(runtime);
    }
    SkDebugf("Could not trim path\n");
    return jsi::Value::null();
  }

  JSI_HOST_FUNCTION(getPoint) {
    auto index = arguments[0].asNumber();
    auto point = getObject()->getPoint(index);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPoint>(getContext(), point));
  }

  JSI_HOST_FUNCTION(toSVGString) {
    SkPath path = *getObject();
    auto s = SkParsePath::ToSVGString(path);
    return jsi::String::createFromUtf8(runtime, s.c_str());
  }

  JSI_HOST_FUNCTION(makeAsWinding) {
    SkPath out;
    if (AsWinding(*getObject(), &out)) {
      getObject()->swap(out);
      return thisValue.getObject(runtime);
    }
    return jsi::Value::null();
  }

  JSI_HOST_FUNCTION(isEmpty) { return jsi::Value(getObject()->isEmpty()); }

  JSI_HOST_FUNCTION(offset) {
    SkScalar dx = arguments[0].asNumber();
    SkScalar dy = arguments[1].asNumber();
    getObject()->offset(dx, dy);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(moveTo) {
    SkScalar x = arguments[0].asNumber();
    SkScalar y = arguments[1].asNumber();
    getObject()->moveTo(x, y);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(rMoveTo) {
    SkScalar x = arguments[0].asNumber();
    SkScalar y = arguments[1].asNumber();
    getObject()->rMoveTo(x, y);
    return thisValue.getObject(runtime);
  }
  JSI_HOST_FUNCTION(lineTo) {
    SkScalar x = arguments[0].asNumber();
    SkScalar y = arguments[1].asNumber();
    getObject()->lineTo(x, y);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(rLineTo) {
    SkScalar x = arguments[0].asNumber();
    SkScalar y = arguments[1].asNumber();
    getObject()->rLineTo(x, y);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(cubicTo) {
    auto x1 = arguments[0].asNumber();
    auto y1 = arguments[1].asNumber();
    auto x2 = arguments[2].asNumber();
    auto y2 = arguments[3].asNumber();
    auto x3 = arguments[4].asNumber();
    auto y3 = arguments[5].asNumber();
    getObject()->cubicTo(x1, y1, x2, y2, x3, y3);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(rCubicTo) {
    auto x1 = arguments[0].asNumber();
    auto y1 = arguments[1].asNumber();
    auto x2 = arguments[2].asNumber();
    auto y2 = arguments[3].asNumber();
    auto x3 = arguments[4].asNumber();
    auto y3 = arguments[5].asNumber();
    getObject()->rCubicTo(x1, y1, x2, y2, x3, y3);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(reset) {
    getObject()->reset();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(rewind) {
    getObject()->rewind();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(quadTo) {
    auto x1 = arguments[0].asNumber();
    auto y1 = arguments[1].asNumber();
    auto x2 = arguments[2].asNumber();
    auto y2 = arguments[3].asNumber();
    getObject()->quadTo(x1, y1, x2, y2);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(rQuadTo) {
    auto x1 = arguments[0].asNumber();
    auto y1 = arguments[1].asNumber();
    auto x2 = arguments[2].asNumber();
    auto y2 = arguments[3].asNumber();
    getObject()->rQuadTo(x1, y1, x2, y2);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(addCircle) {
    auto x = arguments[0].asNumber();
    auto y = arguments[1].asNumber();
    auto r = arguments[2].asNumber();
    getObject()->addCircle(x, y, r);
    return thisValue.getObject(runtime);
  }

  JSI_HOST_FUNCTION(getLastPt) {
    SkPoint last;
    getObject()->getLastPt(&last);
    auto point = jsi::Object(runtime);
    point.setProperty(runtime, "x", static_cast<double>(last.fX));
    point.setProperty(runtime, "y", static_cast<double>(last.fY));
    return point;
  }

  JSI_HOST_FUNCTION(close) {
    getObject()->close();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(simplify) {
    SkPath result;
    if (Simplify(*getObject(), &result)) {
      getObject()->swap(result);
      return jsi::Value(true);
    }
    return jsi::Value(false);
  }

  JSI_HOST_FUNCTION(countPoints) {
    auto points = getObject()->countPoints();
    return jsi::Value(points);
  }

  JSI_HOST_FUNCTION(copy) {
    const auto *path = getObject().get();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(getContext(), SkPath(*path)));
  }

  JSI_HOST_FUNCTION(op) {
    auto path2 = JsiSkPath::fromValue(runtime, arguments[0]);
    int pathOp = arguments[1].asNumber();
    SkPath result;
    if (Op(*getObject(), *path2, SkPathOp(pathOp), &result)) {
      getObject()->swap(result);
      return jsi::Value(true);
    }
    return jsi::Value(false);
  }

  JSI_HOST_FUNCTION(isInterpolatable) {
    auto path2 = JsiSkPath::fromValue(runtime, arguments[0]);
    return getObject()->isInterpolatable(*path2);
  }

  JSI_HOST_FUNCTION(interpolate) {
    auto path2 = JsiSkPath::fromValue(runtime, arguments[0]);
    auto weight = arguments[1].asNumber();
    SkPath result;
    auto succeed = getObject()->interpolate(*path2, weight, &result);
    if (!succeed) {
      return nullptr;
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(getContext(), std::move(result)));
  }

  JSI_HOST_FUNCTION(toCmds) {
    auto path = *getObject();
    auto cmds = jsi::Array(runtime, path.countVerbs());
    auto it = SkPath::Iter(path, false);
    //                       { "Move", "Line", "Quad", "Conic", "Cubic",
    //                       "Close", "Done" };
    const int pointCount[] = {1, 1, 2, 2, 3, 0, 0};
    const int cmdCount[] = {3, 3, 5, 6, 7, 1, 0};
    SkPoint points[4];
    SkPath::Verb verb;
    auto k = 0;
    while (SkPath::kDone_Verb != (verb = it.next(points))) {
      auto verbVal = static_cast<int>(verb);
      auto cmd = jsi::Array(runtime, cmdCount[verbVal]);
      auto j = 0;
      cmd.setValueAtIndex(runtime, j++, jsi::Value(verbVal));
      for (int i = 0; i < pointCount[verbVal]; ++i) {
        cmd.setValueAtIndex(runtime, j++,
                            jsi::Value(static_cast<double>(points[1 + i].fX)));
        cmd.setValueAtIndex(runtime, j++,
                            jsi::Value(static_cast<double>(points[1 + i].fY)));
      }
      if (SkPath::kConic_Verb == verb) {
        cmd.setValueAtIndex(runtime, j,
                            jsi::Value(static_cast<double>(it.conicWeight())));
      }
      cmds.setValueAtIndex(runtime, k++, cmd);
    }
    return cmds;
  }

  EXPORT_JSI_API_TYPENAME(JsiSkPath, "Path")

  JSI_EXPORT_FUNCTIONS(
      JSI_EXPORT_FUNC(JsiSkPath, addPath), JSI_EXPORT_FUNC(JsiSkPath, addArc),
      JSI_EXPORT_FUNC(JsiSkPath, addOval), JSI_EXPORT_FUNC(JsiSkPath, addPoly),
      JSI_EXPORT_FUNC(JsiSkPath, addRect), JSI_EXPORT_FUNC(JsiSkPath, addRRect),
      JSI_EXPORT_FUNC(JsiSkPath, arcToOval),
      JSI_EXPORT_FUNC(JsiSkPath, arcToRotated),
      JSI_EXPORT_FUNC(JsiSkPath, rArcTo),
      JSI_EXPORT_FUNC(JsiSkPath, arcToTangent),
      JSI_EXPORT_FUNC(JsiSkPath, computeTightBounds),
      JSI_EXPORT_FUNC(JsiSkPath, getBounds),
      JSI_EXPORT_FUNC(JsiSkPath, conicTo), JSI_EXPORT_FUNC(JsiSkPath, rConicTo),
      JSI_EXPORT_FUNC(JsiSkPath, contains), JSI_EXPORT_FUNC(JsiSkPath, dash),
      JSI_EXPORT_FUNC(JsiSkPath, equals),
      JSI_EXPORT_FUNC(JsiSkPath, getFillType),
      JSI_EXPORT_FUNC(JsiSkPath, setFillType),
      JSI_EXPORT_FUNC(JsiSkPath, setIsVolatile),
      JSI_EXPORT_FUNC(JsiSkPath, isVolatile),
      JSI_EXPORT_FUNC(JsiSkPath, transform), JSI_EXPORT_FUNC(JsiSkPath, stroke),
      JSI_EXPORT_FUNC(JsiSkPath, trim), JSI_EXPORT_FUNC(JsiSkPath, getPoint),
      JSI_EXPORT_FUNC(JsiSkPath, toSVGString),
      JSI_EXPORT_FUNC(JsiSkPath, makeAsWinding),
      JSI_EXPORT_FUNC(JsiSkPath, isEmpty), JSI_EXPORT_FUNC(JsiSkPath, offset),
      JSI_EXPORT_FUNC(JsiSkPath, moveTo), JSI_EXPORT_FUNC(JsiSkPath, rMoveTo),
      JSI_EXPORT_FUNC(JsiSkPath, lineTo), JSI_EXPORT_FUNC(JsiSkPath, rLineTo),
      JSI_EXPORT_FUNC(JsiSkPath, cubicTo), JSI_EXPORT_FUNC(JsiSkPath, rCubicTo),
      JSI_EXPORT_FUNC(JsiSkPath, reset), JSI_EXPORT_FUNC(JsiSkPath, rewind),
      JSI_EXPORT_FUNC(JsiSkPath, quadTo), JSI_EXPORT_FUNC(JsiSkPath, rQuadTo),
      JSI_EXPORT_FUNC(JsiSkPath, addCircle),
      JSI_EXPORT_FUNC(JsiSkPath, getLastPt), JSI_EXPORT_FUNC(JsiSkPath, close),
      JSI_EXPORT_FUNC(JsiSkPath, simplify),
      JSI_EXPORT_FUNC(JsiSkPath, countPoints), JSI_EXPORT_FUNC(JsiSkPath, copy),
      JSI_EXPORT_FUNC(JsiSkPath, op),
      JSI_EXPORT_FUNC(JsiSkPath, isInterpolatable),
      JSI_EXPORT_FUNC(JsiSkPath, interpolate),
      JSI_EXPORT_FUNC(JsiSkPath, toCmds), JSI_EXPORT_FUNC(JsiSkPath, dispose))

  JsiSkPath(std::shared_ptr<RNSkPlatformContext> context, SkPath path)
      : JsiSkWrappingSharedPtrHostObject<SkPath>(
            std::move(context), std::make_shared<SkPath>(std::move(path))) {}

  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            const SkPath &path) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(std::move(context), path));
  }

  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            SkPath &&path) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkPath>(std::move(context), std::move(path)));
  }
};

} // namespace RNSkia
