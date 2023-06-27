#pragma once

#include "JsiDomDrawingNode.h"

#include "TextBlobProp.h"

#include <memory>

namespace RNSkia {

class JsiTextBlobNode : public JsiDomDrawingNode,
                        public JsiDomNodeCtor<JsiTextBlobNode> {
public:
  explicit JsiTextBlobNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skTextBlob") {}

protected:
  void draw(DrawingContext *context) override {
    auto blob = _textBlobProp->getDerivedValue();
    auto x = _xProp->value().getAsNumber();
    auto y = _yProp->value().getAsNumber();

    context->getCanvas()->drawTextBlob(blob, x, y, *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);

    _textBlobProp = container->defineProperty<TextBlobProp>("blob");
    _xProp = container->defineProperty<NodeProp>("x");
    _yProp = container->defineProperty<NodeProp>("y");

    _textBlobProp->require();
    _xProp->require();
    _yProp->require();
  }

private:
  TextBlobProp *_textBlobProp;
  NodeProp *_xProp;
  NodeProp *_yProp;
};

} // namespace RNSkia
