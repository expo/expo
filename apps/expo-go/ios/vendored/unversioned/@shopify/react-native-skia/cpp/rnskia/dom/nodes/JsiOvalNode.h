#pragma once

#include "JsiDomDrawingNode.h"
#include "RectProp.h"

#include <memory>

namespace RNSkia {

class JsiOvalNode : public JsiDomDrawingNode,
                    public JsiDomNodeCtor<JsiOvalNode> {
public:
  explicit JsiOvalNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skOval") {}

protected:
  void draw(DrawingContext *context) override {
    context->getCanvas()->drawOval(*_rectProp->getDerivedValue(),
                                   *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _rectProp = container->defineProperty<RectProps>("rect");
    _rectProp->require();
  }

private:
  RectProps *_rectProp;
};

} // namespace RNSkia
