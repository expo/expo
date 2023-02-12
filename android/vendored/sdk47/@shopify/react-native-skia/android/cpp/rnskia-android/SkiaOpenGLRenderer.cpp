#include "SkiaOpenGLRenderer.h"

#include <RNSkLog.h>
#include <android/native_window.h>
#include <android/native_window_jni.h>

namespace RNSkia
{
    /** Static members */
    std::shared_ptr<DrawingContext> SkiaOpenGLRenderer::getThreadDrawingContext()
    {
        auto threadId = std::this_thread::get_id();
        if (threadContexts.count(threadId) == 0)
        {
            auto drawingContext = std::make_shared<DrawingContext>();
            drawingContext->glContext = EGL_NO_CONTEXT;
            drawingContext->glDisplay = EGL_NO_DISPLAY;
            drawingContext->glConfig = 0;
            drawingContext->skContext = nullptr;
            threadContexts.emplace(threadId, drawingContext);
        }
        return threadContexts.at(threadId);
    }

    SkiaOpenGLRenderer::SkiaOpenGLRenderer(jobject surface) {
      _nativeWindow = ANativeWindow_fromSurface(facebook::jni::Environment::current(), surface);
    }

    SkiaOpenGLRenderer::~SkiaOpenGLRenderer() {
      // Release surface
      ANativeWindow_release(_nativeWindow);
      _nativeWindow = nullptr;
    }

    void SkiaOpenGLRenderer::run(const std::function<void(SkCanvas *)> &cb, int width, int height)
    {
        switch (_renderState)
        {
        case RenderState::Initializing:
        {
            _renderState = RenderState::Rendering;
            // Just let the case drop to drawing - we have initialized
            // and we should be able to render (if the picture is set)
        }
        case RenderState::Rendering:
        {
            // Make sure to initialize the rendering pipeline
            if (!ensureInitialised())
            {
                break;
            }

            // Ensure we have the Skia surface to draw on. We need to
            // pass width and height since the surface will be recreated
            // when the view is resized.
            if (!ensureSkiaSurface(width, height))
            {
                return;
            }

            if (cb != nullptr)
            {
                // Reset Skia Context since it might be modified by another Skia View during
                // rendering.
                getThreadDrawingContext()->skContext->resetContext();

                // Clear with transparent
                glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
                glClear(GL_COLOR_BUFFER_BIT);

                // Draw picture into surface
                cb(_skSurface->getCanvas());

                // Flush
                _skSurface->flush();

                if (!eglSwapBuffers(getThreadDrawingContext()->glDisplay, _glSurface))
                {
                    RNSkLogger::logToConsole(
                        "eglSwapBuffers failed: %d\n", eglGetError());
                }
            }
            break;
        }
        case RenderState::Finishing:
        {
            _renderState = RenderState::Done;

            // Release GL surface
            if (_glSurface != EGL_NO_SURFACE && getThreadDrawingContext()->glDisplay != EGL_NO_DISPLAY)
            {
                eglDestroySurface(getThreadDrawingContext()->glDisplay, _glSurface);
              _glSurface = EGL_NO_SURFACE;
            }

            // Release Skia Surface
            _skSurface = nullptr;

            break;
        }
        case RenderState::Done:
        {
            // Do nothing. We're done.
            break;
        }
        }
    }

    bool SkiaOpenGLRenderer::ensureInitialised()
    {
        // Set up static OpenGL context
        if (!initStaticGLContext())
        {
            return false;
        }

        // Set up OpenGL Surface
        if (!initGLSurface())
        {
            return false;
        }

        // Init skia static context
        if (!initStaticSkiaContext())
        {
            return false;
        }

        return true;
    }

    void SkiaOpenGLRenderer::teardown()
    {
        _renderState = RenderState::Finishing;
    }

    bool SkiaOpenGLRenderer::initStaticGLContext()
    {
        if (getThreadDrawingContext()->glContext != EGL_NO_CONTEXT)
        {
            return true;
        }

        getThreadDrawingContext()->glDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
        if (getThreadDrawingContext()->glDisplay == EGL_NO_DISPLAY)
        {
            RNSkLogger::logToConsole("eglGetdisplay failed : %i", glGetError());
            return false;
        }

        EGLint major;
        EGLint minor;
        if (!eglInitialize(getThreadDrawingContext()->glDisplay, &major, &minor))
        {
            RNSkLogger::logToConsole("eglInitialize failed : %i", glGetError());
            return false;
        }

        EGLint att[] = {
            EGL_RENDERABLE_TYPE,
            EGL_OPENGL_ES2_BIT,
            EGL_SURFACE_TYPE,
            EGL_WINDOW_BIT,
            EGL_ALPHA_SIZE,
            8,
            EGL_BLUE_SIZE,
            8,
            EGL_GREEN_SIZE,
            8,
            EGL_RED_SIZE,
            8,
            EGL_DEPTH_SIZE,
            0,
            EGL_STENCIL_SIZE,
            0,
            EGL_NONE};

        EGLint numConfigs;
        getThreadDrawingContext()->glConfig = 0;
        if (!eglChooseConfig(getThreadDrawingContext()->glDisplay, att, &getThreadDrawingContext()->glConfig, 1, &numConfigs) ||
            numConfigs == 0)
        {
            RNSkLogger::logToConsole(
                "Failed to choose a config %d\n", eglGetError());
            return false;
        }

        EGLint contextAttribs[] = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE};

