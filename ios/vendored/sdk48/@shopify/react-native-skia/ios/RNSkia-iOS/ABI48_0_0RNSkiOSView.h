#pragma once

#import <memory>

#import "ABI48_0_0RNSkMetalCanvasProvider.h"
#import "ABI48_0_0RNSkView.h"
#import "ABI48_0_0RNSkiOSPlatformContext.h"

class ABI48_0_0RNSkBaseiOSView {
public:
  virtual CALayer *getLayer() = 0;
  virtual void setSize(int width, int height) = 0;
  virtual std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkView> getDrawView() = 0;
};

template <class T> class ABI48_0_0RNSkiOSView : public ABI48_0_0RNSkBaseiOSView, public T {
public:
  ABI48_0_0RNSkiOSView(std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkPlatformContext> context)
      : T(context,
          std::make_shared<ABI48_0_0RNSkMetalCanvasProvider>(
              std::bind(&ABI48_0_0RNSkia::ABI48_0_0RNSkView::requestRedraw, this), context)) {}

  CALayer *getLayer() override {
    return std::static_pointer_cast<ABI48_0_0RNSkMetalCanvasProvider>(
               this->getCanvasProvider())
        ->getLayer();
  }

  void setSize(int width, int height) override {
    std::static_pointer_cast<ABI48_0_0RNSkMetalCanvasProvider>(this->getCanvasProvider())
        ->setSize(width, height);
  }

  std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkView> getDrawView() override {
    return this->shared_from_this();
  }
};
