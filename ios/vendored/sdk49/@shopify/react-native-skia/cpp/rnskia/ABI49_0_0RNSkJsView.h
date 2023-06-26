#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "JsiValueWrapper.h"
#include "ABI49_0_0RNSkView.h"

#include "JsiSkCanvas.h"
#include "ABI49_0_0RNSkInfoParameter.h"
#include "ABI49_0_0RNSkLog.h"
#include "ABI49_0_0RNSkPlatformContext.h"
#include "ABI49_0_0RNSkTimingInfo.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkBBHFactory.h"
#include "SkCanvas.h"
#include "SkPictureRecorder.h"

#pragma clang diagnostic pop

class SkPicture;
class SkRect;
class SkImage;

namespace ABI49_0_0RNSkia {
class JsiSkCanvas;
namespace jsi = ABI49_0_0facebook::jsi;

class ABI49_0_0RNSkJsRenderer : public ABI49_0_0RNSkRenderer,
                       public std::enable_shared_from_this<ABI49_0_0RNSkJsRenderer> {
public:
  ABI49_0_0RNSkJsRenderer(std::function<void()> requestRedraw,
                 std::shared_ptr<ABI49_0_0RNSkPlatformContext> context);

  bool tryRender(std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider) override;

  void
  renderImmediate(std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider) override;

  void setDrawCallback(std::shared_ptr<jsi::Function> drawCallback);

  std::shared_ptr<ABI49_0_0RNSkInfoObject> getInfoObject();

private:
  void performDraw(std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider);

  void callJsDrawCallback(std::shared_ptr<JsiSkCanvas> jsiCanvas, int width,
                          int height, double timestamp);

  void drawInJsiCanvas(std::shared_ptr<JsiSkCanvas> jsiCanvas, int width,
                       int height, double time);

  std::shared_ptr<ABI49_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<jsi::Function> _drawCallback;
  std::shared_ptr<JsiSkCanvas> _jsiCanvas;
  std::shared_ptr<std::timed_mutex> _jsDrawingLock;
  std::shared_ptr<std::timed_mutex> _gpuDrawingLock;
  std::shared_ptr<ABI49_0_0RNSkInfoObject> _infoObject;
  ABI49_0_0RNSkTimingInfo _jsTimingInfo;
  ABI49_0_0RNSkTimingInfo _gpuTimingInfo;
};

class ABI49_0_0RNSkJsView : public ABI49_0_0RNSkView {
public:
  /**
   * Constructor
   */
  ABI49_0_0RNSkJsView(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
             std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider)
      : ABI49_0_0RNSkView(context, canvasProvider,
                 std::make_shared<ABI49_0_0RNSkJsRenderer>(
                     std::bind(&ABI49_0_0RNSkJsView::requestRedraw, this), context)) {}

  void updateTouchState(std::vector<ABI49_0_0RNSkTouchInfo> &touches) override {
    std::static_pointer_cast<ABI49_0_0RNSkJsRenderer>(getRenderer())
        ->getInfoObject()
        ->updateTouches(touches);
    ABI49_0_0RNSkView::updateTouchState(touches);
  }

  void setJsiProperties(
      std::unordered_map<std::string, ABI49_0_0RNJsi::JsiValueWrapper> &props) override {

    ABI49_0_0RNSkView::setJsiProperties(props);

    for (auto &prop : props) {
      if (prop.first == "drawCallback") {
        if (prop.second.isUndefinedOrNull()) {
          // Clear drawcallback
          std::static_pointer_cast<ABI49_0_0RNSkJsRenderer>(getRenderer())
              ->setDrawCallback(nullptr);
          requestRedraw();
          continue;

        } else if (prop.second.getType() !=
                   ABI49_0_0RNJsi::JsiWrapperValueType::Function) {
          // We expect a function for the draw callback custom property
          throw std::runtime_error(
              "Expected a function for the drawCallback custom property.");
        }

        // Save callback
        std::static_pointer_cast<ABI49_0_0RNSkJsRenderer>(getRenderer())
            ->setDrawCallback(prop.second.getAsFunction());

        // Request redraw
        requestRedraw();
      }
    }
  }
};
} // namespace ABI49_0_0RNSkia
