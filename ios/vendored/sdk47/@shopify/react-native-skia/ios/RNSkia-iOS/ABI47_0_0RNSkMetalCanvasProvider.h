#pragma once

#import "ABI47_0_0RNSkPlatformContext.h"
#import "ABI47_0_0RNSkView.h"

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

class ABI47_0_0RNSkMetalCanvasProvider: public ABI47_0_0RNSkia::ABI47_0_0RNSkCanvasProvider {
public:
  ABI47_0_0RNSkMetalCanvasProvider(std::function<void()> requestRedraw,
                          std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkPlatformContext> context);
  
  ~ABI47_0_0RNSkMetalCanvasProvider();

  float getScaledWidth() override;
  float getScaledHeight() override;
  
  void renderToCanvas(const std::function<void(SkCanvas*)>& cb) override;
  
  void setSize(int width, int height);
  
  CALayer* getLayer();
  
private:
  std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkPlatformContext> _context;
  float _width = -1;
  float _height = -1;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer *_layer;
#pragma clang diagnostic pop

  static id<MTLCommandQueue> _commandQueue;
  static id<MTLDevice> _device;
  static sk_sp<GrDirectContext> _skContext;

};
