#include <utility>

#include "RNSkJsView.h"

namespace RNSkia {

RNSkJsRenderer::RNSkJsRenderer(std::function<void()> requestRedraw,
                               std::shared_ptr<RNSkPlatformContext> context)
    : RNSkRenderer(requestRedraw),
      _jsiCanvas(std::make_shared<JsiSkCanvas>(context)),
      _platformContext(context),
      _infoObject(std::make_shared<RNSkInfoObject>()),
      _jsDrawingLock(std::make_shared<std::timed_mutex>()),
      _gpuDrawingLock(std::make_shared<std::timed_mutex>()),
      _jsTimingInfo("SKIA/JS"), _gpuTimingInfo("SKIA/GPU") {}

bool RNSkJsRenderer::tryRender(
    std::shared_ptr<RNSkCanvasProvider> canvasProvider) {
  // We render on the javascript thread.
  if (_jsDrawingLock->try_lock()) {
    _platformContext->runOnJavascriptThread(
        [weakSelf = weak_from_this(), canvasProvider]() {
          auto self = weakSelf.lock();
          if (self) {
            self->performDraw(canvasProvider);
          }
        });
    return true;
  } else {
#ifdef DEBUG
    _jsTimingInfo.markSkipped();
#endif
    return false;
  }
}

void RNSkJsRenderer::renderImmediate(
    std::shared_ptr<RNSkCanvasProvider> canvasProvider) {
  std::chrono::milliseconds ms =
      std::chrono::duration_cast<std::chrono::milliseconds>(
          std::chrono::system_clock::now().time_since_epoch());
  canvasProvider->renderToCanvas([&](SkCanvas *canvas) {
    // Create jsi canvas
    auto jsiCanvas = std::make_shared<JsiSkCanvas>(_platformContext);
    jsiCanvas->setCanvas(canvas);

    drawInJsiCanvas(std::move(jsiCanvas), canvasProvider->getScaledWidth(),
                    canvasProvider->getScaledHeight(), ms.count() / 1000);
  });
}

void RNSkJsRenderer::setDrawCallback(
    std::shared_ptr<jsi::Function> drawCallback) {
  _drawCallback = drawCallback;
}

std::shared_ptr<RNSkInfoObject> RNSkJsRenderer::getInfoObject() {
  return _infoObject;
}

void RNSkJsRenderer::performDraw(
    std::shared_ptr<RNSkCanvasProvider> canvasProvider) {
  // Start timing
  _jsTimingInfo.beginTiming();

  // Record the drawing operations on the JS thread so that we can
  // move the actual drawing onto the render thread later
  SkPictureRecorder recorder;
  SkRTreeFactory factory;
  SkCanvas *canvas =
      recorder.beginRecording(canvasProvider->getScaledWidth(),
                              canvasProvider->getScaledHeight(), &factory);

  _jsiCanvas->setCanvas(canvas);

  // Get current milliseconds
  std::chrono::milliseconds ms =
      std::chrono::duration_cast<std::chrono::milliseconds>(
          std::chrono::system_clock::now().time_since_epoch());

  try {
    // Perform the javascript drawing
    drawInJsiCanvas(_jsiCanvas, canvasProvider->getScaledWidth(),
                    canvasProvider->getScaledHeight(), ms.count() / 1000.0);

  } catch (...) {
    _jsTimingInfo.stopTiming();
    _jsDrawingLock->unlock();
    throw;
  }

  // Finish drawing operations
  auto p = recorder.finishRecordingAsPicture();

  _jsiCanvas->setCanvas(nullptr);

  // Calculate duration
  _jsTimingInfo.stopTiming();

  if (_gpuDrawingLock->try_lock()) {

    // Post drawing message to the render thread where the picture recorded
    // will be sent to the GPU/backend for rendering to screen.
    auto gpuLock = _gpuDrawingLock;
    _platformContext->runOnRenderThread([weakSelf = weak_from_this(),
                                         p = std::move(p), gpuLock,
                                         canvasProvider]() {
      auto self = weakSelf.lock();
      if (self) {
        // Draw the picture recorded on the real GPU canvas
        self->_gpuTimingInfo.beginTiming();

        canvasProvider->renderToCanvas(
            [p = std::move(p)](SkCanvas *canvas) { canvas->drawPicture(p); });

        self->_gpuTimingInfo.stopTiming();
      }
      // Unlock GPU drawing
      gpuLock->unlock();
    });
  } else {
#ifdef DEBUG
    _gpuTimingInfo.markSkipped();
#endif
    // Request a new redraw since the last frame was skipped.
    _requestRedraw();
  }

  // Unlock JS drawing
  _jsDrawingLock->unlock();
}

void RNSkJsRenderer::callJsDrawCallback(std::shared_ptr<JsiSkCanvas> jsiCanvas,
                                        int width, int height,
                                        double timestamp) {

  if (_drawCallback == nullptr) {
    return;
  }

  // Reset timing info
  _jsTimingInfo.reset();
  _gpuTimingInfo.reset();

  auto runtime = _platformContext->getJsRuntime();

  // Update info parameter
  _infoObject->beginDrawOperation(width, height, timestamp);

  // Set up arguments array
  std::vector<jsi::Value> args(2);
  args[0] = jsi::Object::createFromHostObject(*runtime, jsiCanvas);
  args[1] = jsi::Object::createFromHostObject(*runtime, _infoObject);

  // To be able to call the drawing function we'll wrap it once again
  _drawCallback->call(*runtime, static_cast<const jsi::Value *>(args.data()),
                      static_cast<size_t>(2));

  // Reset touches
  _infoObject->endDrawOperation();

  // Draw debug overlays
  if (getShowDebugOverlays()) {

    // Display average rendering timer
    auto jsAvg = _jsTimingInfo.getAverage();
    // auto jsFps = _jsTimingInfo.getFps();

    auto gpuAvg = _gpuTimingInfo.getAverage();
    // auto gpuFps = _gpuTimingInfo.getFps();

    auto total = jsAvg + gpuAvg;

    // Build string
    std::ostringstream stream;
    stream << "js: " << jsAvg << "ms gpu: " << gpuAvg << "ms "
           << " total: " << total << "ms";

    std::string debugString = stream.str();

    // Set up debug font/paints
    auto font = SkFont();
    font.setSize(14);
    auto paint = SkPaint();
    paint.setColor(SkColors::kRed);
    jsiCanvas->getCanvas()->drawSimpleText(
        debugString.c_str(), debugString.size(), SkTextEncoding::kUTF8, 8, 18,
        font, paint);
  }
}

void RNSkJsRenderer::drawInJsiCanvas(std::shared_ptr<JsiSkCanvas> jsiCanvas,
                                     int width, int height, double time) {

  // Call the draw drawCallback and perform js based drawing
  auto skCanvas = jsiCanvas->getCanvas();
  if (_drawCallback != nullptr && skCanvas != nullptr) {
    // Make sure to scale correctly
    auto pd = _platformContext->getPixelDensity();
    skCanvas->clear(SK_ColorTRANSPARENT);
    skCanvas->save();
    skCanvas->scale(pd, pd);

    // Call draw function.
    callJsDrawCallback(jsiCanvas, width / pd, height / pd, time);

    skCanvas->restore();
  }
}

} // namespace RNSkia
