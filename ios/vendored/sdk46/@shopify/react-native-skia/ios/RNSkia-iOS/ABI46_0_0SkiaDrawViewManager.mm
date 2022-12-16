#include <ABI46_0_0SkiaDrawViewManager.h>
#include <ABI46_0_0React/ABI46_0_0RCTBridge+Private.h>

#include <ABI46_0_0SkiaManager.h>
#include <ABI46_0_0RNSkiaModule.h>
#include <ABI46_0_0RNSkDrawViewImpl.h>
#include <ABI46_0_0SkiaDrawView.h>

@implementation ABI46_0_0SkiaDrawViewManager

- (ABI46_0_0SkiaManager*) skiaManager {
  auto bridge = [ABI46_0_0RCTBridge currentBridge];
  auto skiaModule = (ABI46_0_0RNSkiaModule*)[bridge moduleForName:@"RNSkia"];
  return [skiaModule manager];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSNumber, ABI46_0_0SkiaDrawView) {
  // Get parameter
  int nativeId = [[ABI46_0_0RCTConvert NSString:json] intValue];
  [(ABI46_0_0SkiaDrawView*)view setNativeId:nativeId];            
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(mode, NSString, ABI46_0_0SkiaDrawView) {
  std::string mode = json != NULL ? [[ABI46_0_0RCTConvert NSString:json] UTF8String] : "default";
  [(ABI46_0_0SkiaDrawView*)view setDrawingMode: mode];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(debug, BOOL, ABI46_0_0SkiaDrawView) {
  bool debug = json != NULL ? [ABI46_0_0RCTConvert BOOL:json] : false;
  [(ABI46_0_0SkiaDrawView*)view setDebugMode: debug];
}

ABI46_0_0RCT_EXPORT_MODULE(ABI46_0_0ReactNativeSkiaView)

- (UIView *)view
{
  auto skManager = [[self skiaManager] skManager];
  // Pass SkManager as a raw pointer to avoid circular dependenciesr
  return [[ABI46_0_0SkiaDrawView alloc] initWithManager:skManager.get()];
}

@end
