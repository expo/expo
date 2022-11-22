#include "ABI47_0_0RNSkiOSPlatformContext.h"

#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>
#include <thread>
#include <utility>

#include <ABI47_0_0RNSkMeasureTime.h>

namespace ABI47_0_0RNSkia {

  void ABI47_0_0RNSkiOSPlatformContext::performStreamOperation(const std::string &sourceUri,
                                              const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) {
  
    ABI47_0_0RNSkMeasureTime("ABI47_0_0PlatformContext::performStreamOperation");
    auto loader = [=]() {
      
      NSURL* url = [[NSURL alloc] initWithString:[NSString stringWithUTF8String: sourceUri.c_str()]];
      NSData* data = [NSData dataWithContentsOfURL:url];
      
      auto bytes = [data bytes];
      auto skData = SkData::MakeWithCopy(bytes, [data length]);
      auto stream = SkMemoryStream::Make(skData);
      
      op(std::move(stream));            
    };
    
    // Fire and forget the thread - will be resolved on completion
    std::thread(loader).detach();
  }

void ABI47_0_0RNSkiOSPlatformContext::raiseError(const std::exception &err) {
    ABI47_0_0RCTFatal(ABI47_0_0RCTErrorWithMessage([NSString stringWithUTF8String:err.what()]));
}

void ABI47_0_0RNSkiOSPlatformContext::startDrawLoop() {
  if(_displayLink == nullptr) {
    _displayLink = [[ABI47_0_0DisplayLink alloc] init];
    [_displayLink start:^(double time) {
      notifyDrawLoop(false);
    }];
  }
}

void ABI47_0_0RNSkiOSPlatformContext::stopDrawLoop() {
  if(_displayLink != nullptr) {
    [_displayLink stop];
    _displayLink = nullptr;
  }  
}

}

