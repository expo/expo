#pragma once

#include "JsiDomDrawingNode.h"
#include "PointProp.h"

#include <memory>

namespace RNSkia {

class JsiLineNode : public JsiDomDrawingNode,
                    public JsiDomNodeCtor<JsiLineNode> {
public:
  explicit JsiLineNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skLine") {}

protected:
  void draw(DrawingContext *context) override {
    context->getCanvas()->drawLine(
        _p1Prop->getDerivedValue()->x(), _p1Prop->getDerivedValue()->y(),
        _p2Prop->getDerivedValue()->x(), _p2Prop->getDerivedValue()->y(),
        *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _p1Prop = container->defineProperty<PointProp>("p1");
    _p2Prop = container->defineProperty<PointProp>("p2");

    _p1Prop->require();
    _p2Prop->require();
  }

private:
  PointProp *_p1Prop;
  PointProp *_p2Prop;
};

} // namespace RNSkia
