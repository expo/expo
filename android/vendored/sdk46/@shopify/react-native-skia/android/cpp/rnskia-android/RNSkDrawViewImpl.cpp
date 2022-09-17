#include <RNSkDrawViewImpl.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkSurface.h>
#include <SkCanvas.h>

#pragma clang diagnostic pop

#include <RNSkLog.h>

namespace RNSkia {
    RNSkDrawViewImpl::RNSkDrawViewImpl(std::shared_ptr <RNSkia::RNSkPlatformContext> context, std::function<void()> releaseSurfaceCallback) :
        RNSkia::RNSkDrawView(context),
        _releaseSurfaceCallback(std::move(releaseSurfaceCallback)) {}

    void RNSkDrawViewImpl::surfaceAvailable(ANativeWindow* surface, int width, int height) {
        _scaledWidth = width;
        _scaledHeight = height;

        if (_renderer == nullptr)
        {
            // Create renderer!
            _renderer = std::make_unique<SkiaOpenGLRenderer>(surface, getNativeId());

            // Redraw
            requestRedraw();
        }
    }

    void RNSkDrawViewImpl::surfaceDestroyed() {
        if (_renderer != nullptr)
        {
            // Start teardown
            _renderer->teardown();

            // Teardown renderer on the render thread since OpenGL demands
            // same thread access for OpenGL contexts.
            getPlatformContext()->runOnRenderThread([weakSelf = weak_from_this()]() {
                auto self = weakSelf.lock();
                if(self) {
                    auto drawViewImpl = std::dynamic_pointer_cast<RNSkDrawViewImpl>(self);
                    if(drawViewImpl->_renderer != nullptr) {
                        drawViewImpl->_renderer->run(nullptr, 0, 0);
                    }
                    // Remove renderer
                    drawViewImpl->_renderer = nullptr;
                    drawViewImpl->_releaseSurfaceCallback();
                }
            });
        }
    }

    void RNSkDrawViewImpl::surfaceSizeChanged(int width, int height) {
        if(width == 0 && height == 0) {
            // Setting width/height to zero is nothing we need to care about when
            // it comes to invalidating the surface.
            return;
        }
        _scaledWidth = width;
        _scaledHeight = height;

        // Redraw after size change
        requestRedraw();
    }

    void RNSkDrawViewImpl::drawPicture(const sk_sp <SkPicture> picture) {
        if(_renderer != nullptr) {
            _renderer->run(picture, _scaledWidth, _scaledHeight);
        }
    }
}
