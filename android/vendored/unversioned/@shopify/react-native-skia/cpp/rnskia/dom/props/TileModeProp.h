#pragma once

#include "DerivedNodeProp.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkTileMode.h"

#include <memory>
#include <string>

#pragma clang diagnostic pop

namespace RNSkia {

class TileModeProp : public DerivedProp<SkTileMode> {
public:
  explicit TileModeProp(PropId name,
                        const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkTileMode>(onChange) {
    _tileModeProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_tileModeProp->isSet()) {
      setDerivedValue(
          getTileModeFromStringValue(_tileModeProp->value().getAsString()));
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  SkTileMode getTileModeFromStringValue(const std::string &value) {
    if (value == "clamp") {
      return SkTileMode::kClamp;
    } else if (value == "repeat") {
      return SkTileMode::kRepeat;
    } else if (value == "mirror") {
      return SkTileMode::kMirror;
    } else if (value == "decal") {
      return SkTileMode::kDecal;
    }
    throw std::runtime_error("Value \"" + value +
                             "\" is not a valid tile mode.");
  }

  NodeProp *_tileModeProp;
};

} // namespace RNSkia
