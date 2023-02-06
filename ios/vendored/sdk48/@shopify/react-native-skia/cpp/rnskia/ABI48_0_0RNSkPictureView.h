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

#include <JsiSkPicture.h>
#include <ABI48_0_0RNSkInfoParameter.h>
#include <ABI48_0_0RNSkLog.h>
#include <ABI48_0_0RNSkPlatformContext.h>
#include <ABI48_0_0RNSkTimingInfo.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkBBHFactory.h"
#include "SkCanvas.h"
#include "SkPictureRecorder.h"

#pragma clang diagnostic pop

class SkPicture;
class SkRect;
class SkImage;

namespace ABI48_0_0RNSkia {

namespace jsi = ABI48_0_0facebook::jsi;

class ABI48_0_0RNSkPictureRenderer
    : public ABI48_0_0RNSkRenderer,
      public std::enable_shared_from_this<ABI48_0_0RNSkPictureRenderer> {
public:
  ABI48_0_0RNSkPictureRenderer(std::function<void()> requestRedraw,
                      std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : ABI48_0_0RNSkRenderer(requestRedraw), _platformContext(context) {}

  bool tryRender(std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider) override {
    performDraw(canvasProvider);
    return true;
  }

  void
  renderImmediate(std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider) override {
    performDraw(canvasProvider);
  }

  void setPicture(std::shared_ptr<jsi::HostObject> picture) {
    if (picture == nullptr) {
      _picture = nullptr;
      return;
    }

    _picture = std::dynamic_pointer_cast<JsiSkPicture>(picture);
    _requestRedraw();
  }

private:
  void performDraw(std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider) {
    if (_picture == nullptr) {
      return;
    }

    canvasProvider->renderToCanvas([=](SkCanvas *canvas) {
      // Make sure to scale correctly
      auto pd = _platformContext->getPixelDensity();
      canvas->save();
      canvas->scale(pd, pd);

      canvas->drawPicture(_picture->getObject());
    });
  }

  std::shared_ptr<ABI48_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<JsiSkPicture> _picture;
};

class ABI48_0_0RNSkPictureView : public ABI48_0_0RNSkView {
public:
  /**
   * Constructor
   */
  ABI48_0_0RNSkPictureView(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                  std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider)
      : ABI48_0_0RNSkView(
            context, canvasProvider,
            std::make_shared<ABI48_0_0RNSkPictureRenderer>(
                std::bind(&ABI48_0_0RNSkPictureView::requestRedraw, this), context)) {}

  void setJsiProperties(
      std::unordered_map<std::string, ABI48_0_0RNJsi::JsiValueWrapper> &props) override {

    ABI48_0_0RNSkView::setJsiProperties(props);

    for (auto &prop : props) {
      if (prop.first == "picture") {
        if (prop.second.isUndefinedOrNull()) {
          // Clear picture
          std::static_pointer_cast<ABI48_0_0RNSkPictureRenderer>(getRenderer())
              ->setPicture(nullptr);
          requestRedraw();
          continue;
        } else if (prop.second.getType() !=
                   ABI48_0_0RNJsi::JsiWrapperValueType::HostObject) {
          // We expect a function for the picture custom property
          throw std::runtime_error(
              "Expected an object for the picture custom property.");
        }

        // Save picture
        std::static_pointer_cast<ABI48_0_0RNSkPictureRenderer>(getRenderer())
            ->setPicture(prop.second.getAsHostObject());

        // Request redraw
        requestRedraw();
      }
    }
  }
};
} // namespace ABI48_0_0RNSkia
