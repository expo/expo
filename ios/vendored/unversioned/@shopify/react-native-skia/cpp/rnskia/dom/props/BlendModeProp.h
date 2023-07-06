#pragma once

#include "DerivedNodeProp.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkBlendMode.h"

#pragma clang diagnostic pop

namespace RNSkia {

class BlendModeProp : public DerivedProp<SkBlendMode> {
public:
  explicit BlendModeProp(PropId name,
                         const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkBlendMode>(onChange) {
    _blendMode = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_blendMode->isSet() && (_blendMode->isChanged())) {
      auto blendModeValue = _blendMode->value().getAsString();
      setDerivedValue(getBlendModeFromString(blendModeValue));
    }
  }

private:
  SkBlendMode getBlendModeFromString(const std::string &value) {
    if (value == "clear") {
      return SkBlendMode::kClear;
    } else if (value == "src") {
      return SkBlendMode::kSrc;
    } else if (value == "dst") {
      return SkBlendMode::kDst;
    } else if (value == "srcOver") {
      return SkBlendMode::kSrcOver;
    } else if (value == "dstOver") {
      return SkBlendMode::kDstOver;
    } else if (value == "srcIn") {
      return SkBlendMode::kSrcIn;
    } else if (value == "dstIn") {
      return SkBlendMode::kDstIn;
    } else if (value == "srcOut") {
      return SkBlendMode::kSrcOut;
    } else if (value == "dstOut") {
      return SkBlendMode::kDstOut;
    } else if (value == "srcATop") {
      return SkBlendMode::kSrcATop;
    } else if (value == "dstATop") {
      return SkBlendMode::kDstATop;
    } else if (value == "xor") {
      return SkBlendMode::kXor;
    } else if (value == "plus") {
      return SkBlendMode::kPlus;
    } else if (value == "modulate") {
      return SkBlendMode::kModulate;
    } else if (value == "screen") {
      return SkBlendMode::kScreen;
    } else if (value == "overlay") {
      return SkBlendMode::kOverlay;
    } else if (value == "darken") {
      return SkBlendMode::kDarken;
    } else if (value == "lighten") {
      return SkBlendMode::kLighten;
    } else if (value == "colorDodge") {
      return SkBlendMode::kColorDodge;
    } else if (value == "colorBurn") {
      return SkBlendMode::kColorBurn;
    } else if (value == "hardLight") {
      return SkBlendMode::kHardLight;
    } else if (value == "softLight") {
      return SkBlendMode::kSoftLight;
    } else if (value == "difference") {
      return SkBlendMode::kDifference;
    } else if (value == "exclusion") {
      return SkBlendMode::kExclusion;
    } else if (value == "multiply") {
      return SkBlendMode::kMultiply;
    } else if (value == "hue") {
      return SkBlendMode::kHue;
    } else if (value == "saturation") {
      return SkBlendMode::kSaturation;
    } else if (value == "color") {
      return SkBlendMode::kColor;
    } else if (value == "luminosity") {
      return SkBlendMode::kLuminosity;
    }

    throw std::runtime_error("Property value \"" + value +
                             "\" is not a legal blend mode.");
  }

  NodeProp *_blendMode;
};

} // namespace RNSkia
