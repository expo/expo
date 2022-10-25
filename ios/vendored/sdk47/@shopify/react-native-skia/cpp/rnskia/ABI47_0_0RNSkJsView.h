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
#include <JsiSkCanvas.h>

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
class JsiSkCanvas;
using namespace ABI47_0_0facebook;

class ABI47_0_0RNSkJsRenderer:
  public ABI47_0_0RNSkRenderer,
  public std::enable_shared_from_this<ABI47_0_0RNSkJsRenderer> {
public:
  ABI47_0_0RNSkJsRenderer(std::function<void()> requestRedraw,
                 std::shared_ptr<ABI47_0_0RNSkPlatformContext> context);
  
  bool tryRender(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider) override;
  
  void renderImmediate(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider) override;
  
  void setDrawCallback(std::shared_ptr<jsi::Function> drawCallback);
    
  std::shared_ptr<ABI47_0_0RNSkInfoObject> getInfoObject();
    
private:
  void performDraw(std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider);
    
  void callJsDrawCallback(std::shared_ptr<JsiSkCanvas> jsiCanvas,
                          int width,
                          int height,
                          double timestamp);
  
  void drawInJsiCanvas(std::shared_ptr<JsiSkCanvas> jsiCanvas,
                       int width,
                       int height,
                       double time);

  std::shared_ptr<ABI47_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<jsi::Function> _drawCallback;
  std::shared_ptr<JsiSkCanvas> _jsiCanvas;
  std::shared_ptr<std::timed_mutex> _jsDrawingLock;
  std::shared_ptr<std::timed_mutex> _gpuDrawingLock;
  std::shared_ptr<ABI47_0_0RNSkInfoObject> _infoObject;
  ABI47_0_0RNSkTimingInfo _jsTimingInfo;
  ABI47_0_0RNSkTimingInfo _gpuTimingInfo;
};

class ABI47_0_0RNSkJsView: public ABI47_0_0RNSkView {
public:
  /**
   * Constructor
   */
  ABI47_0_0RNSkJsView(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
             std::shared_ptr<ABI47_0_0RNSkCanvasProvider> canvasProvider):
    ABI47_0_0RNSkView(context,
             canvasProvider,
             std::make_shared<ABI47_0_0RNSkJsRenderer>(std::bind(&ABI47_0_0RNSkJsView::requestRedraw, this), context)) {}
  
  void updateTouchState(std::vector<ABI47_0_0RNSkTouchInfo>& touches) override {
    std::static_pointer_cast<ABI47_0_0RNSkJsRenderer>(getRenderer())->getInfoObject()->updateTouches(touches);
    ABI47_0_0RNSkView::updateTouchState(touches);
  }
  
  void setJsiProperties(std::unordered_map<std::string, JsiValueWrapper> &props) override {
    for(auto& prop: props) {
      if(prop.first == "drawCallback") {
        if(prop.second.isUndefinedOrNull()) {
          // Clear drawcallback
          std::static_pointer_cast<ABI47_0_0RNSkJsRenderer>(getRenderer())->setDrawCallback(nullptr);
          return;
        } else if (prop.second.getType() != JsiWrapperValueType::Function) {
          // We expect a function for the draw callback custom property
          throw std::runtime_error("Expected a function for the drawCallback custom property.");
        }

        // Save callback
        std::static_pointer_cast<ABI47_0_0RNSkJsRenderer>(getRenderer())->setDrawCallback(prop.second.getAsFunction());        

        // Request redraw
        requestRedraw();

      } else {
        ABI47_0_0RNSkView::setJsiProperties(props);
      }
    }
  }
};
} // namespace ABI47_0_0RNSkia
