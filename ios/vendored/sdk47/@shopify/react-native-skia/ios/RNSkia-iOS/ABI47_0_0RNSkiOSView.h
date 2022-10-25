#pragma once

#import <memory>

#import "ABI47_0_0RNSkView.h"
#import "ABI47_0_0RNSkiOSPlatformContext.h"
#import "ABI47_0_0RNSkMetalCanvasProvider.h"

class ABI47_0_0RNSkBaseiOSView {
public:
  virtual CALayer* getLayer() = 0;
  virtual void setSize(int width, int height) = 0;
  virtual std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkView> getDrawView() = 0;
};

template <class T>
class ABI47_0_0RNSkiOSView: public ABI47_0_0RNSkBaseiOSView, public T {
public:
  ABI47_0_0RNSkiOSView(std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkPlatformContext> context):
    T(context, std::make_shared<ABI47_0_0RNSkMetalCanvasProvider>(std::bind(&ABI47_0_0RNSkia::ABI47_0_0RNSkView::requestRedraw, this), context)) {}
  
  CALayer* getLayer() override {
    return std::static_pointer_cast<ABI47_0_0RNSkMetalCanvasProvider>(this->getCanvasProvider())->getLayer();
  }
  
  void setSize(int width, int height) override {
    std::static_pointer_cast<ABI47_0_0RNSkMetalCanvasProvider>(this->getCanvasProvider())->setSize(width, height);
  }
  
  std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkView> getDrawView() override {
    return this->shared_from_this();
  }

};
