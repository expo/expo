#pragma once

#include <memory>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "JsiSkPathEffect.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkCornerPathEffect.h"
#include "SkDashPathEffect.h"
#include "SkDiscretePathEffect.h"
#include "SkPathEffect.h"
#include "include/effects/Sk1DPathEffect.h"
#include "include/effects/Sk2DPathEffect.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkPathEffectFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeCorner) {
    int radius = arguments[0].asNumber();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(), SkCornerPathEffect::Make(radius)));
  }

  JSI_HOST_FUNCTION(MakeDash) {
    auto jsiIntervals = arguments[0].asObject(runtime).asArray(runtime);
    auto size = static_cast<int>(jsiIntervals.size(runtime));
    std::vector<SkScalar> intervals;
    intervals.reserve(size);
    for (int i = 0; i < size; i++) {
      SkScalar interval = jsiIntervals.getValueAtIndex(runtime, i).asNumber();
      intervals.push_back(interval);
    }
    int phase =
        count >= 2 && !arguments[1].isUndefined() && !arguments[1].isNull()
            ? arguments[1].asNumber()
            : 0;
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(),
                     SkDashPathEffect::Make(intervals.data(), size, phase)));
  }

  JSI_HOST_FUNCTION(MakeDiscrete) {
    int segLength = arguments[0].asNumber();
    int dec = arguments[1].asNumber();
    int seedAssist = arguments[2].asNumber();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(),
                     SkDiscretePathEffect::Make(segLength, dec, seedAssist)));
  }

  JSI_HOST_FUNCTION(MakeCompose) {
    auto outer = JsiSkPathEffect::fromValue(runtime, arguments[0]);
    auto inner = JsiSkPathEffect::fromValue(runtime, arguments[1]);

    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(), SkPathEffect::MakeCompose(
                                       std::move(outer), std::move(inner))));
  }

  JSI_HOST_FUNCTION(MakeSum) {
    auto outer = JsiSkPathEffect::fromValue(runtime, arguments[0]);
    auto inner = JsiSkPathEffect::fromValue(runtime, arguments[1]);

    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(), SkPathEffect::MakeSum(std::move(outer),
                                                         std::move(inner))));
  }

  JSI_HOST_FUNCTION(MakePath1D) {
    auto path = JsiSkPath::fromValue(runtime, arguments[0]);
    auto advance = arguments[1].asNumber();
    auto phase = arguments[2].asNumber();
    auto style =
        static_cast<SkPath1DPathEffect::Style>(arguments[3].asNumber());
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(),
                     SkPath1DPathEffect::Make(*path, advance, phase, style)));
  }

  JSI_HOST_FUNCTION(MakePath2D) {
    auto matrix = JsiSkMatrix::fromValue(runtime, arguments[0]);
    auto path = JsiSkPath::fromValue(runtime, arguments[1]);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(), SkPath2DPathEffect::Make(*matrix, *path)));
  }

  JSI_HOST_FUNCTION(MakeLine2D) {
    auto width = arguments[0].asNumber();
    auto matrix = JsiSkMatrix::fromValue(runtime, arguments[1]);

    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPathEffect>(
                     getContext(), SkLine2DPathEffect::Make(width, *matrix)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakeCorner),
                       JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakeDash),
                       JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakeDiscrete),
                       JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakeCompose),
                       JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakeSum),
                       JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakeLine2D),
                       JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakePath1D),
                       JSI_EXPORT_FUNC(JsiSkPathEffectFactory, MakePath2D), )

  explicit JsiSkPathEffectFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
