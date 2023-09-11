#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <vector>
#include <string>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include <JsiValueWrapper.h>
#include <ABI47_0_0RNSkView.h>

#include <ABI47_0_0RNSkInfoParameter.h>
#include <ABI47_0_0RNSkPlatformContext.h>
#include <ABI47_0_0RNSkTimingInfo.h>
#include <ABI47_0_0RNSkLog.h>
#include <JsiSkPicture.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkCanvas.h>
#include <SkBBHFactory.h>
#include <SkPictureRecorder.h>

#pragma clang diagnostic pop

class SkPicture;
class SkRect;
class SkImage;

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class ABI47_0_0RNSkPictureRenderer:
  public ABI47_0_0RNSkRenderer,
  public std::enable_shared_from_this<ABI47_0_0RNSkPictureRenderer> {
public:
    ABI47_0_0RNSkPictureRenderer(std::function<void()> requestRedraw,
                        std::shared_ptr<ABI47_0_0RNSkPlatformContext> context):
    ABI47_0_0RNSkRenderer(requestRedraw),
  _platformContext(context) {}

  bool tryRender(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider) override {
    performDraw(canvasProvider);
    return true;
  }
  
  void renderImmediate(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider) override {
    performDraw(canvasProvider);
  }

  void setPicture(std::shared_ptr<jsi::HostObject> picture) {
    if(picture == nullptr) {
      _picture = nullptr;
      return;
    }
    
    _picture = std::dynamic_pointer_cast<JsiSkPicture>(picture);
    _requestRedraw();
  }
    
private:
  void performDraw(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider) {
    if(_picture == nullptr) {
      return;
    }
    
    canvasProvider->renderToCanvas([=](SkCanvas* canvas){
      // Make sure to scale correctly
      auto pd = _platformContext->getPixelDensity();
      canvas->save();
      canvas->scale(pd, pd);
      
      canvas->drawPicture(_picture->getObject());
      
      // Restore and flush canvas
      canvas->restore();
      canvas->flush();
    });
  }
  
  std::shared_ptr<ABI47_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<JsiSkPicture> _picture;
};

class ABI47_0_0RNSkPictureView: public ABI47_0_0RNSkView {
public:
  /**
   * Constructor
   */
  ABI47_0_0RNSkPictureView(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                  std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider):
    ABI47_0_0RNSkView(context,
             canvasProvider,
             std::make_shared<ABI47_0_0RNSkPictureRenderer>(std::bind(&ABI47_0_0RNSkPictureView::requestRedraw, this), context)) {}
  
  void setJsiProperties(std::unordered_map<std::string, JsiValueWrapper> &props) override {
    for(auto& prop: props) {
      if(prop.first == "picture") {
        if(prop.second.isUndefinedOrNull()) {
          // Clear picture
          std::static_pointer_cast<ABI47_0_0RNSkPictureRenderer>(getRenderer())->setPicture(nullptr);
          return;
        } else if (prop.second.getType() != JsiWrapperValueType::HostObject) {
          // We expect a function for the picture custom property
          throw std::runtime_error("Expected an object for the picture custom property.");
        }

        // Save picture
        std::static_pointer_cast<ABI47_0_0RNSkPictureRenderer>(getRenderer())->setPicture(prop.second.getAsHostObject());

        // Request redraw
        requestRedraw();

      } else {
        ABI47_0_0RNSkView::setJsiProperties(props);
      }
    }
  }
};
} // namespace ABI47_0_0RNSkia
