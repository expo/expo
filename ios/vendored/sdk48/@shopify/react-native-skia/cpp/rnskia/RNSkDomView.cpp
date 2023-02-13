#include "ABI48_0_0RNSkDomView.h"
#include "DrawingContext.h"

#include <chrono>
#include <utility>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkFont.h>

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

ABI48_0_0RNSkDomRenderer::ABI48_0_0RNSkDomRenderer(std::function<void()> requestRedraw,
                                 std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
    : ABI48_0_0RNSkRenderer(requestRedraw), _platformContext(std::move(context)),
      _renderLock(std::make_shared<std::timed_mutex>()),
      _touchCallbackLock(std::make_shared<std::timed_mutex>()),
      _renderTimingInfo("SKIA/RENDER") {}

ABI48_0_0RNSkDomRenderer::~ABI48_0_0RNSkDomRenderer() {
  if (_root != nullptr) {
    _root->dispose();
    _root = nullptr;
  }
}

bool ABI48_0_0RNSkDomRenderer::tryRender(
    std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider) {
  // If we have touches we need to call the touch callback as well
  if (_currentTouches.size() > 0) {
    callOnTouch();
  }

  // We render on the main thread
  if (_renderLock->try_lock()) {
    // If we have a Dom Node we can render directly on the main thread
    if (_root != nullptr) {
      canvasProvider->renderToCanvas(std::bind(
          &ABI48_0_0RNSkDomRenderer::renderCanvas, this, std::placeholders::_1,
          canvasProvider->getScaledWidth(), canvasProvider->getScaledHeight()));
    }

    _renderLock->unlock();
    return true;
  } else {
    return false;
  }
}

void ABI48_0_0RNSkDomRenderer::renderImmediate(
    std::shared_ptr<ABI48_0_0RNSkCanvasProvider> canvasProvider) {
  auto prevDebugOverlay = getShowDebugOverlays();
  setShowDebugOverlays(false);
  canvasProvider->renderToCanvas(std::bind(
      &ABI48_0_0RNSkDomRenderer::renderCanvas, this, std::placeholders::_1,
      canvasProvider->getScaledWidth(), canvasProvider->getScaledHeight()));
  setShowDebugOverlays(prevDebugOverlay);
}

void ABI48_0_0RNSkDomRenderer::setRoot(std::shared_ptr<JsiDomRenderNode> node) {
  std::lock_guard<std::mutex> lock(_rootLock);
  if (_root != nullptr) {
    _root->dispose();
    _root = nullptr;
  }
  _root = node;
}

void ABI48_0_0RNSkDomRenderer::setOnTouchCallback(
    std::shared_ptr<jsi::Function> onTouchCallback) {
  _touchCallback = onTouchCallback;
}

void ABI48_0_0RNSkDomRenderer::renderCanvas(SkCanvas *canvas, float scaledWidth,
                                   float scaledHeight) {
  _renderTimingInfo.beginTiming();

  auto pd = _platformContext->getPixelDensity();

  canvas->save();
  canvas->scale(pd, pd);

  if (_drawingContext == nullptr) {
    auto paint = std::make_shared<SkPaint>();
    paint->setAntiAlias(true);
    _drawingContext = std::make_shared<DrawingContext>(paint);

    _drawingContext->setRequestRedraw([weakSelf = weak_from_this()]() {
      auto self = weakSelf.lock();
      if (self) {
        self->_requestRedraw();
      }
    });
  }

  _drawingContext->setScaledWidth(scaledWidth);
  _drawingContext->setScaledHeight(scaledHeight);

  // Update canvas before drawing
  _drawingContext->setCanvas(canvas);

  try {
    // Ask the root node to render to the provided canvas
    std::lock_guard<std::mutex> lock(_rootLock);
    if (_root != nullptr) {
      _root->commitPendingChanges();
      _root->render(_drawingContext.get());
      _root->resetPendingChanges();
    }
  } catch (std::runtime_error err) {
    _platformContext->raiseError(err);
  } catch (jsi::JSError err) {
    _platformContext->raiseError(err);
  } catch (...) {
    _platformContext->raiseError(
        std::runtime_error("Error rendering the Skia view."));
  }

  renderDebugOverlays(canvas);

  canvas->restore();

  _renderTimingInfo.stopTiming();
}

void ABI48_0_0RNSkDomRenderer::updateTouches(std::vector<ABI48_0_0RNSkTouchInfo> &touches) {
  std::lock_guard<std::mutex> lock(_touchMutex);
  // Add timestamp
  auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch())
                .count();

  for (size_t i = 0; i < touches.size(); i++) {
    touches.at(i).timestamp = ms;
  }
  _currentTouches.push_back(std::move(touches));
}

void ABI48_0_0RNSkDomRenderer::callOnTouch() {

  if (_touchCallback == nullptr) {
    return;
  }

  if (_touchCallbackLock->try_lock()) {

    {
      std::lock_guard<std::mutex> lock(_touchMutex);
      _touchesCache.clear();
      _touchesCache.reserve(_currentTouches.size());
      for (size_t i = 0; i < _currentTouches.size(); ++i) {
        _touchesCache.push_back(_currentTouches.at(i));
      }
      _currentTouches.clear();
    }

    // We have an onDraw method - use it to render since we don't have a
    // DOM-node yet.
    _platformContext->runOnJavascriptThread([weakSelf = weak_from_this()]() {
      auto self = weakSelf.lock();
      if (self) {
        jsi::Runtime &runtime = *self->_platformContext->getJsRuntime();
        // Set up touches
        auto size = self->_touchesCache.size();
        auto ops = jsi::Array(runtime, size);
        for (size_t i = 0; i < size; i++) {
          auto cur = self->_touchesCache.at(i);
          auto curSize = cur.size();
          auto touches = jsi::Array(runtime, curSize);
          for (size_t n = 0; n < curSize; n++) {
            auto touchObj = jsi::Object(runtime);
            auto t = cur.at(n);
            touchObj.setProperty(runtime, "x", t.x);
            touchObj.setProperty(runtime, "y", t.y);
            touchObj.setProperty(runtime, "force", t.force);
            touchObj.setProperty(runtime, "type", static_cast<double>(t.type));
            touchObj.setProperty(runtime, "timestamp",
                                 static_cast<double>(t.timestamp) / 1000.0);
            touchObj.setProperty(runtime, "id", static_cast<double>(t.id));
            touches.setValueAtIndex(runtime, n, touchObj);
          }
          ops.setValueAtIndex(runtime, i, touches);
        }
        // Call on touch callback
        self->_touchCallback->call(runtime, ops, 1);
      }
      self->_touchCallbackLock->unlock();
    });
  } else {
    // We'll try next time - schedule a new redraw
    _requestRedraw();
  }
}

void ABI48_0_0RNSkDomRenderer::renderDebugOverlays(SkCanvas *canvas) {
  if (!getShowDebugOverlays()) {
    return;
  }
  auto renderAvg = _renderTimingInfo.getAverage();
  auto fps = _renderTimingInfo.getFps();

  // Build string
  std::ostringstream stream;
  stream << "render: " << renderAvg << "ms"
         << " fps: " << fps;

  std::string debugString = stream.str();

  // Set up debug font/paints
  auto font = SkFont();
  font.setSize(14);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawSimpleText(debugString.c_str(), debugString.size(),
                         SkTextEncoding::kUTF8, 8, 18, font, paint);
}

} // namespace ABI48_0_0RNSkia
