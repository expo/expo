#pragma once

#include "JsiSkColor.h"
#include "JsiSkColorFilter.h"
#include "JsiSkHostObjects.h"
#include <jsi/jsi.h>
#include <memory>
#include <utility>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkColorFilter.h"
#include "SkLumaColorFilter.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkColorFilterFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeMatrix) {
    auto jsiMatrix = arguments[0].asObject(runtime).asArray(runtime);
    float matrix[20];
    for (int i = 0; i < 20; i++) {
      if (jsiMatrix.size(runtime) > i) {
        matrix[i] = jsiMatrix.getValueAtIndex(runtime, i).asNumber();
      }
    }
    // Return the newly constructed object
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkColorFilter>(
                     getContext(), SkColorFilters::Matrix(std::move(matrix))));
  }

  JSI_HOST_FUNCTION(MakeBlend) {
    auto color = JsiSkColor::fromValue(runtime, arguments[0]);
    SkBlendMode blend = (SkBlendMode)arguments[1].asNumber();
    // Return the newly constructed object
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkColorFilter>(
                     getContext(), SkColorFilters::Blend(color, blend)));
  }

  JSI_HOST_FUNCTION(MakeCompose) {
    auto outer = JsiSkColorFilter::fromValue(runtime, arguments[0]);
    auto inner = JsiSkColorFilter::fromValue(runtime, arguments[1]);
    // Return the newly constructed object
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkColorFilter>(
                     getContext(), SkColorFilters::Compose(std::move(outer),
                                                           std::move(inner))));
  }

  JSI_HOST_FUNCTION(MakeLerp) {
    auto t = arguments[0].asNumber();
    auto dst = JsiSkColorFilter::fromValue(runtime, arguments[1]);
    auto src = JsiSkColorFilter::fromValue(runtime, arguments[2]);
    // Return the newly constructed object
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkColorFilter>(
                     getContext(),
                     SkColorFilters::Lerp(t, std::move(dst), std::move(src))));
  }

  JSI_HOST_FUNCTION(MakeSRGBToLinearGamma) {
    // Return the newly constructed object
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkColorFilter>(
                     getContext(), SkColorFilters::SRGBToLinearGamma()));
  }

  JSI_HOST_FUNCTION(MakeLinearToSRGBGamma) {
    // Return the newly constructed object
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkColorFilter>(
                     getContext(), SkColorFilters::LinearToSRGBGamma()));
  }

  JSI_HOST_FUNCTION(MakeLumaColorFilter) {
    // Return the newly constructed object
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkColorFilter>(getContext(),
                                                    SkLumaColorFilter::Make()));
  }

  JSI_EXPORT_FUNCTIONS(
      JSI_EXPORT_FUNC(JsiSkColorFilterFactory, MakeMatrix),
      JSI_EXPORT_FUNC(JsiSkColorFilterFactory, MakeBlend),
      JSI_EXPORT_FUNC(JsiSkColorFilterFactory, MakeCompose),
      JSI_EXPORT_FUNC(JsiSkColorFilterFactory, MakeLerp),
      JSI_EXPORT_FUNC(JsiSkColorFilterFactory, MakeSRGBToLinearGamma),
      JSI_EXPORT_FUNC(JsiSkColorFilterFactory, MakeLinearToSRGBGamma),
      JSI_EXPORT_FUNC(JsiSkColorFilterFactory, MakeLumaColorFilter))

  explicit JsiSkColorFilterFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};
} // namespace RNSkia
