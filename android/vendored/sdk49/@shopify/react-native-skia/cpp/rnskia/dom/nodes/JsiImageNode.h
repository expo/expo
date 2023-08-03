#pragma once

#include "ImageProps.h"
#include "JsiDomDrawingNode.h"

#include <memory>

namespace RNSkia {

class JsiImageNode : public JsiDomDrawingNode,
                     public JsiDomNodeCtor<JsiImageNode> {
public:
  explicit JsiImageNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skImage") {}

protected:
  void draw(DrawingContext *context) override {
    auto rects = _imageProps->getDerivedValue();
    auto image = _imageProps->getImage();
    if (image == nullptr) {
      return;
    }

    context->getCanvas()->drawImageRect(
        image, rects->src, rects->dst, SkSamplingOptions(),
        context->getPaint().get(), SkCanvas::kStrict_SrcRectConstraint);
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _imageProps = container->defineProperty<ImageProps>();
  }

private:
  ImageProps *_imageProps;
};

} // namespace RNSkia
