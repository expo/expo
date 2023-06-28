#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <jsi/jsi.h>

#include "JsiValueWrapper.h"
#include "RNSkView.h"

#include "JsiDomRenderNode.h"
#include "RNSkInfoParameter.h"
#include "RNSkLog.h"
#include "RNSkPlatformContext.h"
#include "RNSkTimingInfo.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkBBHFactory.h"
#include "SkCanvas.h"
#include "SkPictureRecorder.h"

#pragma clang diagnostic pop

class SkPicture;
class SkRect;
class SkImage;

namespace RNSkia {
class JsiSkCanvas;
namespace jsi = facebook::jsi;

class RNSkDomRenderer : public RNSkRenderer,
                        public std::enable_shared_from_this<RNSkDomRenderer> {
public:
  RNSkDomRenderer(std::function<void()> requestRedraw,
                  std::shared_ptr<RNSkPlatformContext> context);

  ~RNSkDomRenderer();

  bool tryRender(std::shared_ptr<RNSkCanvasProvider> canvasProvider) override;

  void
  renderImmediate(std::shared_ptr<RNSkCanvasProvider> canvasProvider) override;

  void setRoot(std::shared_ptr<JsiDomRenderNode> node);

  void setOnTouchCallback(std::shared_ptr<jsi::Function> onTouchCallback);

  void updateTouches(std::vector<RNSkTouchInfo> &touches);

private:
  void callOnTouch();
  void renderCanvas(SkCanvas *canvas, float scaledWidth, float scaledHeight);
  void renderDebugOverlays(SkCanvas *canvas);

  std::shared_ptr<RNSkPlatformContext> _platformContext;
  std::shared_ptr<jsi::Function> _touchCallback;

  std::shared_ptr<std::timed_mutex> _renderLock;
  std::shared_ptr<std::timed_mutex> _touchCallbackLock;

  std::shared_ptr<JsiDomRenderNode> _root;
  std::shared_ptr<DrawingContext> _drawingContext;

  RNSkTimingInfo _renderTimingInfo;

  std::mutex _touchMutex;
  std::vector<std::vector<RNSkTouchInfo>> _currentTouches;
  std::vector<std::vector<RNSkTouchInfo>> _touchesCache;
  std::mutex _rootLock;
};

class RNSkDomView : public RNSkView {
public:
  /**
   * Constructor
   */
  RNSkDomView(std::shared_ptr<RNSkPlatformContext> context,
              std::shared_ptr<RNSkCanvasProvider> canvasProvider)
      : RNSkView(context, canvasProvider,
                 std::make_shared<RNSkDomRenderer>(
                     std::bind(&RNSkView::requestRedraw, this), context)) {}

  void updateTouchState(std::vector<RNSkTouchInfo> &touches) override {
    std::static_pointer_cast<RNSkDomRenderer>(getRenderer())
        ->updateTouches(touches);
    RNSkView::updateTouchState(touches);
  }

  void setJsiProperties(
      std::unordered_map<std::string, JsiValueWrapper> &props) override {

    RNSkView::setJsiProperties(props);

    for (auto &prop : props) {
      if (prop.first == "onTouch") {
        if (prop.second.isUndefinedOrNull()) {
          // Clear touchCallback
          std::static_pointer_cast<RNSkDomRenderer>(getRenderer())
              ->setOnTouchCallback(nullptr);
          requestRedraw();
          continue;

        } else if (prop.second.getType() != JsiWrapperValueType::Function) {
          // We expect a function for the draw callback custom property
          throw std::runtime_error(
              "Expected a function for the onTouch property.");
        }

        // Save callback
        std::static_pointer_cast<RNSkDomRenderer>(getRenderer())
            ->setOnTouchCallback(prop.second.getAsFunction());

        // Request redraw
        requestRedraw();

      } else if (prop.first == "root") {
        // Save root
        if (prop.second.isUndefined() || prop.second.isNull()) {
          std::static_pointer_cast<RNSkDomRenderer>(getRenderer())
              ->setRoot(nullptr);
        } else {
          std::static_pointer_cast<RNSkDomRenderer>(getRenderer())
              ->setRoot(std::dynamic_pointer_cast<JsiDomRenderNode>(
                  prop.second.getAsHostObject()));
        }

        // Request redraw
        requestRedraw();
      }
    }
  }
};
} // namespace RNSkia
