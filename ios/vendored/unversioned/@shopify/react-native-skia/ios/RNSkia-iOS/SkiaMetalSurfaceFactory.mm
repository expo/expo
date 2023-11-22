#import <RNSkLog.h>

#include <SkiaMetalSurfaceFactory.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import "SkCanvas.h"
#import "SkColorSpace.h"
#import "SkSurface.h"

#import <include/gpu/GrBackendSurface.h>
#import <include/gpu/GrDirectContext.h>
#import <include/gpu/ganesh/SkSurfaceGanesh.h>

#pragma clang diagnostic pop

thread_local SkiaMetalContext ThreadContextHolder::ThreadSkiaMetalContext;

struct OffscreenRenderContext {
  id<MTLTexture> texture;

  OffscreenRenderContext(id<MTLDevice> device,
                         sk_sp<GrDirectContext> skiaContext,
                         id<MTLCommandQueue> commandQueue, int width,
                         int height) {
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

id<MTLDevice> SkiaMetalSurfaceFactory::device = MTLCreateSystemDefaultDevice();

bool SkiaMetalSurfaceFactory::createSkiaDirectContextIfNecessary(
    SkiaMetalContext *skiaMetalContext) {
  if (skiaMetalContext->skContext == nullptr) {
    skiaMetalContext->commandQueue =
        id<MTLCommandQueue>(CFRetain((GrMTLHandle)[device newCommandQueue]));
    skiaMetalContext->skContext = GrDirectContext::MakeMetal(
        (__bridge void *)device,
        (__bridge void *)skiaMetalContext->commandQueue);
    if (skiaMetalContext->skContext == nullptr) {
      RNSkia::RNSkLogger::logToConsole("Couldn't create a Skia Metal Context");
      return false;
    }
  }
  return true;
}

sk_sp<SkSurface>
SkiaMetalSurfaceFactory::makeWindowedSurface(id<MTLTexture> texture, int width,
                                             int height) {
  // Get render context for current thread
  if (!SkiaMetalSurfaceFactory::createSkiaDirectContextIfNecessary(
          &ThreadContextHolder::ThreadSkiaMetalContext)) {
    return nullptr;
  }
  GrMtlTextureInfo fbInfo;
  fbInfo.fTexture.retain((__bridge void *)texture);

  GrBackendRenderTarget backendRT(width, height, fbInfo);

  auto skSurface = SkSurfaces::WrapBackendRenderTarget(
      ThreadContextHolder::ThreadSkiaMetalContext.skContext.get(), backendRT,
      kTopLeft_GrSurfaceOrigin, kBGRA_8888_SkColorType, nullptr, nullptr);

  if (skSurface == nullptr || skSurface->getCanvas() == nullptr) {
    RNSkia::RNSkLogger::logToConsole(
        "Skia surface could not be created from parameters.");
    return nullptr;
  }
  return skSurface;
}

sk_sp<SkSurface> SkiaMetalSurfaceFactory::makeOffscreenSurface(int width,
                                                               int height) {
  if (!SkiaMetalSurfaceFactory::createSkiaDirectContextIfNecessary(
          &ThreadContextHolder::ThreadSkiaMetalContext)) {
    return nullptr;
  }
  auto ctx = new OffscreenRenderContext(
      device, ThreadContextHolder::ThreadSkiaMetalContext.skContext,
      ThreadContextHolder::ThreadSkiaMetalContext.commandQueue, width, height);

  // Create a GrBackendTexture from the Metal texture
  GrMtlTextureInfo info;
  info.fTexture.retain((__bridge void *)ctx->texture);
  GrBackendTexture backendTexture(width, height, GrMipMapped::kNo, info);

  // Create a SkSurface from the GrBackendTexture
  auto surface = SkSurfaces::WrapBackendTexture(
      ThreadContextHolder::ThreadSkiaMetalContext.skContext.get(),
      backendTexture, kTopLeft_GrSurfaceOrigin, 0, kBGRA_8888_SkColorType,
      nullptr, nullptr,
      [](void *addr) { delete (OffscreenRenderContext *)addr; }, ctx);

  return surface;
}
