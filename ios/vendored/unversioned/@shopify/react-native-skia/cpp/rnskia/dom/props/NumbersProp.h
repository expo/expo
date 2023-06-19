#pragma once

#include "DerivedNodeProp.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace RNSkia {

class NumbersProp : public DerivedProp<std::vector<SkScalar>> {
public:
  explicit NumbersProp(PropId name,
                       const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<std::vector<SkScalar>>(onChange) {
    _positionProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_positionProp->isSet()) {
      auto positions = _positionProp->value().getAsArray();
      std::vector<SkScalar> derivedPositions;
      derivedPositions.reserve(positions.size());

      for (size_t i = 0; i < positions.size(); ++i) {
        derivedPositions.push_back(positions[i].getAsNumber());
      }
      setDerivedValue(std::move(derivedPositions));
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_positionProp;
};

class Numbers16Prop : public DerivedProp<std::vector<u_int16_t>> {
public:
  explicit Numbers16Prop(PropId name,
                         const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<std::vector<u_int16_t>>(onChange) {
    _prop = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_prop->isSet()) {
      auto positions = _prop->value().getAsArray();
      std::vector<u_int16_t> derivedPositions;
      derivedPositions.reserve(positions.size());

      for (size_t i = 0; i < positions.size(); ++i) {
        derivedPositions.push_back(
            static_cast<u_int16_t>(positions[i].getAsNumber()));
      }
      setDerivedValue(std::move(derivedPositions));
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_prop;
};

} // namespace RNSkia
