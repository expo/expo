#pragma once

#include "JsiDomDrawingNode.h"
#include "RRectProp.h"

#include <memory>

namespace ABI48_0_0RNSkia {

class JsiRRectNode : public JsiDomDrawingNode,
                     public JsiDomNodeCtor<JsiRRectNode> {
public:
  explicit JsiRRectNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skRRect") {}

protected:
  void draw(DrawingContext *context) override {
    context->getCanvas()->drawRRect(*_rrectProp->getDerivedValue(),
                                    *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);

    _rrectProp = container->defineProperty<RRectProps>("rect");
    _rrectProp->require();
  }

private:
  RRectProps *_rrectProp;
};

} // namespace ABI48_0_0RNSkia
