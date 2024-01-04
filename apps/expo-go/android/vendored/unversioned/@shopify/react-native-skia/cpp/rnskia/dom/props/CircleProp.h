#pragma once

#include "NodeProp.h"
#include "PointProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPoint.h"

#pragma clang diagnostic pop

namespace RNSkia {

static PropId PropNameCx = JsiPropId::get("cx");
static PropId PropNameCy = JsiPropId::get("cy");
static PropId PropNameC = JsiPropId::get("c");

class CircleProp : public DerivedProp<SkPoint> {
public:
  explicit CircleProp(const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkPoint>(onChange) {
    _c = defineProperty<PointProp>("c");
    _cx = defineProperty<NodeProp>("cx");
    _cy = defineProperty<NodeProp>("cy");
  }

  void updateDerivedValue() override {
    // Read in this order since point with x:0/y:0 is default for
    // the c property.
    if (_cx->isSet() && _cy->isSet()) {
      setDerivedValue(SkPoint::Make(_cx->value().getAsNumber(),
                                    _cy->value().getAsNumber()));
    } else if (_c->isSet()) {
      setDerivedValue(_c->getUnsafeDerivedValue());
    } else {
      setDerivedValue(SkPoint::Make(0.0, 0.0));
    }
  }

private:
  PointProp *_c;
  NodeProp *_cx;
  NodeProp *_cy;
};

} // namespace RNSkia
