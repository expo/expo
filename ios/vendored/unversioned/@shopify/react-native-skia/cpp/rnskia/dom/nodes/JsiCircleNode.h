#pragma once

#include "CircleProp.h"
#include "JsiDomDrawingNode.h"

#include <memory>

namespace RNSkia {

class JsiCircleNode : public JsiDomDrawingNode,
                      public JsiDomNodeCtor<JsiCircleNode> {
public:
  explicit JsiCircleNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skCircle") {}

protected:
  void draw(DrawingContext *context) override {
    auto circle = _circleProp->getDerivedValue();
    auto r = _radiusProp->value().getAsNumber();
    context->getCanvas()->drawCircle(*circle, r, *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _circleProp = container->defineProperty<CircleProp>();
    _radiusProp = container->defineProperty<NodeProp>("r");
    _radiusProp->require();
  }

private:
  CircleProp *_circleProp;
  NodeProp *_radiusProp;
};

} // namespace RNSkia
