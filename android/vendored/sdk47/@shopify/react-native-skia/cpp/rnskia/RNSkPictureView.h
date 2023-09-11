#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <vector>
#include <string>

#include <jsi/jsi.h>

#include <JsiValueWrapper.h>
#include <RNSkView.h>

#include <RNSkInfoParameter.h>
#include <RNSkPlatformContext.h>
#include <RNSkTimingInfo.h>
#include <RNSkLog.h>
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

namespace RNSkia {

using namespace facebook;

class RNSkPictureRenderer:
  public RNSkRenderer,
  public std::enable_shared_from_this<RNSkPictureRenderer> {
public:
    RNSkPictureRenderer(std::function<void()> requestRedraw,
                        std::shared_ptr<RNSkPlatformContext> context):
    RNSkRenderer(requestRedraw),
  _platformContext(context) {}

  bool tryRender(std::shared_ptr<RNSkCanvasProvider> canvasProvider) override {
    performDraw(canvasProvider);
    return true;
  }
  
  void renderImmediate(std::shared_ptr<RNSkCanvasProvider> canvasProvider) override {
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
  void performDraw(std::shared_ptr<RNSkCanvasProvider> canvasProvider) {
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
  
  std::shared_ptr<RNSkPlatformContext> _platformContext;
  std::shared_ptr<JsiSkPicture> _picture;
};

class RNSkPictureView: public RNSkView {
public:
  /**
   * Constructor
   */
  RNSkPictureView(std::shared_ptr<RNSkPlatformContext> context,
                  std::shared_ptr<RNSkCanvasProvider> canvasProvider):
    RNSkView(context,
             canvasProvider,
             std::make_shared<RNSkPictureRenderer>(std::bind(&RNSkPictureView::requestRedraw, this), context)) {}
  
  void setJsiProperties(std::unordered_map<std::string, JsiValueWrapper> &props) override {
    for(auto& prop: props) {
      if(prop.first == "picture") {
        if(prop.second.isUndefinedOrNull()) {
          // Clear picture
          std::static_pointer_cast<RNSkPictureRenderer>(getRenderer())->setPicture(nullptr);
          return;
        } else if (prop.second.getType() != JsiWrapperValueType::HostObject) {
          // We expect a function for the picture custom property
          throw std::runtime_error("Expected an object for the picture custom property.");
        }

        // Save picture
        std::static_pointer_cast<RNSkPictureRenderer>(getRenderer())->setPicture(prop.second.getAsHostObject());

        // Request redraw
        requestRedraw();

      } else {
        RNSkView::setJsiProperties(props);
      }
    }
  }
};
} // namespace RNSkia
