#pragma once

#import "RNSkPlatformContext.h"
#import "RNSkView.h"

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

using MetalRenderContext = struct {
  id<MTLCommandQueue> commandQueue;
  sk_sp<GrDirectContext> skContext;
};

static std::unordered_map<std::thread::id, std::shared_ptr<MetalRenderContext>>
    renderContexts;

class RNSkMetalCanvasProvider : public RNSkia::RNSkCanvasProvider {
public:
  RNSkMetalCanvasProvider(std::function<void()> requestRedraw,
                          std::shared_ptr<RNSkia::RNSkPlatformContext> context);

  ~RNSkMetalCanvasProvider();

  float getScaledWidth() override;
  float getScaledHeight() override;

  bool renderToCanvas(const std::function<void(SkCanvas *)> &cb) override;

  void setSize(int width, int height);

  CALayer *getLayer();

private:
  /**
   * To be able to use static contexts (and avoid reloading the skia context for
   * each new view, we track the Skia drawing context per thread.
   * @return The drawing context for the current thread
   */
  static std::shared_ptr<MetalRenderContext> getMetalRenderContext();

  std::shared_ptr<RNSkia::RNSkPlatformContext> _context;
  float _width = -1;
  float _height = -1;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer *_layer;
#pragma clang diagnostic pop
};
