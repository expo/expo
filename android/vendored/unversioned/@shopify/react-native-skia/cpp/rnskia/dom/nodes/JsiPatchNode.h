#pragma once

#include "BezierProps.h"
#include "BlendModeProp.h"
#include "ColorProp.h"
#include "JsiDomDrawingNode.h"
#include "PointsProp.h"

#include <memory>

namespace RNSkia {

class JsiPatchNode : public JsiDomDrawingNode,
                     public JsiDomNodeCtor<JsiPatchNode> {
public:
  explicit JsiPatchNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skPatch") {}

protected:
  void draw(DrawingContext *context) override {
    SkBlendMode defaultBlendMode =
        _colorsProp->isSet() ? SkBlendMode::kDstOver : SkBlendMode::kSrcOver;
    context->getCanvas()->drawPatch(
        _patchProp->getDerivedValue()->data(),
        _colorsProp->isSet() ? _colorsProp->getDerivedValue()->data() : nullptr,
        _textureProp->isSet() ? _textureProp->getDerivedValue()->data()
                              : nullptr,
        _blendModeProp->isSet() ? *_blendModeProp->getDerivedValue()
                                : defaultBlendMode,
        *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _colorsProp = container->defineProperty<ColorsProp>("colors");
    _textureProp = container->defineProperty<PointsProp>("texture");
    _blendModeProp = container->defineProperty<BlendModeProp>("blendMode");
    _patchProp = container->defineProperty<BezierProp>("patch");

    _patchProp->require();
  }

private:
  ColorsProp *_colorsProp;
  PointsProp *_textureProp;
  BlendModeProp *_blendModeProp;
  BezierProp *_patchProp;
};

} // namespace RNSkia
