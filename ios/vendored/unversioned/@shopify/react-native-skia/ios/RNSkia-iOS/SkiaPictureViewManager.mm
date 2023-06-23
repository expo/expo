
#include "SkiaPictureViewManager.h"
#include <React/RCTBridge+Private.h>

#include <RNSkIOSView.h>
#include <RNSkPictureView.h>
#include <RNSkPlatformContext.h>

#include "SkiaManager.h"
#include "SkiaUIView.h"
#include <RNSkiaModule.h>

@implementation SkiaPictureViewManager

RCT_EXPORT_MODULE(SkiaPictureView)

- (SkiaManager *)skiaManager {
  auto bridge = [RCTBridge currentBridge];
  auto skiaModule = (RNSkiaModule *)[bridge moduleForName:@"RNSkia"];
  return [skiaModule manager];
}

RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSNumber, SkiaUIView) {
  // Get parameter
  int nativeId = [[RCTConvert NSString:json] intValue];
  [(SkiaUIView *)view setNativeId:nativeId];
}

RCT_CUSTOM_VIEW_PROPERTY(mode, NSString, SkiaUIView) {
  std::string mode =
      json != NULL ? [[RCTConvert NSString:json] UTF8String] : "default";
  [(SkiaUIView *)view setDrawingMode:mode];
}

RCT_CUSTOM_VIEW_PROPERTY(debug, BOOL, SkiaUIView) {
  bool debug = json != NULL ? [RCTConvert BOOL:json] : false;
  [(SkiaUIView *)view setDebugMode:debug];
}

- (UIView *)view {
  auto skManager = [[self skiaManager] skManager];
  // Pass SkManager as a raw pointer to avoid circular dependenciesr
  return [[SkiaUIView alloc]
      initWithManager:skManager.get()
              factory:[](std::shared_ptr<RNSkia::RNSkPlatformContext> context) {
                return std::make_shared<RNSkiOSView<RNSkia::RNSkPictureView>>(
                    context);
              }];
}

@end
