
#pragma once

#include "JsiDomRenderNode.h"

#include <memory>

namespace ABI49_0_0RNSkia {

class JsiGroupNode : public JsiDomRenderNode,
                     public JsiDomNodeCtor<JsiGroupNode> {
public:
  explicit JsiGroupNode(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context)
      : JsiDomRenderNode(context, "skGroup") {}

  void renderNode(DrawingContext *context) override {
    for (auto &child : getChildren()) {
      if (child->getNodeClass() == NodeClass::RenderNode) {
        std::static_pointer_cast<JsiDomRenderNode>(child)->render(context);
      }
    }
  }
};

} // namespace ABI49_0_0RNSkia
