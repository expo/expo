#pragma once

#include "DerivedNodeProp.h"

#include "JsiSkFont.h"

#include <memory>

namespace RNSkia {

using NotifyNeedRenderCallback =
    std::function<void(jsi::HostFunctionType drawing)>;

class DrawingProp : public DerivedSkProp<SkPicture> {
public:
  DrawingProp(PropId name, NotifyNeedRenderCallback notifyPictureNeeded)
      : _notifyPictureNeeded(notifyPictureNeeded), DerivedSkProp<SkPicture>() {
    _drawingProp = addProperty(std::make_shared<NodeProp>(name));
  }

  void updateDerivedValue() override {
    auto drawingFunc = _drawingProp->value().getAsFunction();
    _notifyPictureNeeded(drawingFunc);
  }

  void setPicture(sk_sp<SkPicture> picture) { setDerivedValue(picture); }

private:
  NodeProp *_drawingProp;
  NotifyNeedRenderCallback _notifyPictureNeeded;
};

} // namespace RNSkia
