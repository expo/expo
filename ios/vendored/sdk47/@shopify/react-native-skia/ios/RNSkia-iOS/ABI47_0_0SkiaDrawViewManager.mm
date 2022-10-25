#include <ABI47_0_0SkiaDrawViewManager.h>
#include <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>

#include <ABI47_0_0RNSkPlatformContext.h>
#include <ABI47_0_0RNSkJsView.h>
#include <ABI47_0_0RNSkIOSView.h>

#include <ABI47_0_0SkiaManager.h>
#include <ABI47_0_0RNSkiaModule.h>
#include <ABI47_0_0SkiaUIView.h>



@implementation ABI47_0_0SkiaDrawViewManager

ABI47_0_0RCT_EXPORT_MODULE(ABI47_0_0SkiaDrawView)

- (ABI47_0_0SkiaManager*) skiaManager {
  auto bridge = [ABI47_0_0RCTBridge currentBridge];
  auto skiaModule = (ABI47_0_0RNSkiaModule*)[bridge moduleForName:@"RNSkia"];
  return [skiaModule manager];
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSNumber, ABI47_0_0SkiaUIView) {
  // Get parameter
  int nativeId = [[ABI47_0_0RCTConvert NSString:json] intValue];
  [(ABI47_0_0SkiaUIView*)view setNativeId:nativeId];            
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(mode, NSString, ABI47_0_0SkiaUIView) {
  std::string mode = json != NULL ? [[ABI47_0_0RCTConvert NSString:json] UTF8String] : "default";
  [(ABI47_0_0SkiaUIView*)view setDrawingMode: mode];
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(debug, BOOL, ABI47_0_0SkiaUIView) {
  bool debug = json != NULL ? [ABI47_0_0RCTConvert BOOL:json] : false;
  [(ABI47_0_0SkiaUIView*)view setDebugMode: debug];
}

- (UIView *)view
{
  auto skManager = [[self skiaManager] skManager];
  // Pass SkManager as a raw pointer to avoid circular dependenciesr
  return [[ABI47_0_0SkiaUIView alloc] initWithManager: skManager.get()
                                     factory: [](std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkPlatformContext> context) {
    return std::make_shared<ABI47_0_0RNSkiOSView<ABI47_0_0RNSkia::ABI47_0_0RNSkJsView>>(context);
  }];
}

@end
