#pragma once

#include <memory>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiSkColorFilter.h"
#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkColorFilter.h"
#include "SkImageFilters.h"
#include "SkPerlinNoiseShader.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

int getFlag(const jsi::Value *values, int i, size_t size) {
  if (i >= size || values[i].isUndefined()) {
    return 0;
  }
  return values[i].asNumber();
}

SkMatrix *getLocalMatrix(jsi::Runtime &runtime, const jsi::Value *values, int i,
                         size_t size) {
  if (i >= size || values[i].isUndefined()) {
    return nullptr;
  }
  return JsiSkMatrix::fromValue(runtime, values[i]).get();
}

SkTileMode getTileMode(const jsi::Value *values, int i, size_t size) {
  if (i >= size || values[i].isUndefined()) {
    return SkTileMode::kClamp;
  }
  return static_cast<SkTileMode>(values[i].asNumber());
}

std::vector<SkColor> getColors(jsi::Runtime &runtime, const jsi::Value &value) {
  std::vector<SkColor> colors;
  if (!value.isNull()) {
    auto jsiColors = value.asObject(runtime).asArray(runtime);
    auto size = jsiColors.size(runtime);
    colors.reserve(size);
    for (int i = 0; i < size; i++) {
      SkColor color =
          JsiSkColor::fromValue(runtime, jsiColors.getValueAtIndex(runtime, i));
      colors.push_back(color);
    }
  }
  return colors;
}

std::vector<SkScalar> getPositions(jsi::Runtime &runtime,
                                   const jsi::Value &value) {
  std::vector<SkScalar> positions;
  if (!value.isNull()) {
    auto jsiPositions = value.asObject(runtime).asArray(runtime);
    auto size = jsiPositions.size(runtime);
    positions.reserve(size);
    for (int i = 0; i < size; i++) {
      SkScalar position = jsiPositions.getValueAtIndex(runtime, i).asNumber();
      positions.push_back(position);
    }
  }
  return positions;
}

class JsiSkShaderFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeLinearGradient) {
    auto p1 =
        *JsiSkPoint::fromValue(runtime, arguments[0].asObject(runtime)).get();
    auto p2 =
        *JsiSkPoint::fromValue(runtime, arguments[1].asObject(runtime)).get();
    SkPoint pts[] = {p1, p2};

    std::vector<SkColor> colors = getColors(runtime, arguments[2]);
    std::vector<SkScalar> positions = getPositions(runtime, arguments[3]);
    auto tileMode = getTileMode(arguments, 4, count);
    auto flag = getFlag(arguments, 6, count);
    auto localMatrix = getLocalMatrix(runtime, arguments, 5, count);

