
#include <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#include <ABI49_0_0SkiaDomViewManager.h>

#include <ABI49_0_0RNSkDomView.h>
#include <ABI49_0_0RNSkIOSView.h>
#include <ABI49_0_0RNSkPlatformContext.h>

#include <ABI49_0_0RNSkiaModule.h>
#include <ABI49_0_0SkiaManager.h>
#include <ABI49_0_0SkiaUIView.h>

@implementation ABI49_0_0SkiaDomViewManager

ABI49_0_0RCT_EXPORT_MODULE(ABI49_0_0SkiaDomView)

- (ABI49_0_0SkiaManager *)skiaManager {
  auto bridge = [ABI49_0_0RCTBridge currentBridge];
  auto skiaModule = (ABI49_0_0RNSkiaModule *)[bridge moduleForName:@"RNSkia"];
  return [skiaModule manager];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSNumber, ABI49_0_0SkiaUIView) {
  // Get parameter
  int nativeId = [[ABI49_0_0RCTConvert NSString:json] intValue];
  [(ABI49_0_0SkiaUIView *)view setNativeId:nativeId];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(mode, NSString, ABI49_0_0SkiaUIView) {
  std::string mode =
      json != NULL ? [[ABI49_0_0RCTConvert NSString:json] UTF8String] : "default";
  [(ABI49_0_0SkiaUIView *)view setDrawingMode:mode];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(debug, BOOL, ABI49_0_0SkiaUIView) {
  bool debug = json != NULL ? [ABI49_0_0RCTConvert BOOL:json] : false;
  [(ABI49_0_0SkiaUIView *)view setDebugMode:debug];
}

- (UIView *)view {
  auto skManager = [[self skiaManager] skManager];
  // Pass SkManager as a raw pointer to avoid circular dependenciesr
  return [[ABI49_0_0SkiaUIView alloc]
      initWithManager:skManager.get()
              factory:[](std::shared_ptr<ABI49_0_0RNSkia::ABI49_0_0RNSkPlatformContext> context) {
                return std::make_shared<ABI49_0_0RNSkiOSView<ABI49_0_0RNSkia::ABI49_0_0RNSkDomView>>(
                    context);
              }];
}

@end
