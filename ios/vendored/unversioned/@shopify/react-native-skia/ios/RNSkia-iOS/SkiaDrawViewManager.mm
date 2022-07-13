#include <SkiaDrawViewManager.h>
#include <React/RCTBridge+Private.h>

#include <SkiaManager.h>
#include <RNSkiaModule.h>
#include <RNSkDrawViewImpl.h>
#include <SkiaDrawView.h>

@implementation SkiaDrawViewManager

- (SkiaManager*) skiaManager {
  auto bridge = [RCTBridge currentBridge];
  auto skiaModule = (RNSkiaModule*)[bridge moduleForName:@"RNSkia"];
  return [skiaModule manager];
}

RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSNumber, SkiaDrawView) {
  // Get parameter
  int nativeId = [[RCTConvert NSString:json] intValue];
  [(SkiaDrawView*)view setNativeId:nativeId];            
}

RCT_CUSTOM_VIEW_PROPERTY(mode, NSString, SkiaDrawView) {
  std::string mode = json != NULL ? [[RCTConvert NSString:json] UTF8String] : "default";
  [(SkiaDrawView*)view setDrawingMode: mode];
}

RCT_CUSTOM_VIEW_PROPERTY(debug, BOOL, SkiaDrawView) {
  bool debug = json != NULL ? [RCTConvert BOOL:json] : false;
  [(SkiaDrawView*)view setDebugMode: debug];
}

RCT_EXPORT_MODULE(ReactNativeSkiaView)

- (UIView *)view
{
  auto skManager = [[self skiaManager] skManager];
  // Pass SkManager as a raw pointer to avoid circular dependenciesr
  return [[SkiaDrawView alloc] initWithManager:skManager.get()];
}

@end
