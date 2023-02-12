#pragma once

#include "JsiDomDrawingNode.h"
#include "RRectProp.h"

#include <memory>

namespace RNSkia {

class JsiDiffRectNode : public JsiDomDrawingNode,
                        public JsiDomNodeCtor<JsiDiffRectNode> {
public:
  explicit JsiDiffRectNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skDiffRect") {}

protected:
  void draw(DrawingContext *context) override {
    context->getCanvas()->drawDRRect(*_outerRectProp->getDerivedValue(),
                                     *_innerRectProp->getDerivedValue(),
                                     *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _innerRectProp = container->defineProperty<RRectProp>("inner");
    _outerRectProp = container->defineProperty<RRectProp>("outer");

    _innerRectProp->require();
    _outerRectProp->require();
  }

private:
  RRectProp *_innerRectProp;
  RRectProp *_outerRectProp;
};

} // namespace RNSkia