    sk_sp<SkShader> gradient = SkGradientShader::MakeLinear(
        pts, colors.data(), positions.data(), static_cast<int>(colors.size()),
        tileMode, flag, localMatrix);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_HOST_FUNCTION(MakeRadialGradient) {
    auto center =
        *JsiSkPoint::fromValue(runtime, arguments[0].asObject(runtime)).get();
    auto r = arguments[1].asNumber();

    std::vector<SkColor> colors = getColors(runtime, arguments[2]);
    std::vector<SkScalar> positions = getPositions(runtime, arguments[3]);
    auto tileMode = getTileMode(arguments, 4, count);
    auto flag = getFlag(arguments, 6, count);
    auto localMatrix = getLocalMatrix(runtime, arguments, 5, count);

    sk_sp<SkShader> gradient = SkGradientShader::MakeRadial(
        center, r, colors.data(), positions.data(),
        static_cast<int>(colors.size()), tileMode, flag, localMatrix);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_HOST_FUNCTION(MakeSweepGradient) {
    auto x = arguments[0].asNumber();
    auto y = arguments[1].asNumber();
    std::vector<SkColor> colors = getColors(runtime, arguments[2]);
    std::vector<SkScalar> positions = getPositions(runtime, arguments[3]);
    auto tileMode = getTileMode(arguments, 4, count);
    auto localMatrix = getLocalMatrix(runtime, arguments, 5, count);
    auto flag = getFlag(arguments, 6, count);
    auto startAngle =
        (count < 8 || arguments[7].isUndefined()) ? 0 : arguments[7].asNumber();
    auto endAngle = (count < 9 || arguments[8].isUndefined())
                        ? 360
                        : arguments[8].asNumber();
    sk_sp<SkShader> gradient = SkGradientShader::MakeSweep(
        x, y, colors.data(), positions.data(), static_cast<int>(colors.size()),
        tileMode, startAngle, endAngle, flag, localMatrix);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_HOST_FUNCTION(MakeTwoPointConicalGradient) {
    auto start =
        *JsiSkPoint::fromValue(runtime, arguments[0].asObject(runtime)).get();
    auto startRadius = arguments[1].asNumber();

    auto end =
        *JsiSkPoint::fromValue(runtime, arguments[2].asObject(runtime)).get();
    auto endRadius = arguments[3].asNumber();

    std::vector<SkColor> colors = getColors(runtime, arguments[4]);
    std::vector<SkScalar> positions = getPositions(runtime, arguments[5]);
    auto tileMode = getTileMode(arguments, 6, count);
    auto localMatrix = getLocalMatrix(runtime, arguments, 7, count);
    auto flag = getFlag(arguments, 8, count);

    sk_sp<SkShader> gradient = SkGradientShader::MakeTwoPointConical(
        start, startRadius, end, endRadius, colors.data(), positions.data(),
        static_cast<int>(colors.size()), tileMode, flag, localMatrix);

    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_HOST_FUNCTION(MakeTurbulence) {
    auto baseFreqX = arguments[0].asNumber();
    auto baseFreqY = arguments[1].asNumber();
    auto octaves = arguments[2].asNumber();
    auto seed = arguments[3].asNumber();
    auto tileW = arguments[4].asNumber();
    auto tileH = arguments[5].asNumber();
    SkISize size = SkISize::Make(tileW, tileH);
    sk_sp<SkShader> gradient = SkPerlinNoiseShader::MakeTurbulence(
        baseFreqX, baseFreqY, octaves, seed, &size);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_HOST_FUNCTION(MakeFractalNoise) {
    auto baseFreqX = arguments[0].asNumber();
    auto baseFreqY = arguments[1].asNumber();
    auto octaves = arguments[2].asNumber();
    auto seed = arguments[3].asNumber();
    auto tileW = arguments[4].asNumber();
    auto tileH = arguments[5].asNumber();
    SkISize size = SkISize::Make(tileW, tileH);
    sk_sp<SkShader> gradient = SkPerlinNoiseShader::MakeFractalNoise(
        baseFreqX, baseFreqY, octaves, seed, &size);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_HOST_FUNCTION(MakeBlend) {
    auto blendMode = (SkBlendMode)arguments[0].asNumber();
    auto one = JsiSkShader::fromValue(runtime, arguments[1]);
    auto two = JsiSkShader::fromValue(runtime, arguments[2]);
    sk_sp<SkShader> gradient = SkShaders::Blend(blendMode, one, two);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_HOST_FUNCTION(MakeColor) {
    auto color = JsiSkColor::fromValue(runtime, arguments[0]);
    sk_sp<SkShader> gradient = SkShaders::Color(color);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(gradient)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkShaderFactory, MakeLinearGradient),
                       JSI_EXPORT_FUNC(JsiSkShaderFactory, MakeRadialGradient),
                       JSI_EXPORT_FUNC(JsiSkShaderFactory, MakeSweepGradient),
                       JSI_EXPORT_FUNC(JsiSkShaderFactory,
                                       MakeTwoPointConicalGradient),
                       JSI_EXPORT_FUNC(JsiSkShaderFactory, MakeTurbulence),
                       JSI_EXPORT_FUNC(JsiSkShaderFactory, MakeFractalNoise),
                       JSI_EXPORT_FUNC(JsiSkShaderFactory, MakeBlend),
                       JSI_EXPORT_FUNC(JsiSkShaderFactory, MakeColor))

  explicit JsiSkShaderFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
