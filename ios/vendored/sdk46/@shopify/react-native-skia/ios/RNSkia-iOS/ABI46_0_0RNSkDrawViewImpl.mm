#import <ABI46_0_0RNSkDrawViewImpl.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import <SkColorSpace.h>
#import <SkSurface.h>
#import <SkCanvas.h>

#pragma clang diagnostic pop

#import <ABI46_0_0SkiaDrawView.h>
#import <ABI46_0_0RNSkLog.h>

// These static class members are used by all Skia Views
id<MTLDevice> ABI46_0_0RNSkDrawViewImpl::_device = MTLCreateSystemDefaultDevice();
id<MTLCommandQueue> ABI46_0_0RNSkDrawViewImpl::_commandQueue = id<MTLCommandQueue>(CFRetain((GrMTLHandle)[_device newCommandQueue]));

sk_sp<GrDirectContext> ABI46_0_0RNSkDrawViewImpl::_skContext = nullptr;

ABI46_0_0RNSkDrawViewImpl::ABI46_0_0RNSkDrawViewImpl(std::shared_ptr<ABI46_0_0RNSkia::ABI46_0_0RNSkPlatformContext> context):
  _context(context), ABI46_0_0RNSkia::ABI46_0_0RNSkDrawView(context) {
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

ABI46_0_0RNSkDrawViewImpl::~ABI46_0_0RNSkDrawViewImpl() {
  if([[NSThread currentThread] isMainThread]) {
    _layer = NULL;
  } else {
    __block auto tempLayer = _layer;
    dispatch_async(dispatch_get_main_queue(), ^{
      // By using the tempLayer variable in the block we capture it and it will be
      // released after the block has finished. This way the CAMetalLayer dealloc will
      // only be called on the main thread. Problem: this destructor might be called from
      // releasing the ABI46_0_0RNSkDrawViewImpl from a thread capture (after dtor has started),
      // which would cause the CAMetalLayer dealloc to be called on another thread which
      // causes a crash.
      // https://github.com/Shopify/react-native-skia/issues/398
      tempLayer = tempLayer;
    });
  }
}

void ABI46_0_0RNSkDrawViewImpl::setSize(int width, int height) {
  _width = width;
  _height = height;
  _layer.frame = CGRectMake(0, 0, width, height);
  _layer.drawableSize = CGSizeMake(width * _context->getPixelDensity(),
                                   height* _context->getPixelDensity());
  
  requestRedraw();
}

void ABI46_0_0RNSkDrawViewImpl::drawPicture(const sk_sp<SkPicture> picture) {
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
      ABI46_0_0RNSkia::ABI46_0_0RNSkLogger::logToConsole("Skia surface could not be created from parameters.");
      return;
    }
    
    skSurface->getCanvas()->clear(SK_AlphaTRANSPARENT);
    skSurface->getCanvas()->drawPicture(picture);
    
    id<MTLCommandBuffer> commandBuffer([_commandQueue commandBuffer]);
    [commandBuffer presentDrawable:currentDrawable];
    [commandBuffer commit];
  }
}
