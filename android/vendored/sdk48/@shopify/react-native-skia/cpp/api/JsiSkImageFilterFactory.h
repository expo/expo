#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "JsiSkImageFilter.h"
#include "JsiSkRuntimeShaderBuilder.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkImageFilter.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkImageFilterFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeBlur) {
    float sigmaX = arguments[0].asNumber();
    float sigmaY = arguments[1].asNumber();
    int tileMode = arguments[2].asNumber();
    sk_sp<SkImageFilter> imageFilter;
    if (!arguments[3].isNull()) {
      imageFilter = JsiSkImageFilter::fromValue(runtime, arguments[3]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(),
                     SkImageFilters::Blur(sigmaX, sigmaY, (SkTileMode)tileMode,
                                          imageFilter)));
  }

  JSI_HOST_FUNCTION(MakeColorFilter) {
    auto cf = JsiSkColorFilter::fromValue(runtime, arguments[0]);
    sk_sp<SkImageFilter> input;
    if (!arguments[1].isNull()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[1]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::ColorFilter(
                                       std::move(cf), std::move(input))));
  }

  JSI_HOST_FUNCTION(MakeOffset) {
    auto x = arguments[0].asNumber();
    auto y = arguments[1].asNumber();
    sk_sp<SkImageFilter> input;
    if (!arguments[2].isNull()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[2]);
    }
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkImageFilter>(
            getContext(), SkImageFilters::Offset(x, y, std::move(input))));
  }

  JSI_HOST_FUNCTION(MakeDisplacementMap) {
    auto fXChannelSelector =
        static_cast<SkColorChannel>(arguments[0].asNumber());
    auto fYChannelSelector =
        static_cast<SkColorChannel>(arguments[1].asNumber());
    auto scale = arguments[2].asNumber();
    auto in2 = JsiSkImageFilter::fromValue(runtime, arguments[3]);
    sk_sp<SkImageFilter> input;
    if (!arguments[4].isNull()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[4]);
    }
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkImageFilter>(
            getContext(), SkImageFilters::DisplacementMap(
                              fXChannelSelector, fYChannelSelector, scale,
                              std::move(in2), std::move(input))));
  }

  JSI_HOST_FUNCTION(MakeShader) {
    auto shader = JsiSkShader::fromValue(runtime, arguments[0]);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::Shader(std::move(shader))));
  }

  JSI_HOST_FUNCTION(MakeCompose) {
    sk_sp<SkImageFilter> outer;
    if (!arguments[0].isNull() && !arguments[0].isUndefined()) {
      outer = JsiSkImageFilter::fromValue(runtime, arguments[0]);
    }
    sk_sp<SkImageFilter> inner;
    if (!arguments[1].isNull() && !arguments[1].isUndefined()) {
      inner = JsiSkImageFilter::fromValue(runtime, arguments[1]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::Compose(std::move(outer),
                                                           std::move(inner))));
  }

  JSI_HOST_FUNCTION(MakeBlend) {
    auto mode = static_cast<SkBlendMode>(arguments[0].asNumber());
    sk_sp<SkImageFilter> background =
        JsiSkImageFilter::fromValue(runtime, arguments[1]);
    sk_sp<SkImageFilter> foreground = nullptr;

    if (count > 2 && !arguments[2].isNull()) {
      foreground = JsiSkImageFilter::fromValue(runtime, arguments[2]);
    }

    SkImageFilters::CropRect cropRect = {};
    if (count > 3 && !arguments[3].isUndefined()) {
      cropRect = *JsiSkRect::fromValue(runtime, arguments[3]);
    }

    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::Blend(
                                       std::move(mode), std::move(background),
                                       std::move(foreground), cropRect)));
  }

  JSI_HOST_FUNCTION(MakeDropShadow) {
    auto dx = arguments[0].asNumber();
    auto dy = arguments[1].asNumber();
    auto sigmaX = arguments[2].asNumber();
    auto sigmaY = arguments[3].asNumber();
    auto color = JsiSkColor::fromValue(runtime, arguments[4]);
    sk_sp<SkImageFilter> input;
    if (!arguments[5].isNull() && !arguments[5].isUndefined()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[5]);
    }
    SkImageFilters::CropRect cropRect = {};
    if (count > 6 && !arguments[6].isUndefined()) {
      cropRect = *JsiSkRect::fromValue(runtime, arguments[6]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(),
                     SkImageFilters::DropShadow(dx, dy, sigmaX, sigmaY, color,
                                                std::move(input), cropRect)));
  }

  JSI_HOST_FUNCTION(MakeDropShadowOnly) {
    auto dx = arguments[0].asNumber();
    auto dy = arguments[1].asNumber();
    auto sigmaX = arguments[2].asNumber();
    auto sigmaY = arguments[3].asNumber();
    auto color = JsiSkColor::fromValue(runtime, arguments[4]);
    sk_sp<SkImageFilter> input;
    if (!arguments[5].isNull() && !arguments[5].isUndefined()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[5]);
    }
    SkImageFilters::CropRect cropRect = {};
    if (count > 6 && !arguments[6].isUndefined()) {
      cropRect = *JsiSkRect::fromValue(runtime, arguments[6]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::DropShadowOnly(
                                       dx, dy, sigmaX, sigmaY, color,
                                       std::move(input), cropRect)));
  }

  JSI_HOST_FUNCTION(MakeErode) {
    auto rx = arguments[0].asNumber();
    auto ry = arguments[1].asNumber();
    sk_sp<SkImageFilter> input;
    if (!arguments[2].isNull() && !arguments[2].isUndefined()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[2]);
    }
    SkImageFilters::CropRect cropRect = {};
    if (count > 3 && !arguments[3].isUndefined()) {
      cropRect = *JsiSkRect::fromValue(runtime, arguments[3]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::Erode(
                                       rx, ry, std::move(input), cropRect)));
  }

  JSI_HOST_FUNCTION(MakeDilate) {
    auto rx = arguments[0].asNumber();
    auto ry = arguments[1].asNumber();
    sk_sp<SkImageFilter> input;
    if (!arguments[2].isNull() && !arguments[2].isUndefined()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[2]);
    }
    SkImageFilters::CropRect cropRect = {};
    if (count > 3 && !arguments[3].isUndefined()) {
      cropRect = *JsiSkRect::fromValue(runtime, arguments[3]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::Dilate(
                                       rx, ry, std::move(input), cropRect)));
  }

  JSI_HOST_FUNCTION(MakeRuntimeShader) {
    auto rtb = JsiSkRuntimeShaderBuilder::fromValue(runtime, arguments[0]);

    const char *childName = "";
    if (!arguments[1].isNull() && !arguments[1].isUndefined()) {
      childName = arguments[1].asString(runtime).utf8(runtime).c_str();
    }

    sk_sp<SkImageFilter> input;
    if (!arguments[2].isNull() && !arguments[2].isUndefined()) {
      input = JsiSkImageFilter::fromValue(runtime, arguments[2]);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImageFilter>(
                     getContext(), SkImageFilters::RuntimeShader(
                                       *rtb, childName, std::move(input))));
  }

  JSI_EXPORT_FUNCTIONS(
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeBlur),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeOffset),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeColorFilter),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeShader),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeDisplacementMap),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeCompose),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeErode),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeDilate),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeBlend),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeDropShadow),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeDropShadowOnly),
      JSI_EXPORT_FUNC(JsiSkImageFilterFactory, MakeRuntimeShader))

  explicit JsiSkImageFilterFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
