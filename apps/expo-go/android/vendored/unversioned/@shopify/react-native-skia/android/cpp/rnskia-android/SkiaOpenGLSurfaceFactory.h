#pragma once

#include <RNSkLog.h>

#include <fbjni/fbjni.h>
#include <jni.h>

#include <android/native_window_jni.h>
#include <condition_variable>
#include <memory>
#include <thread>
#include <unordered_map>

#include "SkiaOpenGLHelper.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkCanvas.h"
#include "SkColorSpace.h"
#include "SkSurface.h"
#include "include/gpu/GrBackendSurface.h"
#include "include/gpu/GrDirectContext.h"
#include "include/gpu/ganesh/SkSurfaceGanesh.h"
#include "include/gpu/gl/GrGLInterface.h"

#pragma clang diagnostic pop

namespace RNSkia {

/**
 * Holder of the thread local SkiaOpenGLContext member
 */
class ThreadContextHolder {
public:
  static thread_local SkiaOpenGLContext ThreadSkiaOpenGLContext;
};

/**
 * Holder of the Windowed SkSurface with support for making current
 * and presenting to screen
 */
class WindowSurfaceHolder {
public:
  WindowSurfaceHolder(jobject surface, int width, int height)
      : _width(width), _height(height),
        _window(ANativeWindow_fromSurface(facebook::jni::Environment::current(),
                                          surface)) {}

  ~WindowSurfaceHolder() { ANativeWindow_release(_window); }

  int getWidth() { return _width; }
  int getHeight() { return _height; }

  /*
   * Ensures that the holder has a valid surface and returns the surface.
   */
  sk_sp<SkSurface> getSurface();

  /**
   * Resizes the surface
   * @param width
   * @param height
   */
  void resize(int width, int height) {
    _width = width;
    _height = height;
    _skSurface = nullptr;
  }

  /**
   * Sets the current surface as the active surface
   * @return true if make current succeeds
   */
  bool makeCurrent() {
    return SkiaOpenGLHelper::makeCurrent(
        &ThreadContextHolder::ThreadSkiaOpenGLContext, _glSurface);
  }

  /**
   * Presents the current drawing operations by swapping buffers
   * @return true if make current succeeds
   */
  bool present() {
    // Flush and submit the direct context
    ThreadContextHolder::ThreadSkiaOpenGLContext.directContext
        ->flushAndSubmit();

    // Swap buffers
    return SkiaOpenGLHelper::swapBuffers(
        &ThreadContextHolder::ThreadSkiaOpenGLContext, _glSurface);
  }

private:
  ANativeWindow *_window = nullptr;
  sk_sp<SkSurface> _skSurface = nullptr;
  EGLSurface _glSurface = EGL_NO_SURFACE;
  int _width = 0;
  int _height = 0;
};

class SkiaOpenGLSurfaceFactory {
public:
  /**
   * Creates a new Skia surface that is backed by a texture.
   * @param width Width of surface
   * @param height Height of surface
   * @return An SkSurface backed by a texture.
   */
  static sk_sp<SkSurface> makeOffscreenSurface(int width, int height);

  /**
   * Creates a windowed Skia Surface holder.
   * @param width Initial width of surface
   * @param height Initial height of surface
   * @param window Window coming from Java
   * @return A Surface holder
   */
  static std::unique_ptr<WindowSurfaceHolder>
  makeWindowedSurface(jobject window, int width, int height) {
    return std::make_unique<WindowSurfaceHolder>(window, width, height);
  }
};

} // namespace RNSkia