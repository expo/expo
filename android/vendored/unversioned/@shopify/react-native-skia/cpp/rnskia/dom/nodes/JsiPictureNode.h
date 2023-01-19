#pragma once

#include "JsiDomDrawingNode.h"
#include "PictureProp.h"

#include <memory>

namespace RNSkia {

class JsiPictureNode : public JsiDomDrawingNode,
                       public JsiDomNodeCtor<JsiPictureNode> {
public:
  explicit JsiPictureNode(std::shared_ptr<RNSkPlatformContext> context)
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

} // namespace RNSkia
