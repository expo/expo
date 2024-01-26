#import <RNSkLog.h>
#import <RNSkMetalCanvasProvider.h>
#import <SkiaMetalSurfaceFactory.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import "SkCanvas.h"
#import "SkColorSpace.h"
#import "SkSurface.h"

#import <include/gpu/GrBackendSurface.h>
#import <include/gpu/GrDirectContext.h>
#import <include/gpu/ganesh/SkSurfaceGanesh.h>

#pragma clang diagnostic pop

RNSkMetalCanvasProvider::RNSkMetalCanvasProvider(
    std::function<void()> requestRedraw,
    std::shared_ptr<RNSkia::RNSkPlatformContext> context)
    : RNSkCanvasProvider(requestRedraw), _context(context) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  _layer = [CAMetalLayer layer];
#pragma clang diagnostic pop
  _layer.framebufferOnly = NO;
  _layer.device = MTLCreateSystemDefaultDevice();
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
  // Wrap in auto release pool since we want the system to clean up after
  // rendering and not wait until later - we've seen some example of memory
  // usage growing very fast in the simulator without this.
  @autoreleasepool {
    id<CAMetalDrawable> currentDrawable = [_layer nextDrawable];
    if (currentDrawable == nullptr) {
      return false;
    }

    auto skSurface = SkiaMetalSurfaceFactory::makeWindowedSurface(
        currentDrawable.texture, _layer.drawableSize.width,
        _layer.drawableSize.height);

    SkCanvas *canvas = skSurface->getCanvas();
    cb(canvas);

    if (auto dContext = GrAsDirectContext(skSurface->recordingContext())) {
      dContext->flushAndSubmit();
    }

    id<MTLCommandBuffer> commandBuffer(
        [ThreadContextHolder::ThreadSkiaMetalContext
                .commandQueue commandBuffer]);
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
