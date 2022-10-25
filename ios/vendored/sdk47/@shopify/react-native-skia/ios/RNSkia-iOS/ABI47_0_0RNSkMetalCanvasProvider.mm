#import <ABI47_0_0RNSkMetalCanvasProvider.h>
#import <ABI47_0_0RNSkLog.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import <SkColorSpace.h>
#import <SkSurface.h>
#import <SkCanvas.h>

#import <include/gpu/GrDirectContext.h>

#pragma clang diagnostic pop

// These static class members are used by all Skia Views
id<MTLDevice> ABI47_0_0RNSkMetalCanvasProvider::_device = nullptr;
id<MTLCommandQueue> ABI47_0_0RNSkMetalCanvasProvider::_commandQueue = nullptr;
sk_sp<GrDirectContext> ABI47_0_0RNSkMetalCanvasProvider::_skContext = nullptr;

ABI47_0_0RNSkMetalCanvasProvider::ABI47_0_0RNSkMetalCanvasProvider(std::function<void()> requestRedraw,
                        std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkPlatformContext> context):
ABI47_0_0RNSkCanvasProvider(requestRedraw),
  _context(context) {
  if (!_device) {
    _device = MTLCreateSystemDefaultDevice();
  }
  if (!_commandQueue) {
    _commandQueue = id<MTLCommandQueue>(CFRetain((GrMTLHandle)[_device newCommandQueue]));
  }

  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wunguarded-availability-new"
  _layer = [CAMetalLayer layer];
  #pragma clang diagnostic pop
    
  _layer.framebufferOnly = NO;
  _layer.device = _device;
  _layer.opaque = false;
  _layer.contentsScale = _context->getPixelDensity();
  _layer.pixelFormat = MTLPixelFormatBGRA8Unorm;
}

ABI47_0_0RNSkMetalCanvasProvider::~ABI47_0_0RNSkMetalCanvasProvider() {
  if([[NSThread currentThread] isMainThread]) {
    _layer = NULL;
  } else {
    __block auto tempLayer = _layer;
    dispatch_async(dispatch_get_main_queue(), ^{
      // By using the tempLayer variable in the block we capture it and it will be
      // released after the block has finished. This way the CAMetalLayer dealloc will
      // only be called on the main thread. Problem: this destructor might be called from
      // releasing the ABI47_0_0RNSkDrawViewImpl from a thread capture (after dtor has started),
      // which would cause the CAMetalLayer dealloc to be called on another thread which
      // causes a crash.
      // https://github.com/Shopify/react-native-skia/issues/398
      tempLayer = tempLayer;
    });
  }
}

/**
 Returns the scaled width of the view
 */
float ABI47_0_0RNSkMetalCanvasProvider::getScaledWidth() { return _width * _context->getPixelDensity(); };

/**
 Returns the scaled height of the view
 */
float ABI47_0_0RNSkMetalCanvasProvider::getScaledHeight() { return _height * _context->getPixelDensity(); };

/**
 Render to a canvas
 */
void ABI47_0_0RNSkMetalCanvasProvider::renderToCanvas(const std::function<void(SkCanvas*)>& cb) {
  if(_width == -1 && _height == -1) {
    return;
  }
  
  if(_skContext == nullptr) {
    GrContextOptions grContextOptions;
    _skContext = GrDirectContext::MakeMetal((__bridge void*)_device,
                                            (__bridge void*)_commandQueue,
                                            grContextOptions);
  }
  
  // Wrap in auto release pool since we want the system to clean up after rendering
  // and not wait until later - we've seen some example of memory usage growing very
  // fast in the simulator without this.
  @autoreleasepool
  {
    id<CAMetalDrawable> currentDrawable = [_layer nextDrawable];
    if(currentDrawable == nullptr) {
      return;
    }
    
    GrMtlTextureInfo fbInfo;
    fbInfo.fTexture.retain((__bridge void*)currentDrawable.texture);
    
    GrBackendRenderTarget backendRT(_layer.drawableSize.width,
                                    _layer.drawableSize.height,
                                    1,
                                    fbInfo);

    auto skSurface = SkSurface::MakeFromBackendRenderTarget(_skContext.get(),
                                                            backendRT,
                                                            kTopLeft_GrSurfaceOrigin,
                                                            kBGRA_8888_SkColorType,
                                                            nullptr,
                                                            nullptr);
    
    if(skSurface == nullptr || skSurface->getCanvas() == nullptr) {
      ABI47_0_0RNSkia::ABI47_0_0RNSkLogger::logToConsole("Skia surface could not be created from parameters.");
      return;
    }
    
    skSurface->getCanvas()->clear(SK_AlphaTRANSPARENT);
    cb(skSurface->getCanvas());
    
    id<MTLCommandBuffer> commandBuffer([_commandQueue commandBuffer]);
    [commandBuffer presentDrawable:currentDrawable];
    [commandBuffer commit];
  }
};

void ABI47_0_0RNSkMetalCanvasProvider::setSize(int width, int height) {
  _width = width;
  _height = height;
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * _context->getPixelDensity(),
                                   height* _context->getPixelDensity());
  
  _requestRedraw();
}

CALayer* ABI47_0_0RNSkMetalCanvasProvider::getLayer() { return _layer; }
