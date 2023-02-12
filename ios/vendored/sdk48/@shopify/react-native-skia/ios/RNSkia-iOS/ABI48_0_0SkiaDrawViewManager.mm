#include "ABI48_0_0SkiaDrawViewManager.h"
#include <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>

#include <ABI48_0_0RNSkPlatformContext.h>
#include <ABI48_0_0RNSkJsView.h>
#include <ABI48_0_0RNSkIOSView.h>

#include "ABI48_0_0SkiaManager.h"
#include <ABI48_0_0RNSkiaModule.h>
#include "ABI48_0_0SkiaUIView.h"



@implementation ABI48_0_0SkiaDrawViewManager

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0SkiaDrawView)

- (ABI48_0_0SkiaManager*) skiaManager {
  auto bridge = [ABI48_0_0RCTBridge currentBridge];
  auto skiaModule = (ABI48_0_0RNSkiaModule*)[bridge moduleForName:@"RNSkia"];
  return [skiaModule manager];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSNumber, ABI48_0_0SkiaUIView) {
  // Get parameter
  int nativeId = [[ABI48_0_0RCTConvert NSString:json] intValue];
  [(ABI48_0_0SkiaUIView*)view setNativeId:nativeId];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(mode, NSString, ABI48_0_0SkiaUIView) {
  std::string mode = json != NULL ? [[ABI48_0_0RCTConvert NSString:json] UTF8String] : "default";
  [(ABI48_0_0SkiaUIView*)view setDrawingMode: mode];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(debug, BOOL, ABI48_0_0SkiaUIView) {
  bool debug = json != NULL ? [ABI48_0_0RCTConvert BOOL:json] : false;
  [(ABI48_0_0SkiaUIView*)view setDebugMode: debug];
}

- (UIView *)view
{
  auto skManager = [[self skiaManager] skManager];
  // Pass SkManager as a raw pointer to avoid circular dependenciesr
  return [[ABI48_0_0SkiaUIView alloc] initWithManager: skManager.get()
                                     factory: [](std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkPlatformContext> context) {
    return std::make_shared<ABI48_0_0RNSkiOSView<ABI48_0_0RNSkia::ABI48_0_0RNSkJsView>>(context);
  }];
}

@end
