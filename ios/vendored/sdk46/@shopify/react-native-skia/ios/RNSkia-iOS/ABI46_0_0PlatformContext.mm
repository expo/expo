#include "ABI46_0_0PlatformContext.h"

#import <ABI46_0_0React/ABI46_0_0RCTUtils.h>
#include <thread>
#include <utility>

#include <ABI46_0_0RNSkMeasureTime.h>

namespace ABI46_0_0RNSkia {

  void ABI46_0_0PlatformContext::performStreamOperation(const std::string &sourceUri,
                                              const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) {
  
    ABI46_0_0RNSkMeasureTime("ABI46_0_0PlatformContext::performStreamOperation");
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

void ABI46_0_0PlatformContext::raiseError(const std::exception &err) {
    ABI46_0_0RCTFatal(ABI46_0_0RCTErrorWithMessage([NSString stringWithUTF8String:err.what()]));
}

void ABI46_0_0PlatformContext::startDrawLoop() {
  if(_displayLink == nullptr) {
    _displayLink = [[ABI46_0_0DisplayLink alloc] init];
    [_displayLink start:^(double time) {
      notifyDrawLoop(false);
    }];
  }
}

void ABI46_0_0PlatformContext::stopDrawLoop() {
  if(_displayLink != nullptr) {
    [_displayLink stop];
    _displayLink = nullptr;
  }  
}

}

