#pragma once

#import "RNSkPlatformContext.h"
#import "RNSkView.h"

#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import <include/gpu/GrDirectContext.h>

#pragma clang diagnostic pop

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
  std::shared_ptr<RNSkia::RNSkPlatformContext> _context;
  float _width = -1;
  float _height = -1;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer *_layer;
#pragma clang diagnostic pop
};
