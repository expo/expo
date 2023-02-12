
#pragma once

#include "JsiDomRenderNode.h"

#include <memory>

namespace ABI48_0_0RNSkia {

class JsiGroupNode : public JsiDomRenderNode,
                     public JsiDomNodeCtor<JsiGroupNode> {
public:
  explicit JsiGroupNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiDomRenderNode(context, "skGroup") {}

  void renderNode(DrawingContext *context) override {
    for (auto &child : getChildren()) {
      if (child->getNodeClass() == JsiDomNodeClass::RenderNode) {
        std::static_pointer_cast<JsiDomRenderNode>(child)->render(context);
      }
    }
  }
};

} // namespace ABI48_0_0RNSkia
