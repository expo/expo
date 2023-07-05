#pragma once

#include "NodeProp.h"
#include "PointProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkRect.h"

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
  explicit RectProp(PropId name,
                    const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp(onChange) {
    _prop = defineProperty<NodeProp>(name);
  }

  static std::shared_ptr<SkRect> processRect(const JsiValue &value) {
    if (value.getType() == PropType::HostObject) {
      auto rectPtr =
          std::dynamic_pointer_cast<JsiSkRect>(value.getAsHostObject());
      if (rectPtr != nullptr) {
        return std::make_shared<SkRect>(SkRect::MakeXYWH(
            rectPtr->getObject()->x(), rectPtr->getObject()->y(),
            rectPtr->getObject()->width(), rectPtr->getObject()->height()));
      }
    } else if (value.getType() == PropType::Object &&
               value.hasValue(PropNameX) && value.hasValue(PropNameY) &&
               value.hasValue(PropNameWidth) &&
               value.hasValue(PropNameHeight)) {
      // Save props for fast access
      auto x = value.getValue(PropNameX);
      auto y = value.getValue(PropNameY);
      auto width = value.getValue(PropNameWidth);
      auto height = value.getValue(PropNameHeight);
      // Update cache from js object value
      return std::make_shared<SkRect>(
          SkRect::MakeXYWH(x.getAsNumber(), y.getAsNumber(),
                           width.getAsNumber(), height.getAsNumber()));
    }
    return nullptr;
  }

  void updateDerivedValue() override {
    if (_prop->isSet()) {
      setDerivedValue(RectProp::processRect(_prop->value()));
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
  explicit RectPropFromProps(
      const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkRect>(onChange) {
    _x = defineProperty<NodeProp>(PropNameX);
    _y = defineProperty<NodeProp>(PropNameY);
    _width = defineProperty<NodeProp>(PropNameWidth);
    _height = defineProperty<NodeProp>(PropNameHeight);
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
  explicit RectProps(PropId name,
                     const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkRect>(onChange) {
    _rectProp = defineProperty<RectProp>(name);
    _rectPropFromProps = defineProperty<RectPropFromProps>();
  }

  void updateDerivedValue() override {
    if (_rectProp->isSet()) {
      setDerivedValue(_rectProp->getUnsafeDerivedValue());
    } else if (_rectPropFromProps->isSet()) {
      setDerivedValue(_rectPropFromProps->getUnsafeDerivedValue());
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  RectProp *_rectProp;
  RectPropFromProps *_rectPropFromProps;
};
} // namespace RNSkia
