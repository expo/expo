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
    std::shared_ptr<RNSkia::RNSkPlatformContext> platformContext)
    : RNSkCanvasProvider(requestRedraw), _platformContext(platformContext) {}

RNSkOpenGLCanvasProvider::~RNSkOpenGLCanvasProvider() {}

float RNSkOpenGLCanvasProvider::getScaledWidth() {
  return _surfaceHolder ? _surfaceHolder->getWidth() : 0;
}

float RNSkOpenGLCanvasProvider::getScaledHeight() {
  return _surfaceHolder ? _surfaceHolder->getHeight() : 0;
}

bool RNSkOpenGLCanvasProvider::renderToCanvas(
    const std::function<void(SkCanvas *)> &cb) {

  if (_surfaceHolder != nullptr && cb != nullptr) {
    // Get the surface
    auto surface = _surfaceHolder->getSurface();
    if (surface) {

      // Ensure we are ready to render
      if (!_surfaceHolder->makeCurrent()) {
        return false;
      }

      // Draw into canvas using callback
      cb(surface->getCanvas());

      // Swap buffers and show on screen
      return _surfaceHolder->present();

    } else {
      // the render context did not provide a surface
      return false;
    }
  }

  return false;
}

void RNSkOpenGLCanvasProvider::surfaceAvailable(jobject surface, int width,
                                                int height) {
  // Create renderer!
  _surfaceHolder =
      SkiaOpenGLSurfaceFactory::makeWindowedSurface(surface, width, height);

  // Post redraw request to ensure we paint in the next draw cycle.
  _requestRedraw();
}
void RNSkOpenGLCanvasProvider::surfaceDestroyed() {
  // destroy the renderer (a unique pointer so the dtor will be called
  // immediately.)
  _surfaceHolder = nullptr;
}

void RNSkOpenGLCanvasProvider::surfaceSizeChanged(int width, int height) {
  if (width == 0 && height == 0) {
    // Setting width/height to zero is nothing we need to care about when
    // it comes to invalidating the surface.
    return;
  }

  // Recreate RenderContext surface based on size change???
  _surfaceHolder->resize(width, height);

  // Redraw after size change
  _requestRedraw();
}
} // namespace RNSkia
