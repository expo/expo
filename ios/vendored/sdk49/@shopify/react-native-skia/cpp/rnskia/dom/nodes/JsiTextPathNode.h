#pragma once

#include "JsiDomDrawingNode.h"
#include "TextBlobProp.h"

#include <memory>

namespace ABI49_0_0RNSkia {

class JsiTextPathNode : public JsiDomDrawingNode,
                        public JsiDomNodeCtor<JsiTextPathNode> {
public:
  explicit JsiTextPathNode(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skTextPath") {}

protected:
  void draw(DrawingContext *context) override {
    auto blob = _textBlobProp->getDerivedValue();
    if (blob != nullptr) {
      context->getCanvas()->drawTextBlob(blob, 0, 0, *context->getPaint());
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _textBlobProp = container->defineProperty<TextPathBlobProp>();
  }

private:
  TextPathBlobProp *_textBlobProp;
};

} // namespace ABI49_0_0RNSkia
