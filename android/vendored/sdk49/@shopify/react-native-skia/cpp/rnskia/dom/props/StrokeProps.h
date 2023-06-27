#pragma once

#include "DerivedNodeProp.h"

#include <memory>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPaint.h"

#pragma clang diagnostic pop

namespace RNSkia {

class StrokeCapProp : public DerivedProp<SkPaint::Cap> {
public:
  explicit StrokeCapProp(PropId name,
                         const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkPaint::Cap>(onChange) {
    _strokeCap = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_strokeCap->isSet() && (_strokeCap->isChanged())) {
      auto capValue = _strokeCap->value().getAsString();
      setDerivedValue(getCapFromString(capValue));
    }
  }

  static SkPaint::Cap getCapFromString(const std::string &value) {
    if (value == "round") {
      return SkPaint::Cap::kRound_Cap;
    } else if (value == "butt") {
      return SkPaint::Cap::kButt_Cap;
    } else if (value == "square") {
      return SkPaint::Cap::kSquare_Cap;
    }
    throw std::runtime_error("Property value \"" + value +
                             "\" is not a legal stroke cap.");
  }

private:
  NodeProp *_strokeCap;
};

class StrokeJoinProp : public DerivedProp<SkPaint::Join> {
public:
  explicit StrokeJoinProp(PropId name,
                          const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkPaint::Join>(onChange) {
    _strokeJoin = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_strokeJoin->isSet() && (_strokeJoin->isChanged())) {
      auto joinValue = _strokeJoin->value().getAsString();
      setDerivedValue(getJoinFromString(joinValue));
    }
  }

  static SkPaint::Join getJoinFromString(const std::string &value) {
    if (value == "miter") {
      return SkPaint::Join::kMiter_Join;
    } else if (value == "round") {
      return SkPaint::Join::kRound_Join;
    } else if (value == "bevel") {
      return SkPaint::Join::kBevel_Join;
    }
    throw std::runtime_error("Property value \"" + value +
                             "\" is not a legal stroke join.");
  }

private:
  NodeProp *_strokeJoin;
};

} // namespace RNSkia
