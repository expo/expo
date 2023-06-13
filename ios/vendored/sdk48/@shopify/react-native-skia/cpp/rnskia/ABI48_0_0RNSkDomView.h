#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <ABI48_0_0jsi/ABI48_0_0jsi.h>

#include <JsiValueWrapper.h>
#include <ABI48_0_0RNSkView.h>

#include "JsiDomRenderNode.h"
#include <ABI48_0_0RNSkInfoParameter.h>
#include <ABI48_0_0RNSkLog.h>
#include <ABI48_0_0RNSkPlatformContext.h>
#include <ABI48_0_0RNSkTimingInfo.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkBBHFactory.h>
#include <SkCanvas.h>
#include <SkPictureRecorder.h>

#pragma clang diagnostic pop

class SkPicture;
class SkRect;
class SkImage;

namespace ABI48_0_0RNSkia {
class JsiSkCanvas;
namespace jsi = ABI48_0_0facebook::jsi;

class ABI48_0_0RNSkDomRenderer : public ABI48_0_0RNSkRenderer,
                        public std::enable_shared_from_this<ABI48_0_0RNSkDomRenderer> {
public:
  ABI48_0_0RNSkDomRenderer(std::function<void()> requestRedraw,
                  std::shared_ptr<ABI48_0_0RNSkPlatformContext> context);

  ~ABI48_0_0RNSkDomRenderer();

  bool tryRender(std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider) override;

  void
  renderImmediate(std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider) override;

  void setRoot(std::shared_ptr<JsiDomRenderNode> node);

  void setOnTouchCallback(std::shared_ptr<jsi::Function> onTouchCallback);

  void updateTouches(std::vector<ABI48_0_0RNSkTouchInfo> &touches);

private:
  void callOnTouch();
  void renderCanvas(SkCanvas *canvas, float scaledWidth, float scaledHeight);
  void renderDebugOverlays(SkCanvas *canvas);

  std::shared_ptr<ABI48_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<jsi::Function> _touchCallback;

  std::shared_ptr<std::timed_mutex> _renderLock;
  std::shared_ptr<std::timed_mutex> _touchCallbackLock;

  std::shared_ptr<JsiDomRenderNode> _root;
  std::shared_ptr<DrawingContext> _drawingContext;

  ABI48_0_0RNSkTimingInfo _renderTimingInfo;

  std::mutex _touchMutex;
  std::vector<std::vector<ABI48_0_0RNSkTouchInfo>> _currentTouches;
  std::vector<std::vector<ABI48_0_0RNSkTouchInfo>> _touchesCache;
  std::mutex _rootLock;
};

class ABI48_0_0RNSkDomView : public ABI48_0_0RNSkView {
public:
  /**
   * Constructor
   */
  ABI48_0_0RNSkDomView(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
              std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider)
      : ABI48_0_0RNSkView(context, canvasProvider,
                 std::make_shared<ABI48_0_0RNSkDomRenderer>(
                     std::bind(&ABI48_0_0RNSkView::requestRedraw, this), context)) {}

  void updateTouchState(std::vector<ABI48_0_0RNSkTouchInfo> &touches) override {
    std::static_pointer_cast<ABI48_0_0RNSkDomRenderer>(getRenderer())
        ->updateTouches(touches);
    ABI48_0_0RNSkView::updateTouchState(touches);
  }

  void setJsiProperties(
      std::unordered_map<std::string, JsiValueWrapper> &props) override {

    ABI48_0_0RNSkView::setJsiProperties(props);

    for (auto &prop : props) {
      if (prop.first == "onTouch") {
        if (prop.second.isUndefinedOrNull()) {
          // Clear touchCallback
          std::static_pointer_cast<ABI48_0_0RNSkDomRenderer>(getRenderer())
              ->setOnTouchCallback(nullptr);
          requestRedraw();
          continue;

        } else if (prop.second.getType() != JsiWrapperValueType::Function) {
          // We expect a function for the draw callback custom property
          throw std::runtime_error(
              "Expected a function for the onTouch property.");
        }

        // Save callback
        std::static_pointer_cast<ABI48_0_0RNSkDomRenderer>(getRenderer())
            ->setOnTouchCallback(prop.second.getAsFunction());

        // Request redraw
        requestRedraw();

      } else if (prop.first == "root") {
        // Save root
        if (prop.second.isUndefined() || prop.second.isNull()) {
          std::static_pointer_cast<ABI48_0_0RNSkDomRenderer>(getRenderer())
              ->setRoot(nullptr);
        } else {
          std::static_pointer_cast<ABI48_0_0RNSkDomRenderer>(getRenderer())
              ->setRoot(std::dynamic_pointer_cast<JsiDomRenderNode>(
                  prop.second.getAsHostObject()));
        }

        // Request redraw
        requestRedraw();
      }
    }
  }
};
} // namespace ABI48_0_0RNSkia
