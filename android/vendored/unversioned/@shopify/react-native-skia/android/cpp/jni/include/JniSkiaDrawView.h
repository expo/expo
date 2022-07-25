#pragma once

#include <map>
#include <memory>
#include <thread>
#include <string>

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <thread>

#include <RNSkDrawView.h>
#include <JniSkiaManager.h>
#include <JniSkiaDrawView.h>

#include <RNSkDrawViewImpl.h>

#include <SkSurface.h>
#include <SkRefCnt.h>
#include <gpu/GrBackendSurface.h>
#include <gpu/GrDirectContext.h>

class SkPicture;
class ANativeWindow;

namespace RNSkia
{
    using namespace facebook;

    using JavaSkiaManager = jni::alias_ref<JniSkiaManager::javaobject>;

    class JniSkiaDrawView : public jni::HybridClass<JniSkiaDrawView>
    {
    public:
        static auto constexpr kJavaDescriptor = "Lcom/shopify/reactnative/skia/SkiaDrawView;";
        static auto constexpr TAG = "ReactNativeSkia";

        static jni::local_ref<jhybriddata> initHybrid(
                jni::alias_ref<jhybridobject>,
                JavaSkiaManager);

        static void registerNatives();

        void surfaceAvailable(jobject, int, int);
        void surfaceDestroyed();
        void surfaceSizeChanged(int, int);

        void updateTouchPoints(jni::JArrayDouble touches);

        ~JniSkiaDrawView();

        std::shared_ptr<RNSkDrawView> getDrawViewImpl() { return _drawView; }

        void releaseSurface();

    protected:
        void setMode(std::string mode);
        void setDebugMode(bool show);

    private:
        friend HybridBase;

        std::shared_ptr<RNSkDrawViewImpl> _drawView;

        jni::global_ref<JniSkiaDrawView::javaobject> javaPart_;

        explicit JniSkiaDrawView(
                jni::alias_ref<JniSkiaDrawView::jhybridobject> jThis,
                JavaSkiaManager skiaManager)
                : javaPart_(jni::make_global(jThis)),
                  _drawView(std::make_shared<RNSkDrawViewImpl>(skiaManager->cthis()->getPlatformContext(), [this]() {
                      releaseSurface();
                  })) {
        }
    };

} // namespace RNSkia
