#pragma once

#include "CircleProp.h"
#include "JsiDomDrawingNode.h"

#include <memory>

namespace ABI48_0_0RNSkia {

class JsiBackdropFilterNode : public JsiDomDrawingNode,
                              public JsiDomNodeCtor<JsiBackdropFilterNode> {
public:
  explicit JsiBackdropFilterNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skBackdropFilter") {}

protected:
  void draw(DrawingContext *context) override {
    if (getChildren().size() == 0) {
      throw std::runtime_error(
          "Expected at least one child in the BackdropFilter node.");
    }
    auto child = getChildren()[0];
    auto colorFilter = std::dynamic_pointer_cast<JsiBaseColorFilterNode>(child);
    auto imageFilter = std::dynamic_pointer_cast<JsiBaseImageFilterNode>(child);

    auto canvas = context->getCanvas();
    auto filter =
        colorFilter != nullptr
            ? SkImageFilters::ColorFilter(colorFilter->getCurrent(), nullptr)
            : imageFilter->getCurrent();

    canvas->saveLayer(
        SkCanvas::SaveLayerRec(nullptr, nullptr, filter.get(), 0));
    canvas->restore();
  }
};

} // namespace ABI48_0_0RNSkia
