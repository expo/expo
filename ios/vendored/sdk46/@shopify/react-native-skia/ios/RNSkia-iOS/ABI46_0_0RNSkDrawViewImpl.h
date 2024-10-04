#pragma once

#import "ABI46_0_0PlatformContext.h"
#import "ABI46_0_0RNSKDrawView.h"
#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <GrMtlBackendContext.h>
#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#import <SkPicture.h>
#import <SkRefCnt.h>
#import <include/gpu/GrDirectContext.h>

#pragma clang diagnostic pop

class ABI46_0_0RNSkDrawViewImpl : public ABI46_0_0RNSkia::ABI46_0_0RNSkDrawView {
public:
  ABI46_0_0RNSkDrawViewImpl(std::shared_ptr<ABI46_0_0RNSkia::ABI46_0_0RNSkPlatformContext> context);
  ~ABI46_0_0RNSkDrawViewImpl();
  
  CALayer* getLayer() { return _layer; }
  
  void setSize(int width, int height);

protected:
  float getScaledWidth() override { return _width * _context->getPixelDensity(); };
  float getScaledHeight() override { return _height * _context->getPixelDensity(); };
  
private:
  void drawPicture(const sk_sp<SkPicture> picture) override;
  bool createSkiaSurface();

  int _nativeId;
  float _width = -1;
  float _height = -1;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
  CAMetalLayer *_layer;
#pragma clang diagnostic pop

  static id<MTLCommandQueue> _commandQueue;
  static id<MTLDevice> _device;
  static sk_sp<GrDirectContext> _skContext;

  std::shared_ptr<ABI46_0_0RNSkia::ABI46_0_0RNSkPlatformContext> _context;
};
