#pragma once

#include <fbjni/fbjni.h>

#include <memory>

#include <RNSkJsView.h>

#include "SkiaOpenGLSurfaceFactory.h"
#include <android/native_window.h>

namespace RNSkia {

class RNSkOpenGLCanvasProvider
    : public RNSkia::RNSkCanvasProvider,
      public std::enable_shared_from_this<RNSkOpenGLCanvasProvider> {
public:
  RNSkOpenGLCanvasProvider(
      std::function<void()> requestRedraw,
      std::shared_ptr<RNSkia::RNSkPlatformContext> platformContext);

  ~RNSkOpenGLCanvasProvider();

  float getScaledWidth() override;

  float getScaledHeight() override;

  bool renderToCanvas(const std::function<void(SkCanvas *)> &cb) override;

  void surfaceAvailable(jobject surface, int width, int height);

  void surfaceDestroyed();

  void surfaceSizeChanged(int width, int height);

private:
  std::unique_ptr<WindowSurfaceHolder> _surfaceHolder = nullptr;
  std::shared_ptr<RNSkPlatformContext> _platformContext;
};
} // namespace RNSkia
