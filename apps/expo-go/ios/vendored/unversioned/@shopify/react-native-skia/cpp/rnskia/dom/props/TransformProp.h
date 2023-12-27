#pragma once

#include "DerivedNodeProp.h"
#include "JsiSkMatrix.h"

#include <memory>
#include <string>

namespace RNSkia {

static PropId PropNameTranslateX = JsiPropId::get("translateX");
static PropId PropNameTranslateY = JsiPropId::get("translateY");
static PropId PropNameScale = JsiPropId::get("scale");
static PropId PropNameScaleX = JsiPropId::get("scaleX");
static PropId PropNameScaleY = JsiPropId::get("scaleY");
static PropId PropNameSkewX = JsiPropId::get("skewX");
static PropId PropNameSkewY = JsiPropId::get("skewY");
static PropId PropNameRotate = JsiPropId::get("rotate");
static PropId PropNameRotateZ = JsiPropId::get("rotateZ");

class TransformProp : public DerivedProp<SkMatrix> {
public:
  explicit TransformProp(PropId name,
                         const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkMatrix>(onChange) {
    _transformProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (!_transformProp->isSet()) {
      setDerivedValue(nullptr);
    } else if (_transformProp->value().getType() != PropType::Array) {
      throw std::runtime_error(
          "Expected array for transform property, got " +
          JsiValue::getTypeAsString(_transformProp->value().getType()));
    } else {
      auto m = std::make_shared<SkMatrix>(SkMatrix());
      for (auto &el : _transformProp->value().getAsArray()) {
        auto keys = el.getKeys();
        if (keys.size() == 0) {
          throw std::runtime_error(
              "Empty value in transform. Expected translateX, translateY, "
              "scale, "
              "scaleX, scaleY, skewX, skewY, rotate or rotateZ.");
        }
        auto key = el.getKeys().at(0);
        auto value = el.getValue(key).getAsNumber();
        if (key == PropNameTranslateX) {
          m->preTranslate(value, 0);
        } else if (key == PropNameTranslateY) {
          m->preTranslate(0, value);
        } else if (key == PropNameScale) {
          m->preScale(value, value);
        } else if (key == PropNameScaleX) {
          m->preScale(value, 1);
        } else if (key == PropNameScaleY) {
          m->preScale(1, value);
        } else if (key == PropNameSkewX) {
          m->preSkew(value, 0);
        } else if (key == PropNameSkewY) {
          m->preSkew(0, value);
        } else if (key == PropNameRotate || key == PropNameRotateZ) {
          m->preRotate(SkRadiansToDegrees(value));
        } else {
          throw std::runtime_error(
              "Unknown key in transform. Expected translateX, translateY, "
              "scale, "
              "scaleX, scaleY, skewX, skewY, rotate or rotateZ - got " +
              std::string(key) + ".");
        }
      }
      setDerivedValue(m);
    }
  }

private:
  NodeProp *_transformProp;
};

} // namespace RNSkia
