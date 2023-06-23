#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import "SkCanvas.h"
#import "SkColorSpace.h"
#import "SkSurface.h"

#import <include/gpu/GrDirectContext.h>

#pragma clang diagnostic pop

#import <MetalKit/MetalKit.h>

struct OffscreenRenderContext {
  id<MTLDevice> device;
  id<MTLCommandQueue> commandQueue;
  sk_sp<GrDirectContext> skiaContext;
  id<MTLTexture> texture;

  OffscreenRenderContext(int width, int height) {
    device = MTLCreateSystemDefaultDevice();
    commandQueue =
        id<MTLCommandQueue>(CFRetain((GrMTLHandle)[device newCommandQueue]));
    skiaContext = GrDirectContext::MakeMetal((__bridge void *)device,
                                             (__bridge void *)commandQueue);
    // Create a Metal texture descriptor
    MTLTextureDescriptor *textureDescriptor = [MTLTextureDescriptor
        texture2DDescriptorWithPixelFormat:MTLPixelFormatBGRA8Unorm
                                     width:width
                                    height:height
                                 mipmapped:NO];
    textureDescriptor.usage =
        MTLTextureUsageRenderTarget | MTLTextureUsageShaderRead;
    texture = [device newTextureWithDescriptor:textureDescriptor];
  }
};

sk_sp<SkSurface> MakeOffscreenMetalSurface(int width, int height) {
  auto ctx = new OffscreenRenderContext(width, height);

  // Create a GrBackendTexture from the Metal texture
  GrMtlTextureInfo info;
  info.fTexture.retain((__bridge void *)ctx->texture);
  GrBackendTexture backendTexture(width, height, GrMipMapped::kNo, info);

  // Create a SkSurface from the GrBackendTexture
  auto surface = SkSurface::MakeFromBackendTexture(
      ctx->skiaContext.get(), backendTexture, kTopLeft_GrSurfaceOrigin, 0,
      kBGRA_8888_SkColorType, nullptr, nullptr,
      [](void *addr) { delete (OffscreenRenderContext *)addr; }, ctx);

  return surface;
}
