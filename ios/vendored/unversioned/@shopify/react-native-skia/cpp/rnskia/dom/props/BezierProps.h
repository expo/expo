#pragma once

#include "DerivedNodeProp.h"

#include "JsiSkPicture.h"

#include <memory>
#include <utility>
#include <vector>

namespace RNSkia {

class BezierProp : public DerivedProp<std::vector<SkPoint>> {
public:
  explicit BezierProp(PropId name,
                      const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<std::vector<SkPoint>>(onChange) {
    _bezierProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_bezierProp->value().getType() == PropType::Array) {
      // Patch requires a path with the following constraints:
      // M tl
      // C c1 c2 br
      // C c1 c2 bl
      // C c1 c2 tl (the redundant point in the last command is removed)
      auto arr = _bezierProp->value().getAsArray();
      std::vector<SkPoint> points;
      points.reserve(12);

      points.push_back(
          PointProp::processValue(arr[0].getValue(JsiPropId::get("pos"))));
      points.push_back(
          PointProp::processValue(arr[0].getValue(JsiPropId::get("c2"))));
      points.push_back(
          PointProp::processValue(arr[1].getValue(JsiPropId::get("c1"))));
      points.push_back(
          PointProp::processValue(arr[1].getValue(JsiPropId::get("pos"))));
      points.push_back(
          PointProp::processValue(arr[1].getValue(JsiPropId::get("c2"))));
      points.push_back(
          PointProp::processValue(arr[2].getValue(JsiPropId::get("c1"))));
      points.push_back(
          PointProp::processValue(arr[2].getValue(JsiPropId::get("pos"))));
      points.push_back(
          PointProp::processValue(arr[2].getValue(JsiPropId::get("c2"))));
      points.push_back(
          PointProp::processValue(arr[3].getValue(JsiPropId::get("c1"))));
      points.push_back(
          PointProp::processValue(arr[3].getValue(JsiPropId::get("pos"))));
      points.push_back(
          PointProp::processValue(arr[3].getValue(JsiPropId::get("c2"))));
      points.push_back(
          PointProp::processValue(arr[0].getValue(JsiPropId::get("c1"))));

      setDerivedValue(std::move(points));
    }
  }

private:
  NodeProp *_bezierProp;
};

} // namespace RNSkia