        getThreadDrawingContext()->glContext = eglCreateContext(
            getThreadDrawingContext()->glDisplay,
            getThreadDrawingContext()->glConfig,
            NULL,
            contextAttribs);

        if (getThreadDrawingContext()->glContext == EGL_NO_CONTEXT)
        {
            RNSkLogger::logToConsole(
                "eglCreateContext failed: %d\n", eglGetError());
            return false;
        }

        return true;
    }

    bool SkiaOpenGLRenderer::initStaticSkiaContext()
    {
        if (getThreadDrawingContext()->skContext != nullptr)
        {
            return true;
        }

        // Create the Skia backend context
        auto backendInterface = GrGLMakeNativeInterface();
        getThreadDrawingContext()->skContext = GrDirectContext::MakeGL(backendInterface);
        if (getThreadDrawingContext()->skContext == nullptr)
        {
            RNSkLogger::logToConsole("GrDirectContext::MakeGL failed");
            return false;
        }

        return true;
    }

    bool SkiaOpenGLRenderer::initGLSurface()
    {
        if (_nativeWindow == nullptr)
        {
            return false;
        }

        if (_glSurface != EGL_NO_SURFACE)
        {
            if (!eglMakeCurrent(
                    getThreadDrawingContext()->glDisplay,
                    _glSurface,
                    _glSurface,
                    getThreadDrawingContext()->glContext))
            {
                RNSkLogger::logToConsole(
                    "eglMakeCurrent failed: %d\n", eglGetError());
                return false;
            }
            return true;
        }

        // Create the opengl surface
        _glSurface =
            eglCreateWindowSurface(
                getThreadDrawingContext()->glDisplay,
                getThreadDrawingContext()->glConfig,
                _nativeWindow,
                nullptr);

        if (_glSurface == EGL_NO_SURFACE)
        {
            RNSkLogger::logToConsole(
                "eglCreateWindowSurface failed: %d\n", eglGetError());
            return false;
        }

        if (!eglMakeCurrent(
                getThreadDrawingContext()->glDisplay,
                _glSurface,
                _glSurface,
                getThreadDrawingContext()->glContext))
        {
            RNSkLogger::logToConsole("eglMakeCurrent failed: %d\n", eglGetError());
            return false;
        }

        return true;
    }

    bool SkiaOpenGLRenderer::ensureSkiaSurface(int width, int height)
    {
        if (getThreadDrawingContext()->skContext == nullptr)
        {
            return false;
        }

        if (_skSurface == nullptr ||
            !_skRenderTarget.isValid() ||
            _prevWidth != width ||
            _prevHeight != height)
        {
            glViewport(0, 0, width, height);

            _prevWidth = width;
            _prevHeight = height;

            GLint buffer;
            glGetIntegerv(GL_FRAMEBUFFER_BINDING, &buffer);

            GLint stencil;
            glGetIntegerv(GL_STENCIL_BITS, &stencil);

            GLint samples;
            glGetIntegerv(GL_SAMPLES, &samples);

            auto maxSamples = getThreadDrawingContext()->skContext->maxSurfaceSampleCountForColorType(
                kRGBA_8888_SkColorType);

            if (samples > maxSamples)
                samples = maxSamples;

            GrGLFramebufferInfo fbInfo;
            fbInfo.fFBOID = buffer;
            fbInfo.fFormat = 0x8058;

            _skRenderTarget =
                GrBackendRenderTarget(width, height, samples, stencil, fbInfo);

            _skSurface = SkSurface::MakeFromBackendRenderTarget(
                getThreadDrawingContext()->skContext.get(),
                _skRenderTarget,
                kBottomLeft_GrSurfaceOrigin,
                kRGBA_8888_SkColorType,
                nullptr,
                nullptr);

            if (!_skSurface)
            {
                RNSkLogger::logToConsole(
                    "JniSkiaDrawView::setupSurface - skSurface could not be created!");
                return false;
            }

            return true;
        }
        return true;
    }
}