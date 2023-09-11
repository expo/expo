#pragma once

#include "JsiBoxShadowNode.h"
#include "JsiDomRenderNode.h"
#include "JsiPaintNode.h"

#include <memory>
#include <vector>

namespace ABI48_0_0RNSkia {

class JsiLayerNode : public JsiDomRenderNode,
                     public JsiDomNodeCtor<JsiLayerNode> {
public:
  explicit JsiLayerNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiDomRenderNode(context, "skLayer") {}

protected:
  void renderNode(DrawingContext *context) override {

    bool isLayer = false;
    auto children = getChildren();
    auto size = children.size();

    // Is the first children a layer?
    for (size_t i = 0; i < size; ++i) {
      if (i == 0) {
        // Check for paint node as layer
        auto paintNode =
            std::dynamic_pointer_cast<JsiPaintNode>(children.at(i));

        if (paintNode != nullptr) {
          // Yes, it is a paint node - which we can use as a layer.
          isLayer = true;
          // Save canvas with the paint node's paint!
          context->getCanvas()->saveLayer(SkCanvas::SaveLayerRec(
              nullptr, paintNode->getPaint().get(), nullptr, 0));

          continue;
        }
      }

      // Render rest of the children
      auto renderNode =
          std::dynamic_pointer_cast<JsiDomRenderNode>(children.at(i));

      if (renderNode != nullptr) {
        renderNode->render(context);
      }
    }

    if (isLayer) {
      context->getCanvas()->restore();
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomRenderNode::defineProperties(container);
  }

private:
};

} // namespace ABI48_0_0RNSkia
