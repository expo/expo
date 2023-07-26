#import <RNSkLog.h>
#import <RNSkMetalCanvasProvider.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import "SkCanvas.h"
#import "SkColorSpace.h"
#import "SkSurface.h"

#import <include/gpu/GrDirectContext.h>

#pragma clang diagnostic pop

/** Static members */
std::shared_ptr<MetalRenderContext>
RNSkMetalCanvasProvider::getMetalRenderContext() {
  auto threadId = std::this_thread::get_id();
  if (renderContexts.count(threadId) == 0) {
    auto drawingContext = std::make_shared<MetalRenderContext>();
    drawingContext->commandQueue = nullptr;
    drawingContext->skContext = nullptr;
    renderContexts.emplace(threadId, drawingContext);
  }
  return renderContexts.at(threadId);
}

RNSkMetalCanvasProvider::RNSkMetalCanvasProvider(
    std::function<void()> requestRedraw,
    std::shared_ptr<RNSkia::RNSkPlatformContext> context)
    : RNSkCanvasProvider(requestRedraw), _context(context) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  _layer = [CAMetalLayer layer];
#pragma clang diagnostic pop

  auto device = MTLCreateSystemDefaultDevice();

  _layer.framebufferOnly = NO;
  _layer.device = device;
  _layer.opaque = false;
  _layer.contentsScale = _context->getPixelDensity();
  _layer.pixelFormat = MTLPixelFormatBGRA8Unorm;
  _layer.contentsGravity = kCAGravityBottomLeft;
}

RNSkMetalCanvasProvider::~RNSkMetalCanvasProvider() {}

/**
 Returns the scaled width of the view
 */
float RNSkMetalCanvasProvider::getScaledWidth() {
  return _width * _context->getPixelDensity();
};

/**
 Returns the scaled height of the view
 */
float RNSkMetalCanvasProvider::getScaledHeight() {
  return _height * _context->getPixelDensity();
};

/**
 Render to a canvas
 */
bool RNSkMetalCanvasProvider::renderToCanvas(
    const std::function<void(SkCanvas *)> &cb) {
  if (_width <= 0 || _height <= 0) {
    return false;
  }

  // Make sure to NOT render or try any render operations while we're in the
  // background or inactive. This will cause an error that might clear the
  // CAMetalLayer so that the canvas is empty when the app receives focus again.
  // Reference: https://github.com/Shopify/react-native-skia/issues/1257
  // NOTE: UIApplication.sharedApplication.applicationState can only be
  // accessed from the main thread so we need to check here.
  if ([[NSThread currentThread] isMainThread]) {
    auto state = UIApplication.sharedApplication.applicationState;
    if (state == UIApplicationStateBackground) {
      // Request a redraw in the next run loop callback
      _requestRedraw();
      // and don't draw now since it might cause errors in the metal renderer if
      // we try to render while in the background. (see above issue)
      return false;
    }
  }

  // Get render context for current thread
  auto renderContext = getMetalRenderContext();

  if (renderContext->skContext == nullptr) {
    auto device = MTLCreateSystemDefaultDevice();
    renderContext->commandQueue =
        id<MTLCommandQueue>(CFRetain((GrMTLHandle)[device newCommandQueue]));
    renderContext->skContext = GrDirectContext::MakeMetal(
        (__bridge void *)device, (__bridge void *)renderContext->commandQueue);
  }

  // Wrap in auto release pool since we want the system to clean up after
  // rendering and not wait until later - we've seen some example of memory
  // usage growing very fast in the simulator without this.
  @autoreleasepool {

    /* It is super important that we use the pattern of calling nextDrawable
     inside this autoreleasepool and not depend on Skia's
     SkSurface::MakeFromCAMetalLayer to encapsulate since we're seeing a lot of
     drawables leaking if they're not done this way.

     This is now reverted from:
     (https://github.com/Shopify/react-native-skia/commit/2e2290f8e6dfc6921f97b79f779d920fbc1acceb)
     back to the original implementation.
     */
    id<CAMetalDrawable> currentDrawable = [_layer nextDrawable];
    if (currentDrawable == nullptr) {
      return false;
    }

    GrMtlTextureInfo fbInfo;
    fbInfo.fTexture.retain((__bridge void *)currentDrawable.texture);

    GrBackendRenderTarget backendRT(_layer.drawableSize.width,
                                    _layer.drawableSize.height, 1, fbInfo);

    auto skSurface = SkSurface::MakeFromBackendRenderTarget(
        renderContext->skContext.get(), backendRT, kTopLeft_GrSurfaceOrigin,
        kBGRA_8888_SkColorType, nullptr, nullptr);

    if (skSurface == nullptr || skSurface->getCanvas() == nullptr) {
      RNSkia::RNSkLogger::logToConsole(
          "Skia surface could not be created from parameters.");
      return false;
    }

    SkCanvas *canvas = skSurface->getCanvas();
    cb(canvas);

    skSurface->flushAndSubmit();

    id<MTLCommandBuffer> commandBuffer(
        [renderContext->commandQueue commandBuffer]);
    [commandBuffer presentDrawable:currentDrawable];
    [commandBuffer commit];
  }

  return true;
};

void RNSkMetalCanvasProvider::setSize(int width, int height) {
  _width = width;
  _height = height;
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * _context->getPixelDensity(),
                                   height * _context->getPixelDensity());

  _requestRedraw();
}

CALayer *RNSkMetalCanvasProvider::getLayer() { return _layer; }
