#pragma once

#include "JsiDomDrawingNode.h"
#include "RectProp.h"
#include "SvgProp.h"

#include <memory>

namespace RNSkia {

class JsiImageSvgNode : public JsiDomDrawingNode,
                        public JsiDomNodeCtor<JsiImageSvgNode> {
public:
  explicit JsiImageSvgNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skImageSvg") {}

protected:
  void draw(DrawingContext *context) override {
    auto svgDom = _svgDomProp->getDerivedValue();
    if (svgDom != nullptr) {
      auto rect = _rectProp->getDerivedValue();
      auto x = _xProp->isSet() ? _xProp->value().getAsNumber() : -1;
      auto y = _yProp->isSet() ? _yProp->value().getAsNumber() : -1;
      auto width = _widthProp->isSet() ? _widthProp->value().getAsNumber() : -1;
      auto height =
          _widthProp->isSet() ? _heightProp->value().getAsNumber() : -1;
      context->getCanvas()->save();
      if (rect != nullptr) {
        context->getCanvas()->translate(rect->x(), rect->y());
        svgDom->setContainerSize(SkSize::Make(rect->width(), rect->height()));
      } else {
        if (x != -1 && y != -1) {
          context->getCanvas()->translate(x, y);
        }
        if (width != -1 && height != -1) {
          svgDom->setContainerSize(SkSize::Make(width, height));
        }
      }
      svgDom->render(context->getCanvas());
      context->getCanvas()->restore();
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _svgDomProp = container->defineProperty<SvgProp>("svg");
    _rectProp = container->defineProperty<RectProps>("rect");
    _xProp = container->defineProperty<NodeProp>("x");
    _yProp = container->defineProperty<NodeProp>("y");
    _widthProp = container->defineProperty<NodeProp>("width");
    _heightProp = container->defineProperty<NodeProp>("height");
  }

private:
  SvgProp *_svgDomProp;
  RectProps *_rectProp;
  NodeProp *_xProp;
  NodeProp *_yProp;
  NodeProp *_widthProp;
  NodeProp *_heightProp;
};

} // namespace RNSkia
