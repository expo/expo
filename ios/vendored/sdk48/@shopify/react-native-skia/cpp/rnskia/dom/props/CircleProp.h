#pragma once

#include "NodeProp.h"
#include "PointProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPoint.h>

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

static PropId PropNameCx = JsiPropId::get("cx");
static PropId PropNameCy = JsiPropId::get("cy");
static PropId PropNameC = JsiPropId::get("c");

class CircleProp : public DerivedProp<SkPoint> {
public:
  CircleProp() : DerivedProp<SkPoint>() {
    _c = addProperty(std::make_shared<PointProp>(PropNameC));
    _cx = addProperty(std::make_shared<NodeProp>(PropNameCx));
    _cy = addProperty(std::make_shared<NodeProp>(PropNameCy));
  }

  void updateDerivedValue() override {
    // Read in this order since point with x:0/y:0 is default for
    // the c property.
    if (_cx->isSet() && _cy->isSet()) {
      setDerivedValue(SkPoint::Make(_cx->value().getAsNumber(),
                                    _cy->value().getAsNumber()));
    } else if (_c->isSet()) {
      setDerivedValue(_c->getDerivedValue());
    } else {
      setDerivedValue(SkPoint::Make(0.0, 0.0));
    }
  }

private:
  PointProp *_c;
  NodeProp *_cx;
  NodeProp *_cy;
};

} // namespace ABI48_0_0RNSkia
