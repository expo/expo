#pragma once

#include "NodeProp.h"

#include <memory>
#include <utility>

namespace RNSkia {

class BoxShadowProps : public DerivedProp<SkPaint> {
public:
  BoxShadowProps() : DerivedProp<SkPaint>() {
    _dxProp = addProperty(std::make_shared<NodeProp>(JsiPropId::get("dx")));
    _dyProp = addProperty(std::make_shared<NodeProp>(JsiPropId::get("dy")));
    _spreadProp =
        addProperty(std::make_shared<NodeProp>(JsiPropId::get("spread")));
    _blurProp = addProperty(std::make_shared<NodeProp>(JsiPropId::get("blur")));
    _colorProp =
        addProperty(std::make_shared<ColorProp>(JsiPropId::get("color")));
    _innerProp =
        addProperty(std::make_shared<NodeProp>(JsiPropId::get("inner")));

    _blurProp->require();
  }

  void updateDerivedValue() override {
    SkColor color =
        _colorProp->isSet() ? *_colorProp->getDerivedValue() : SK_ColorBLACK;
    SkScalar blur = _blurProp->value().getAsNumber();

    auto paint = SkPaint();
    paint.setAntiAlias(true);
    paint.setColor(color);
    auto filter = SkMaskFilter::MakeBlur(kNormal_SkBlurStyle, blur, true);
    paint.setMaskFilter(filter);

    setDerivedValue(std::move(paint));
  }

  bool isInner() {
    return _innerProp->isSet() ? _innerProp->value().getAsBool() : false;
  }
  SkScalar getDx() {
    return _dxProp->isSet() ? _dxProp->value().getAsNumber() : 0;
  }
  SkScalar getDy() {
    return _dyProp->isSet() ? _dyProp->value().getAsNumber() : 0;
  }
  SkScalar getSpread() {
    return _spreadProp->isSet() ? _spreadProp->value().getAsNumber() : 0;
  }

private:
  NodeProp *_dxProp;
  NodeProp *_dyProp;
  NodeProp *_spreadProp;
  NodeProp *_blurProp;
  ColorProp *_colorProp;
  NodeProp *_innerProp;
};

} // namespace RNSkia
