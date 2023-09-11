#import <ABI48_0_0RNSkMetalCanvasProvider.h>
#import <ABI48_0_0RNSkLog.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import "SkColorSpace.h"
#import "SkSurface.h"
#import "SkCanvas.h"

#import <include/gpu/GrDirectContext.h>

#pragma clang diagnostic pop

/** Static members */
std::shared_ptr<MetalRenderContext>
ABI48_0_0RNSkMetalCanvasProvider::getMetalRenderContext() {
  auto threadId = std::this_thread::get_id();
  if (renderContexts.count(threadId) == 0) {
    auto drawingContext = std::make_shared<MetalRenderContext>();
    drawingContext->commandQueue = nullptr;
    drawingContext->skContext = nullptr;
    renderContexts.emplace(threadId, drawingContext);
  }
  return renderContexts.at(threadId);
}

ABI48_0_0RNSkMetalCanvasProvider::ABI48_0_0RNSkMetalCanvasProvider(std::function<void()> requestRedraw,
                        std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkPlatformContext> context):
ABI48_0_0RNSkCanvasProvider(requestRedraw),
  _context(context) {
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

ABI48_0_0RNSkMetalCanvasProvider::~ABI48_0_0RNSkMetalCanvasProvider() {
  
}

/**
 Returns the scaled width of the view
 */
float ABI48_0_0RNSkMetalCanvasProvider::getScaledWidth() { return _width * _context->getPixelDensity(); };

/**
 Returns the scaled height of the view
 */
float ABI48_0_0RNSkMetalCanvasProvider::getScaledHeight() { return _height * _context->getPixelDensity(); };

/**
 Render to a canvas
 */
void ABI48_0_0RNSkMetalCanvasProvider::renderToCanvas(const std::function<void(SkCanvas*)>& cb) {
  if (_width <= 0 || _height <= 0) {
    return;
  }
  
  // Make sure to NOT render or try any render operations while we're in the background or inactive.
  // This will cause an error that might clear the CAMetalLayer so that the canvas is empty when
  // the app receives focus again.
  // Reference: https://github.com/Shopify/react-native-skia/issues/1257
  auto state = UIApplication.sharedApplication.applicationState;
  if (state == UIApplicationStateBackground || state == UIApplicationStateInactive)
  {
    // Request a redraw in the next run loop callback
    _requestRedraw();
    // and don't draw now since it might cause errors in the metal renderer if 
    // we try to render while in the background. (see above issue)
    return;
  }
  
  // Get render context for current thread
  auto renderContext = getMetalRenderContext();
  
  if (renderContext->skContext == nullptr) {
    auto device = MTLCreateSystemDefaultDevice();
    renderContext->commandQueue = id<MTLCommandQueue>(CFRetain((GrMTLHandle)[device newCommandQueue]));
    renderContext->skContext = GrDirectContext::MakeMetal((__bridge void*)device, (__bridge void*)renderContext->commandQueue);
  }

  // Wrap in auto release pool since we want the system to clean up after rendering
  // and not wait until later - we've seen some example of memory usage growing very
  // fast in the simulator without this.
  @autoreleasepool
  {

    GrMTLHandle drawableHandle;
    auto skSurface = SkSurface::MakeFromCAMetalLayer(renderContext->skContext.get(),
                                                     (__bridge GrMTLHandle)_layer,
                                                     kTopLeft_GrSurfaceOrigin,
                                                     1,
                                                     kBGRA_8888_SkColorType,
                                                     nullptr,
                                                     nullptr,
                                                     &drawableHandle);
    
    if(skSurface == nullptr || skSurface->getCanvas() == nullptr) {
      ABI48_0_0RNSkia::ABI48_0_0RNSkLogger::logToConsole("Skia surface could not be created from parameters.");
      return;
    }
    
    SkCanvas *canvas = skSurface->getCanvas();
    canvas->clear(SK_AlphaTRANSPARENT);
    cb(canvas);    
    skSurface->flushAndSubmit();
    
    id<CAMetalDrawable> currentDrawable = (__bridge id<CAMetalDrawable>)drawableHandle;
    id<MTLCommandBuffer> commandBuffer([renderContext->commandQueue commandBuffer]);
    commandBuffer.label = @"PresentSkia";
    [commandBuffer presentDrawable:currentDrawable];
    [commandBuffer commit];
  }
};

void ABI48_0_0RNSkMetalCanvasProvider::setSize(int width, int height) {
  _width = width;
  _height = height;
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * _context->getPixelDensity(),
                                   height* _context->getPixelDensity());

  _requestRedraw();
}

CALayer* ABI48_0_0RNSkMetalCanvasProvider::getLayer() { return _layer; }
