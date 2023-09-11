#pragma once

#include "JsiDomRenderNode.h"
#include "JsiPaintNode.h"

#include <memory>

namespace ABI48_0_0RNSkia {

class JsiDomDrawingNode : public JsiDomRenderNode {
public:
  JsiDomDrawingNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                    const char *type)
      : JsiDomRenderNode(context, type) {}

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomRenderNode::defineProperties(container);
    container->defineProperty<PaintProp>();
  }

  /**
   Override to implement drawing.
   */
  virtual void draw(DrawingContext *context) = 0;

  void renderNode(DrawingContext *context) override {
#if SKIA_DOM_DEBUG
    printDebugInfo("Begin Draw", 1);
#endif

#if SKIA_DOM_DEBUG
    printDebugInfo(context->getDebugDescription(), 2);
#endif
    draw(context);

    // Draw once more for each child paint node
    for (auto &child : getChildren()) {
      auto ptr = std::dynamic_pointer_cast<JsiPaintNode>(child);
      if (ptr != nullptr) {
        draw(ptr->getDrawingContext());
      }
    }
#if SKIA_DOM_DEBUG
    printDebugInfo("End Draw", 1);
#endif
  }
};

} // namespace ABI48_0_0RNSkia
