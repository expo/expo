#include "RNSkiOSPlatformContext.h"

#import <React/RCTUtils.h>
#include <thread>
#include <utility>

#include <SkiaMetalRenderer.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkSurface.h"

#pragma clang diagnostic pop

namespace RNSkia {

void RNSkiOSPlatformContext::performStreamOperation(
    const std::string &sourceUri,
    const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) {

  auto loader = [=]() {
    NSURL *url = [[NSURL alloc]
        initWithString:[NSString stringWithUTF8String:sourceUri.c_str()]];

    NSData *data = nullptr;
    auto scheme = url.scheme;
    auto extension = url.pathExtension;

    if (scheme == nullptr &&
        (extension == nullptr || [extension isEqualToString:@""])) {
      // If the extension and scheme is nil, we assume that we're trying to
      // load from the embedded iOS app bundle and will try to load image
      // and get data from the image directly. imageNamed will return the
      // best version of the requested image:
      auto image = [UIImage imageNamed:[url absoluteString]];
      // We don't know the image format (png, jpg, etc) but
      // UIImagePNGRepresentation will support all of them
      data = UIImagePNGRepresentation(image);
    } else {
      // Load from metro / node
      data = [NSData dataWithContentsOfURL:url];
    }

    auto bytes = [data bytes];
    auto skData = SkData::MakeWithCopy(bytes, [data length]);
    auto stream = SkMemoryStream::Make(skData);

    op(std::move(stream));
  };

  // Fire and forget the thread - will be resolved on completion
  std::thread(loader).detach();
}

void RNSkiOSPlatformContext::raiseError(const std::exception &err) {
  RCTFatal(RCTErrorWithMessage([NSString stringWithUTF8String:err.what()]));
}

sk_sp<SkSurface> RNSkiOSPlatformContext::makeOffscreenSurface(int width,
                                                              int height) {
  return MakeOffscreenMetalSurface(width, height);
}

void RNSkiOSPlatformContext::runOnMainThread(std::function<void()> func) {
  dispatch_async(dispatch_get_main_queue(), ^{
    func();
  });
}

sk_sp<SkImage>
RNSkiOSPlatformContext::takeScreenshotFromViewTag(size_t viewTag) {
  return [_screenshotService
      screenshotOfViewWithTag:[NSNumber numberWithLong:viewTag]];
}

void RNSkiOSPlatformContext::startDrawLoop() {
  if (_displayLink == nullptr) {
    _displayLink = [[DisplayLink alloc] init];
    [_displayLink start:^(double time) {
      notifyDrawLoop(false);
    }];
  }
}

void RNSkiOSPlatformContext::stopDrawLoop() {
  if (_displayLink != nullptr) {
    [_displayLink stop];
    _displayLink = nullptr;
  }
}

} // namespace RNSkia
