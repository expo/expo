#pragma once

#include <RNSkDrawView.h>

#include <SkiaOpenGLRenderer.h>
#include <android/native_window.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPicture.h>
#include <SkRefCnt.h>

#pragma clang diagnostic pop

namespace RNSkia {
    class RNSkDrawViewImpl : public RNSkia::RNSkDrawView {
    public:
        RNSkDrawViewImpl(std::shared_ptr <RNSkia::RNSkPlatformContext> context,
                         std::function<void()> releaseSurfaceCallback);

        void surfaceAvailable(ANativeWindow* surface, int, int);
        void surfaceDestroyed();
        void surfaceSizeChanged(int, int);

        float getPixelDensity() {
            return getPlatformContext()->getPixelDensity();
        }

    protected:
        float getScaledWidth() override { return _scaledWidth; };

        float getScaledHeight() override { return _scaledHeight; };

        void drawPicture(const sk_sp <SkPicture> picture) override;

    private:
        bool createSkiaSurface();

        std::unique_ptr<SkiaOpenGLRenderer> _renderer = nullptr;

        int _nativeId;
        float _scaledWidth = -1;
        float _scaledHeight = -1;

        std::function<void()> _releaseSurfaceCallback;
    };
}
