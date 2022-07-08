#include "JniSkiaDrawView.h"
#include "RNSkLog.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

#include <GLES2/gl2.h>
#include <EGL/eglplatform.h>
#include <android/native_window.h>
#include <android/native_window_jni.h>

#include <SkCanvas.h>
#include <SkImageInfo.h>
#include <SkSurface.h>
#include <gpu/GrDirectContext.h>
#include <gpu/GrBackendSurface.h>
#include <gpu/gl/GrGLInterface.h>
#include <gpu/gl/GrGLTypes.h>
#include <gpu/GrTypes.h>
#include <RNSkInfoParameter.h>

namespace RNSkia
{
    using namespace facebook;
    using namespace jni;

    using TSelf = local_ref<HybridClass<JniSkiaDrawView>::jhybriddata>;

    /**** DTOR ***/
    JniSkiaDrawView::~JniSkiaDrawView()
    {
    }

    /**** JNI ****/

    TSelf JniSkiaDrawView::initHybrid(
            alias_ref<HybridClass::jhybridobject> jThis,
            JavaSkiaManager skiaManager)
    {
        return makeCxxInstance(jThis, skiaManager);
    }

    void JniSkiaDrawView::registerNatives()
    {
        registerHybrid({makeNativeMethod("initHybrid", JniSkiaDrawView::initHybrid),
                        makeNativeMethod("surfaceAvailable", JniSkiaDrawView::surfaceAvailable),
                        makeNativeMethod("surfaceDestroyed", JniSkiaDrawView::surfaceDestroyed),
                        makeNativeMethod("surfaceSizeChanged", JniSkiaDrawView::surfaceSizeChanged),
                        makeNativeMethod("setMode", JniSkiaDrawView::setMode),
                        makeNativeMethod("setDebugMode", JniSkiaDrawView::setDebugMode),
                        makeNativeMethod("updateTouchPoints", JniSkiaDrawView::updateTouchPoints)});
    }

    void JniSkiaDrawView::setMode(std::string mode)
    {
        if (mode.compare("continuous") == 0)
        {
            _drawView->setDrawingMode(RNSkDrawingMode::Continuous);
        }
        else
        {
            _drawView->setDrawingMode(RNSkDrawingMode::Default);
        }
    }

    void JniSkiaDrawView::setDebugMode(bool show)
    {
        _drawView->setShowDebugOverlays(show);
    }

    void JniSkiaDrawView::updateTouchPoints(jni::JArrayDouble touches)
    {
        // Create touch points
        std::vector<RNSkia::RNSkTouchPoint> points;
        auto pin = touches.pin();
        auto scale = _drawView->getPixelDensity();
        points.reserve(pin.size() / 5);
        for (size_t i = 0; i < pin.size(); i += 5)
        {
            RNSkTouchPoint point;
            point.x = pin[i] / scale;
            point.y = pin[i + 1] / scale;
            point.force = pin[i + 2];
            point.type = (RNSkia::RNSkTouchType)pin[i + 3];
            point.id = pin[i + 4];
            points.push_back(point);
        }
        _drawView->updateTouchState(std::move(points));
    }

    void JniSkiaDrawView::surfaceAvailable(jobject surface, int width, int height)
    {
        _drawView->surfaceAvailable(ANativeWindow_fromSurface(Environment::current(), surface), width, height);
    }

    void JniSkiaDrawView::surfaceSizeChanged(int width, int height)
    {
        _drawView->surfaceSizeChanged(width, height);
    }

    void JniSkiaDrawView::surfaceDestroyed()
    {
        _drawView->surfaceDestroyed();
    }

    void JniSkiaDrawView::releaseSurface() {
        jni::ThreadScope ts;
        static auto method = javaPart_->getClass()->getMethod<void(void)>("releaseSurface");
        method(javaPart_.get());
    }
} // namespace RNSkia
