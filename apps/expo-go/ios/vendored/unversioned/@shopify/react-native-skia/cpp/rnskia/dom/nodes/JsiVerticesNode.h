#pragma once

#include "JsiDomDrawingNode.h"

#include "BlendModeProp.h"
#include "VerticesProps.h"

#include <memory>

namespace RNSkia {

class JsiVerticesNode : public JsiDomDrawingNode,
                        public JsiDomNodeCtor<JsiVerticesNode> {
public:
  explicit JsiVerticesNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skVertices") {}

protected:
  void draw(DrawingContext *context) override {
    SkBlendMode defaultBlendMode = _verticesProps->hasColors()
                                       ? SkBlendMode::kDstOver
                                       : SkBlendMode::kSrcOver;
    context->getCanvas()->drawVertices(_verticesProps->getDerivedValue(),
                                       _blendModeProp->isSet()
                                           ? *_blendModeProp->getDerivedValue()
                                           : defaultBlendMode,
                                       *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _verticesProps = container->defineProperty<VerticesProps>();
    _blendModeProp = container->defineProperty<BlendModeProp>("blendMode");
  }

private:
  VerticesProps *_verticesProps;
  BlendModeProp *_blendModeProp;
};

} // namespace RNSkia
