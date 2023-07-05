#pragma once

#include "DerivedNodeProp.h"

#include "PaintProps.h"

#include <memory>

namespace RNSkia {

class LayerProp : public DerivedProp<SkPaint> {
public:
  explicit LayerProp(PropId name,
                     const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkPaint>(onChange) {
    _layerPaintProp = defineProperty<PaintProp>(name);
    _layerBoolProp = defineProperty<NodeProp>(name);
  }

  /**
   Returns true if is optional and one of the child props has a value, or all
   props if optional is false.
   */
  bool isSet() override { return DerivedProp<SkPaint>::isSet() || _isBool; };

  void updateDerivedValue() override {
    if (_layerBoolProp->isSet() &&
        _layerBoolProp->value().getType() == PropType::Bool) {
      _isBool = true;
      setDerivedValue(nullptr);
      return;
    }

    if (_layerPaintProp->isSet()) {
      // We have a paint object for the layer property
      setDerivedValue(_layerPaintProp->getUnsafeDerivedValue());
      _isBool = false;
    } else {
      _isBool = false;
      setDerivedValue(nullptr);
    }
  }

  bool isBool() { return _isBool; }

private:
  PaintProp *_layerPaintProp;
  NodeProp *_layerBoolProp;
  std::atomic<bool> _isBool;
};

} // namespace RNSkia
