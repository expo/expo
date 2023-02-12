#pragma once

#include "JsiDomDrawingNode.h"
#include "RectProp.h"
#include "SvgProp.h"

#include <memory>

namespace ABI48_0_0RNSkia {

class JsiImageSvgNode : public JsiDomDrawingNode,
                        public JsiDomNodeCtor<JsiImageSvgNode> {
public:
  explicit JsiImageSvgNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skImageSvg") {}

protected:
  void draw(DrawingContext *context) override {
    auto svgDom = _svgDomProp->getDerivedValue();
    auto rect = _rectProp->getDerivedValue();

    context->getCanvas()->save();
    context->getCanvas()->translate(rect->x(), rect->y());
    svgDom->setContainerSize(SkSize::Make(rect->width(), rect->height()));
    svgDom->render(context->getCanvas());
    context->getCanvas()->restore();
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _svgDomProp = container->defineProperty<SvgProp>("svg");
    _rectProp = container->defineProperty<RectProps>("rect");

    _svgDomProp->require();
  }

private:
  SvgProp *_svgDomProp;
  RectProps *_rectProp;
};

} // namespace ABI48_0_0RNSkia
