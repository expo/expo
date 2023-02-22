#pragma once

#include "NodeProp.h"
#include "PointProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkRect.h>

#pragma clang diagnostic pop

namespace RNSkia {

static PropId PropNameRect = JsiPropId::get("rect");
static PropId PropNameWidth = JsiPropId::get("width");
static PropId PropNameHeight = JsiPropId::get("height");

/**
 Reads a rect from a given propety in the node. The name of the property is
 provided on the constructor. The property can either be a Javascript property
 or a host object representing an SkRect.
 */
class RectProp : public DerivedProp<SkRect> {
public:
  explicit RectProp(PropId name) : DerivedProp() {
    _prop = addProperty(std::make_shared<NodeProp>(name));
  }

  void updateDerivedValue() override {
    if (_prop->isSet()) {
      // Check for JsiSkRect
      if (_prop->value().getType() == PropType::HostObject) {
        auto rectPtr = std::dynamic_pointer_cast<JsiSkRect>(
            _prop->value().getAsHostObject());
        if (rectPtr != nullptr) {
          setDerivedValue(SkRect::MakeXYWH(
              rectPtr->getObject()->x(), rectPtr->getObject()->y(),
              rectPtr->getObject()->width(), rectPtr->getObject()->height()));
        }
      } else {
        auto p = _prop->value();
        if (p.hasValue(PropNameX) && p.hasValue(PropNameY) &&
            p.hasValue(PropNameWidth) && p.hasValue(PropNameHeight)) {
          // Save props for fast access
          auto x = p.getValue(PropNameX);
          auto y = p.getValue(PropNameY);
          auto width = p.getValue(PropNameWidth);
          auto height = p.getValue(PropNameHeight);

          // Update cache from js object value
          setDerivedValue(SkRect::MakeXYWH(x.getAsNumber(), y.getAsNumber(),
                                           width.getAsNumber(),
                                           height.getAsNumber()));
        }
      }
    }
  }

private:
  NodeProp *_prop;
};

/**
 Reads rect properties from a node's properties
 */
class RectPropFromProps : public DerivedProp<SkRect> {
public:
  RectPropFromProps() : DerivedProp<SkRect>() {
    _x = addProperty(std::make_shared<NodeProp>(PropNameX));
    _y = addProperty(std::make_shared<NodeProp>(PropNameY));
    _width = addProperty(std::make_shared<NodeProp>(PropNameWidth));
    _height = addProperty(std::make_shared<NodeProp>(PropNameHeight));
  }

  void updateDerivedValue() override {
    if (_width->isSet() && _height->isSet()) {
      auto x = 0.0;
      auto y = 0.0;
      if (_x->isSet()) {
        x = _x->value().getAsNumber();
      }
      if (_y->isSet()) {
        y = _y->value().getAsNumber();
      }
      setDerivedValue(SkRect::MakeXYWH(x, y, _width->value().getAsNumber(),
                                       _height->value().getAsNumber()));
    }
  }

private:
  NodeProp *_x;
  NodeProp *_y;
  NodeProp *_width;
  NodeProp *_height;
};

/**
 Reads rect props from either a given property or from the property object
 itself.
 */
class RectProps : public DerivedProp<SkRect> {
public:
  explicit RectProps(PropId name) : DerivedProp<SkRect>() {
    _rectProp = addProperty(std::make_shared<RectProp>(name));
    _rectPropFromProps = addProperty(std::make_shared<RectPropFromProps>());
  }

  void updateDerivedValue() override {
    if (_rectProp->isSet()) {
      setDerivedValue(_rectProp->getDerivedValue());
    } else if (_rectPropFromProps->isSet()) {
      setDerivedValue(_rectPropFromProps->getDerivedValue());
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  RectProp *_rectProp;
  RectPropFromProps *_rectPropFromProps;
};
} // namespace RNSkia
