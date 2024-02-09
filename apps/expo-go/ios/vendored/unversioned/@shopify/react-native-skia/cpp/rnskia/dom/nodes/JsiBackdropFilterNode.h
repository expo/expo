#pragma once

#include "CircleProp.h"
#include "JsiDomDrawingNode.h"

#include <memory>

namespace RNSkia {

class JsiBackdropFilterNode : public JsiDomDrawingNode,
                              public JsiDomNodeCtor<JsiBackdropFilterNode> {
public:
  explicit JsiBackdropFilterNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skBackdropFilter") {}

protected:
  void draw(DrawingContext *context) override {
    auto children = getChildren();

    if (children.size() == 0) {
      return;
    }

    auto canvas = context->getCanvas();
    auto firstChild = children[0];
    sk_sp<SkImageFilter> imageFilter;

    if (firstChild->getNodeClass() == NodeClass::DeclarationNode) {
      context->getDeclarationContext()->save();
      firstChild->decorateContext(context->getDeclarationContext());
      auto imgF = context->getDeclarationContext()->getImageFilters()->pop();
      if (imgF) {
        imageFilter = imgF;
      } else {
        auto cf = context->getDeclarationContext()->getColorFilters()->pop();
        if (cf) {
          imageFilter = SkImageFilters::ColorFilter(cf, nullptr);
        }
      }
      context->getDeclarationContext()->restore();
    }

    canvas->saveLayer(
        SkCanvas::SaveLayerRec(nullptr, nullptr, imageFilter.get(), 0));
    canvas->restore();
  }
};

} // namespace RNSkia
