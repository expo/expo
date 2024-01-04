#pragma once

#include <memory>
#include <string>
#include <vector>

#include <RNSkJsView.h>
#include <RNSkOpenGLCanvasProvider.h>
#include <android/native_window.h>

namespace RNSkia {

class RNSkBaseAndroidView {
public:
  virtual void surfaceAvailable(jobject surface, int width, int height) = 0;

  virtual void surfaceDestroyed() = 0;

  virtual void surfaceSizeChanged(int width, int height) = 0;

  virtual float getPixelDensity() = 0;

  virtual void updateTouchPoints(jni::JArrayDouble touches) = 0;

  virtual void setMode(std::string mode) = 0;

  virtual void setShowDebugInfo(bool show) = 0;

  virtual void viewDidUnmount() = 0;

  virtual std::shared_ptr<RNSkView> getSkiaView() = 0;
};

template <typename T>
class RNSkAndroidView : public T, public RNSkBaseAndroidView {
public:
  explicit RNSkAndroidView(std::shared_ptr<RNSkia::RNSkPlatformContext> context)
      : T(context,
          std::make_shared<RNSkOpenGLCanvasProvider>(
              std::bind(&RNSkia::RNSkView::requestRedraw, this), context)) {}

  void surfaceAvailable(jobject surface, int width, int height) override {
    std::static_pointer_cast<RNSkOpenGLCanvasProvider>(T::getCanvasProvider())
        ->surfaceAvailable(surface, width, height);

    // Try to render directly when the surface has been set so that
    // we don't have to wait until the draw loop returns.
    RNSkView::renderImmediate();
  }

  void surfaceDestroyed() override {
    std::static_pointer_cast<RNSkOpenGLCanvasProvider>(T::getCanvasProvider())
        ->surfaceDestroyed();
  }

  void surfaceSizeChanged(int width, int height) override {
    std::static_pointer_cast<RNSkOpenGLCanvasProvider>(T::getCanvasProvider())
        ->surfaceSizeChanged(width, height);
  }

  float getPixelDensity() override {
    return T::getPlatformContext()->getPixelDensity();
  }

  void setMode(std::string mode) override {
    if (mode.compare("continuous") == 0) {
      T::setDrawingMode(RNSkDrawingMode::Continuous);
    } else {
      T::setDrawingMode(RNSkDrawingMode::Default);
    }
  }

  void setShowDebugInfo(bool show) override { T::setShowDebugOverlays(show); }

  void viewDidUnmount() override { T::endDrawingLoop(); }

  void updateTouchPoints(jni::JArrayDouble touches) override {
    // Create touch points
    std::vector<RNSkia::RNSkTouchInfo> points;
    auto pin = touches.pin();
    auto scale = getPixelDensity();
    points.reserve(pin.size() / 5);
    for (size_t i = 0; i < pin.size(); i += 5) {
      RNSkTouchInfo point;
      point.x = pin[i] / scale;
      point.y = pin[i + 1] / scale;
      point.force = pin[i + 2];
      point.type = (RNSkia::RNSkTouchInfo::TouchType)pin[i + 3];
      point.id = pin[i + 4];
      points.push_back(point);
    }
    T::updateTouchState(points);
  }

  std::shared_ptr<RNSkView> getSkiaView() override {
    return T::shared_from_this();
  }
};
} // namespace RNSkia
