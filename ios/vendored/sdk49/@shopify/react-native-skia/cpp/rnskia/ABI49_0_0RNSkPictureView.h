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

#include "JsiSkPicture.h"
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

namespace jsi = ABI49_0_0facebook::jsi;

class ABI49_0_0RNSkPictureRenderer
    : public ABI49_0_0RNSkRenderer,
      public std::enable_shared_from_this<ABI49_0_0RNSkPictureRenderer> {
public:
  ABI49_0_0RNSkPictureRenderer(std::function<void()> requestRedraw,
                      std::shared_ptr<ABI49_0_0RNSkPlatformContext> context)
      : ABI49_0_0RNSkRenderer(requestRedraw), _platformContext(context) {}

  bool tryRender(std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider) override {
    return performDraw(canvasProvider);
  }

  void
  renderImmediate(std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider) override {
    performDraw(canvasProvider);
  }

  void setPicture(std::shared_ptr<jsi::HostObject> picture) {
    if (picture == nullptr) {
      _picture = nullptr;
    } else {
      _picture = std::dynamic_pointer_cast<JsiSkPicture>(picture);
    }
    _requestRedraw();
  }

private:
  bool performDraw(std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider) {
    canvasProvider->renderToCanvas([=](SkCanvas *canvas) {
      // Make sure to scale correctly
      auto pd = _platformContext->getPixelDensity();
      canvas->clear(SK_ColorTRANSPARENT);
      canvas->save();
      canvas->scale(pd, pd);

      if (_picture != nullptr) {
        canvas->drawPicture(_picture->getObject());
      }

      canvas->restore();
    });
    return true;
  }

  std::shared_ptr<ABI49_0_0RNSkPlatformContext> _platformContext;
  std::shared_ptr<JsiSkPicture> _picture;
};

class ABI49_0_0RNSkPictureView : public ABI49_0_0RNSkView {
public:
  /**
   * Constructor
   */
  ABI49_0_0RNSkPictureView(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
                  std::shared_ptr<ABI49_0_0RNSkCanvasProvider> canvasProvider)
      : ABI49_0_0RNSkView(
            context, canvasProvider,
            std::make_shared<ABI49_0_0RNSkPictureRenderer>(
                std::bind(&ABI49_0_0RNSkPictureView::requestRedraw, this), context)) {}

  void setJsiProperties(
      std::unordered_map<std::string, ABI49_0_0RNJsi::JsiValueWrapper> &props) override {

    ABI49_0_0RNSkView::setJsiProperties(props);

    for (auto &prop : props) {
      if (prop.first == "picture") {
        if (prop.second.isUndefinedOrNull()) {
          // Clear picture
          std::static_pointer_cast<ABI49_0_0RNSkPictureRenderer>(getRenderer())
              ->setPicture(nullptr);
          continue;
        } else if (prop.second.getType() !=
                   ABI49_0_0RNJsi::JsiWrapperValueType::HostObject) {
          // We expect a function for the picture custom property
          throw std::runtime_error(
              "Expected an object for the picture custom property.");
        }

        // Save picture
        std::static_pointer_cast<ABI49_0_0RNSkPictureRenderer>(getRenderer())
            ->setPicture(prop.second.getAsHostObject());
      }
    }
  }
};
} // namespace ABI49_0_0RNSkia
