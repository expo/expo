#include <RNSkOpenGLCanvasProvider.h>

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkCanvas.h"
#include "SkSurface.h"

#pragma clang diagnostic pop

namespace RNSkia {

RNSkOpenGLCanvasProvider::RNSkOpenGLCanvasProvider(
    std::function<void()> requestRedraw,
    std::shared_ptr<RNSkia::RNSkPlatformContext> context)
    : RNSkCanvasProvider(requestRedraw), _context(context) {}

RNSkOpenGLCanvasProvider::~RNSkOpenGLCanvasProvider() {}

float RNSkOpenGLCanvasProvider::getScaledWidth() { return _width; }

float RNSkOpenGLCanvasProvider::getScaledHeight() { return _height; }

bool RNSkOpenGLCanvasProvider::renderToCanvas(
    const std::function<void(SkCanvas *)> &cb) {
  if (_renderer != nullptr) {
    return _renderer->run(cb, _width, _height);
  }
  return false;
}

void RNSkOpenGLCanvasProvider::surfaceAvailable(jobject surface, int width,
                                                int height) {
  _width = width;
  _height = height;

  if (_renderer == nullptr) {
    // Create renderer!
    _renderer = std::make_unique<SkiaOpenGLRenderer>(surface);

    // Redraw
    _requestRedraw();
  }
}
void RNSkOpenGLCanvasProvider::surfaceDestroyed() {
  if (_renderer != nullptr) {
    // teardown
    _renderer->teardown();

    // Teardown renderer on the render thread since OpenGL demands
    // same thread access for OpenGL contexts.
    std::condition_variable cv;
    std::mutex m;
    std::unique_lock<std::mutex> lock(m);

    _context->runOnRenderThread([&cv, &m, weakSelf = weak_from_this()]() {
      // Lock
      std::unique_lock<std::mutex> lock(m);

      auto self = weakSelf.lock();
      if (self) {
        if (self->_renderer != nullptr) {
          self->_renderer->run(nullptr, 0, 0);
        }
        // Remove renderer
        self->_renderer = nullptr;
      }
      cv.notify_one();
    });

    cv.wait(lock);
  }
}

void RNSkOpenGLCanvasProvider::surfaceSizeChanged(int width, int height) {
  if (width == 0 && height == 0) {
    // Setting width/height to zero is nothing we need to care about when
    // it comes to invalidating the surface.
    return;
  }
  _width = width;
  _height = height;

  // Redraw after size change
  _requestRedraw();
}
} // namespace RNSkia
