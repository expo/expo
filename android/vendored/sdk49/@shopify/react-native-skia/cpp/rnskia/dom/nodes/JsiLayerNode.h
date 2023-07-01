#pragma once

#include "JsiBoxShadowNode.h"
#include "JsiDomRenderNode.h"
#include "JsiPaintNode.h"

#include <memory>
#include <vector>

namespace RNSkia {

class JsiLayerNode : public JsiDomRenderNode,
                     public JsiDomNodeCtor<JsiLayerNode> {
public:
  explicit JsiLayerNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomRenderNode(context, "skLayer") {}

protected:
  void renderNode(DrawingContext *context) override {

    auto hasLayer = false;
    auto children = getChildren();

    // Is the first children a layer?
    for (size_t i = 0; i < children.size(); ++i) {
      if (i == 0) {
        // Check for paint node as layer
        if (children.at(i)->getNodeClass() == NodeClass::DeclarationNode) {
          auto declarationNode =
              std::static_pointer_cast<JsiDomDeclarationNode>(children.at(i));

          if (declarationNode->getDeclarationType() == DeclarationType::Paint) {
            // Yes, it is a paint node - which we can use as a layer.
            auto declarationContext = context->getDeclarationContext();
            auto layerNode =
                std::static_pointer_cast<JsiDomDeclarationNode>(children.at(i));

            // Save canvas with the paint node's paint!
            declarationContext->save();
            layerNode->decorate(declarationContext);
            auto paint = declarationContext->getPaints()->pop();
            declarationContext->restore();

            if (paint) {
              hasLayer = true;
              context->getCanvas()->saveLayer(
                  SkCanvas::SaveLayerRec(nullptr, paint.get(), nullptr, 0));
            }

            continue;
          }
        }
      }

      // Render rest of the children
      if (children.at(i)->getNodeClass() == NodeClass::RenderNode) {
        std::static_pointer_cast<JsiDomRenderNode>(children.at(i))
            ->render(context);
      }
    }

    if (hasLayer) {
      context->getCanvas()->restore();
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomRenderNode::defineProperties(container);
  }

private:
};

} // namespace RNSkia
