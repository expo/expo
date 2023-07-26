#pragma once

#include "JsiDomDrawingNode.h"
#include "RectProp.h"

#include <memory>

namespace ABI49_0_0RNSkia {

class JsiRectNode : public JsiDomDrawingNode,
                    public JsiDomNodeCtor<JsiRectNode> {
public:
  explicit JsiRectNode(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skRect") {}

protected:
  void draw(DrawingContext *context) override {
    context->getCanvas()->drawRect(*_rectProp->getDerivedValue(),
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

} // namespace ABI49_0_0RNSkia
