#pragma once

#include "JsiDomRenderNode.h"
#include "JsiPaintNode.h"

#include <memory>

namespace RNSkia {

class JsiDomDrawingNode : public JsiDomRenderNode {
public:
  JsiDomDrawingNode(std::shared_ptr<RNSkPlatformContext> context,
                    const char *type)
      : JsiDomRenderNode(context, type) {}

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomRenderNode::defineProperties(container);
    _paintProp = container->defineProperty<PaintDrawingContextProp>();
  }

  /**
   Override to implement drawing.
   */
  virtual void draw(DrawingContext *context) = 0;

  void renderNode(DrawingContext *context) override {
#if SKIA_DOM_DEBUG
    printDebugInfo("Begin Draw", 1);
#endif
    // Save paint if the paint property is set
    if (_paintProp->isSet()) {
      auto localCtx = _paintProp->getUnsafeDerivedValue().get();
      localCtx->setCanvas(context->getCanvas());
      draw(localCtx);
    } else {
      // Call abstract draw method
      draw(context);
    }

    // Draw once more for each child paint node
    auto declarationCtx = context->getDeclarationContext();
    for (auto &child : getChildren()) {
      if (child->getNodeClass() == NodeClass::DeclarationNode &&
          std::static_pointer_cast<JsiDomDeclarationNode>(child)
                  ->getDeclarationType() == DeclarationType::Paint) {
        auto paintNode = std::static_pointer_cast<JsiPaintNode>(child);
        // Draw once again with the paint
        declarationCtx->save();
        paintNode->decorate(declarationCtx);
        auto paint = declarationCtx->getPaints()->pop();
        declarationCtx->restore();

        // FIXME: Can we avoid creating a new drawing context here each time?
        auto localContext =
            std::make_shared<DrawingContext>(std::shared_ptr<SkPaint>(paint));
        localContext->setCanvas(context->getCanvas());
        draw(localContext.get());
      }
    }

#if SKIA_DOM_DEBUG
    printDebugInfo("End Draw", 1);
#endif
  }

private:
  PaintDrawingContextProp *_paintProp;
};

} // namespace RNSkia
