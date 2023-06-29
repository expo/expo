#pragma once

#include "JsiDomDrawingNode.h"
#include "PointsProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkCanvas.h"

#pragma clang diagnostic pop

namespace RNSkia {

static PropId PropNamePointsMode = JsiPropId::get("mode");

class JsiPointsNode : public JsiDomDrawingNode,
                      public JsiDomNodeCtor<JsiPointsNode> {
public:
  explicit JsiPointsNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skPoints") {}

protected:
  void draw(DrawingContext *context) override {
    auto mode = _pointModeProp->getDerivedValue();
    auto points = _pointsProp->getDerivedValue();

    context->getCanvas()->drawPoints(*mode, points->size(), points->data(),
                                     *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _pointModeProp = container->defineProperty<PointModeProp>("mode");
    _pointsProp = container->defineProperty<PointsProp>("points");

    _pointsProp->require();
    _pointModeProp->require();
  }

private:
  PointModeProp *_pointModeProp;
  PointsProp *_pointsProp;
};

} // namespace RNSkia
