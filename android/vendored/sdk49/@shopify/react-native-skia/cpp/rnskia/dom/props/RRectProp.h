#pragma once

#include "JsiSkRRect.h"
#include "NodeProp.h"
#include "RectProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkRRect.h"
#include "SkRect.h"

#pragma clang diagnostic pop

namespace RNSkia {

static PropId PropNameRx = JsiPropId::get("rx");
static PropId PropNameRy = JsiPropId::get("ry");
static PropId PropNameR = JsiPropId::get("r");

/**
 Reads a rect from a given propety in the node. The name of the property is
 provided on the constructor. The property can either be a Javascript property
 or a host object representing an SkRect.
 */
class RRectProp : public DerivedProp<SkRRect> {
public:
  explicit RRectProp(PropId name,
                     const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp(onChange) {
    _prop = defineProperty<NodeProp>(name);
  }

  static std::shared_ptr<SkRRect> processRRect(const JsiValue &value) {
    if (value.getType() == PropType::HostObject) {
      // Try reading as rect
      auto rectPtr =
          std::dynamic_pointer_cast<JsiSkRRect>(value.getAsHostObject());
      if (rectPtr != nullptr) {
        auto rrect = rectPtr->getObject();
        return std::make_shared<SkRRect>(
            SkRRect::MakeRectXY(rrect->rect(), rrect->getSimpleRadii().x(),
                                rrect->getSimpleRadii().y()));
      }
    } else {
      if (value.getType() == PropType::Object) {
        if (value.hasValue(PropNameRect) && value.hasValue(PropNameRx) &&
            value.hasValue(PropNameRy)) {
          auto rect = value.getValue(PropNameRect);
          if (rect.hasValue(PropNameX) && rect.hasValue(PropNameY) &&
              rect.hasValue(PropNameWidth) && rect.hasValue(PropNameHeight)) {
            auto x = rect.getValue(PropNameX);
            auto y = rect.getValue(PropNameY);
            auto width = rect.getValue(PropNameWidth);
            auto height = rect.getValue(PropNameHeight);
            auto rx = value.getValue(PropNameRx);
            auto ry = value.getValue(PropNameRy);

            // Update cache from js object value
            return std::make_shared<SkRRect>(SkRRect::MakeRectXY(
                SkRect::MakeXYWH(x.getAsNumber(), y.getAsNumber(),
                                 width.getAsNumber(), height.getAsNumber()),
                rx.getAsNumber(), ry.getAsNumber()));
          }
        }
      }
    }
    return nullptr;
  }

  void updateDerivedValue() override {
    if (_prop->isSet()) {
      auto value = _prop->value();
      setDerivedValue(RRectProp::processRRect(value));
    }
  }

private:
  NodeProp *_prop;
};

/**
 Reads rect properties from a node's properties
 */
class RRectPropFromProps : public DerivedProp<SkRRect> {
public:
  explicit RRectPropFromProps(
      const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkRRect>(onChange) {
    _x = defineProperty<NodeProp>(PropNameX);
    _y = defineProperty<NodeProp>(PropNameY);
    _width = defineProperty<NodeProp>(PropNameWidth);
    _height = defineProperty<NodeProp>(PropNameHeight);
    _r = defineProperty<NodeProp>(PropNameR);
  }

  void updateDerivedValue() override {
    if (_x->isSet() && _y->isSet() && _width->isSet() && _height->isSet() &&
        _r->isSet()) {
      setDerivedValue(SkRRect::MakeRectXY(
          SkRect::MakeXYWH(_x->value().getAsNumber(), _y->value().getAsNumber(),
                           _width->value().getAsNumber(),
                           _height->value().getAsNumber()),
          _r->value().getAsNumber(), _r->value().getAsNumber()));
    }
  }

private:
  NodeProp *_x;
  NodeProp *_y;
  NodeProp *_width;
  NodeProp *_height;
  NodeProp *_r;
};

/**
 Reads rect props from either a given property or from the property object
 itself.
 */
class RRectProps : public DerivedProp<SkRRect> {
public:
  explicit RRectProps(PropId name,
                      const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkRRect>(onChange) {
    _rectProp = defineProperty<RRectProp>(name);
    _rectPropFromProps = defineProperty<RRectPropFromProps>();
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
  RRectProp *_rectProp;
  RRectPropFromProps *_rectPropFromProps;
};

/**
 Reads rect props from either a given property or from the property object
 itself.
 */
class BoxProps : public DerivedProp<SkRRect> {
public:
  explicit BoxProps(PropId name,
                    const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkRRect>(onChange) {
    _boxProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    auto value = _boxProp->value();
    auto rect = RectProp::processRect(value);
    if (rect) {
      setDerivedValue(SkRRect::MakeRect(*rect));
    } else {
      setDerivedValue(RRectProp::processRRect(value));
    }
  }

private:
  NodeProp *_boxProp;
};

} // namespace RNSkia
