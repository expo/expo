#pragma once

#include "DrawingProp.h"
#include "JsiDomDrawingNode.h"

#include "JsiSkCanvas.h"
#include "JsiSkPaint.h"

#include <memory>
#include <mutex>
#include <utility>

namespace RNSkia {

class JsiCustomDrawingNode : public JsiDomDrawingNode,
                             public JsiDomNodeCtor<JsiCustomDrawingNode> {
public:
  explicit JsiCustomDrawingNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skCustomDrawing") {}

protected:
  void draw(DrawingContext *context) override {
    if (_drawing != nullptr) {

      // Only repaint the picture IF we did not get to the draw function
      // from a redrawRequest after creating the picture!
      if (!_inRedrawCycle || _drawingProp->isChanged()) {

        float scaledWidth = context->getScaledWidth();
        float scaledHeight = context->getScaledHeight();
        auto paint = context->getPaint();
        auto platformContext = getContext();
        auto requestRedraw = context->getRequestRedraw();

        // Create/set the paint/canvas wrappers
        if (_jsiPaint == nullptr) {
          _jsiPaint = std::make_shared<JsiSkPaint>(getContext(), *paint);
        } else {
          _jsiPaint->fromPaint(*paint);
        }

        if (_jsiCanvas == nullptr) {
          _jsiCanvas = std::make_shared<JsiSkCanvas>(getContext());
        }

        // Run rendering on the javascript thread
        getContext()->runOnJavascriptThread([this, platformContext,
                                             requestRedraw, scaledWidth,
                                             scaledHeight]() {
          // Get the runtime
          auto runtime = platformContext->getJsRuntime();

          // Create the picture recorder
          SkPictureRecorder recorder;
          SkRTreeFactory factory;
          SkCanvas *canvas =
              recorder.beginRecording(scaledWidth, scaledHeight, &factory);

          auto jsiCanvas =
              std::make_shared<JsiSkCanvas>(platformContext, canvas);

          // Create context wrapper
          auto jsiCtx = jsi::Object(*runtime);
          jsiCtx.setProperty(
              *runtime, "paint",
              jsi::Object::createFromHostObject(*runtime, this->_jsiPaint));

          jsiCtx.setProperty(
              *runtime, "canvas",
              jsi::Object::createFromHostObject(*runtime, jsiCanvas));

          std::array<jsi::Value, 1> args;
          args[0] = std::move(jsiCtx);

          // Draw
          _drawing(*runtime, jsi::Value::undefined(),
                   static_cast<const jsi::Value *>(args.data()), 1);

          auto picture = recorder.finishRecordingAsPicture();
          {
            // Lock access to the picture property's setter
            std::lock_guard<std::mutex> lock(_pictureLock);
            this->_drawingProp->setPicture(picture);
          }

          // Ask view to redraw itself
          _inRedrawCycle = true;
          requestRedraw();
        });
      }
    }

    if (_drawingProp->isSet()) {
      std::lock_guard<std::mutex> lock(_pictureLock);
      context->getCanvas()->drawPicture(_drawingProp->getDerivedValue());
      _inRedrawCycle = false;
    }
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);

    NotifyNeedRenderCallback cb =
        std::bind(&JsiCustomDrawingNode::notifyPictureNeeded, this,
                  std::placeholders::_1);

    _drawingProp = container->defineProperty<DrawingProp>("drawing", cb);
  }

private:
  void notifyPictureNeeded(jsi::HostFunctionType drawing) {
    _drawing = drawing;
  }

  jsi::HostFunctionType _drawing;

  DrawingProp *_drawingProp;

  std::array<jsi::Value, 1> _argsCache;
  std::shared_ptr<JsiSkPaint> _jsiPaint;
  std::shared_ptr<JsiSkCanvas> _jsiCanvas;

  std::atomic<bool> _inRedrawCycle = {false};
  std::mutex _pictureLock;
};

} // namespace RNSkia
