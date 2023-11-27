#import <MetalKit/MetalKit.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import "SkCanvas.h"
#import <include/gpu/GrDirectContext.h>

#pragma clang diagnostic pop

using SkiaMetalContext = struct SkiaMetalContext {
  id<MTLCommandQueue> commandQueue = nullptr;
  sk_sp<GrDirectContext> skContext = nullptr;
};

class ThreadContextHolder {
public:
  static thread_local SkiaMetalContext ThreadSkiaMetalContext;
};

class SkiaMetalSurfaceFactory {
public:
  static sk_sp<SkSurface> makeWindowedSurface(id<MTLTexture> texture, int width,
                                              int height);
  static sk_sp<SkSurface> makeOffscreenSurface(int width, int height);

private:
  static id<MTLDevice> device;
  static bool
  createSkiaDirectContextIfNecessary(SkiaMetalContext *threadContext);
};
