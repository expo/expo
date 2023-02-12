#pragma once

#import "ABI48_0_0RNSkPlatformContext.h"
#import "ABI48_0_0RNSkView.h"

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

using MetalRenderContext = struct {
  id<MTLCommandQueue> commandQueue;
  sk_sp<GrDirectContext> skContext;
};

static std::unordered_map<std::thread::id, std::shared_ptr<MetalRenderContext>>
    renderContexts;

class ABI48_0_0RNSkMetalCanvasProvider : public ABI48_0_0RNSkia::ABI48_0_0RNSkCanvasProvider {
public:
  ABI48_0_0RNSkMetalCanvasProvider(std::function<void()> requestRedraw,
                          std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkPlatformContext> context);

  ~ABI48_0_0RNSkMetalCanvasProvider();

  float getScaledWidth() override;
  float getScaledHeight() override;

  void renderToCanvas(const std::function<void(SkCanvas *)> &cb) override;

  void setSize(int width, int height);

  CALayer *getLayer();

private:
  /**
   * To be able to use static contexts (and avoid reloading the skia context for
   * each new view, we track the Skia drawing context per thread.
   * @return The drawing context for the current thread
   */
  static std::shared_ptr<MetalRenderContext> getMetalRenderContext();

  std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkPlatformContext> _context;
  float _width = -1;
  float _height = -1;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer *_layer;
#pragma clang diagnostic pop
};
