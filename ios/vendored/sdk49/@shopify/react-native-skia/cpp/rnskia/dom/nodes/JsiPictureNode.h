#pragma once

#include "JsiDomDrawingNode.h"
#include "PictureProp.h"

#include <memory>

namespace ABI49_0_0RNSkia {

class JsiPictureNode : public JsiDomDrawingNode,
                       public JsiDomNodeCtor<JsiPictureNode> {
public:
  explicit JsiPictureNode(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skPicture") {}

protected:
  void draw(DrawingContext *context) override {
    context->getCanvas()->drawPicture(_pictureProp->getDerivedValue());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _pictureProp = container->defineProperty<PictureProp>("picture");
    _pictureProp->require();
  }

private:
  PictureProp *_pictureProp;
};

} // namespace ABI49_0_0RNSkia
