#pragma once

#include <RNSkLog.h>

#include "EGL/egl.h"
#include "GLES2/gl2.h"
#include "android/native_window.h"
#include <fbjni/fbjni.h>
#include <jni.h>

#include <condition_variable>
#include <memory>
#include <thread>
#include <unordered_map>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkCanvas.h"
#include "SkColorSpace.h"
#include "SkPicture.h"
#include "SkSurface.h"
#include "include/gpu/GrDirectContext.h"
#include "include/gpu/gl/GrGLInterface.h"

#pragma clang diagnostic pop

namespace RNSkia {
sk_sp<SkSurface> MakeOffscreenGLSurface(int width, int height);

using OpenGLDrawingContext = struct {
  EGLContext glContext;
  EGLDisplay glDisplay;
  EGLConfig glConfig;
  sk_sp<GrDirectContext> skContext;
};

static std::unordered_map<std::thread::id,
                          std::shared_ptr<OpenGLDrawingContext>>
    threadContexts;

enum RenderState : int {
  Initializing,
  Rendering,
  Finishing,
  Done,
};

class SkiaOpenGLRenderer {
public:
  explicit SkiaOpenGLRenderer(jobject surface);
  ~SkiaOpenGLRenderer();

  /**
   * Initializes, renders and tears down the render pipeline depending on the
   * state of the renderer. All OpenGL/Skia context operations are done on a
   * separate thread which must be the same for all calls to the render method.
   *
   * @param callback Render callback
   * @param width Width of surface to render if there is a picture
   * @param height Height of surface to render if there is a picture
   */
  bool run(const std::function<void(SkCanvas *)> &cb, int width, int height);

  /**
   * Sets the state to finishing. Next time the renderer will be called it
   * will tear down and release its resources. It is important that this
   * is done on the same thread as the other OpenGL context stuff is handled.
   *
   * Teardown can be called fom whatever thread we want - but we must ensure
   * that at least one call to render on the render thread is done after calling
   * teardown.
   */
  void teardown();

private:
  /**
   * Initializes all required OpenGL and Skia objects
   * @return True if initialization went well.
   */
  bool ensureInitialised();

  /**
   * Initializes the static OpenGL context that is shared between
   * all instances of the renderer.
   * @return True if initialization went well
   */
  bool initStaticGLContext();

  /**
   * Initializes the static Skia context that is shared between
   * all instances of the renderer
   * @return True if initialization went well
   */
  bool initStaticSkiaContext();

  /**
   * Inititalizes the OpenGL surface from the native view pointer we
   * got on initialization. Each renderer has its own OpenGL surface to
   * render on.
   * @return True if initialization went well
   */
  bool initGLSurface();

  /**
   * To be able to use static contexts (and avoid reloading the skia context for
   * each new view, we track the OpenGL and Skia drawing context per thread.
   * @return The drawing context for the current thread
   */
  static std::shared_ptr<OpenGLDrawingContext> getThreadDrawingContext();

  EGLSurface _glSurface = EGL_NO_SURFACE;

  ANativeWindow *_nativeWindow = nullptr;

  int _prevWidth = 0;
  int _prevHeight = 0;

  std::atomic<RenderState> _renderState = {RenderState::Initializing};
};
} // namespace RNSkia