#pragma once

#include "NodeProp.h"
#include "PointProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPoint.h>

#pragma clang diagnostic pop

namespace RNSkia {

class RadiusProp : public DerivedProp<SkPoint> {
public:
  explicit RadiusProp(PropId name) : DerivedProp<SkPoint>() {
    _radiusProp = addProperty(std::make_shared<NodeProp>(name));
  }

  void updateDerivedValue() override {
    if (_radiusProp->isSet()) {
      // Check for simple number:
      if (_radiusProp->value().getType() == PropType::Number) {
        setDerivedValue(SkPoint::Make(_radiusProp->value().getAsNumber(),
                                      _radiusProp->value().getAsNumber()));
      } else {
        setDerivedValue(PointProp::processValue(_radiusProp->value()));
      }
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_radiusProp;
};

} // namespace RNSkia
