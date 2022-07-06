#include "PlatformContext.h"

#import <React/RCTUtils.h>
#include <thread>
#include <utility>

#include <RNSkMeasureTime.h>

namespace RNSkia {

  void PlatformContext::performStreamOperation(const std::string &sourceUri,
                                              const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) {
  
    RNSkMeasureTime("PlatformContext::performStreamOperation");
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

void PlatformContext::raiseError(const std::exception &err) {
    RCTFatal(RCTErrorWithMessage([NSString stringWithUTF8String:err.what()]));
}

void PlatformContext::startDrawLoop() {
  if(_displayLink == nullptr) {
    _displayLink = [[DisplayLink alloc] init];
    [_displayLink start:^(double time) {
      notifyDrawLoop(false);
    }];
  }
}

void PlatformContext::stopDrawLoop() {
  if(_displayLink != nullptr) {
    [_displayLink stop];
    _displayLink = nullptr;
  }  
}

}

