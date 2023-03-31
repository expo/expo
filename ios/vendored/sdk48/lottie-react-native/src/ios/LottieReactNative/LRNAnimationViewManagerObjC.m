#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#import "ABI48_0_0RCTConvert+Lottie.h"

@interface ABI48_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI48_0_0LottieAnimationView, ABI48_0_0RCTViewManager)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(sourceURL, NSString);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI48_0_0RCTBubblingEventBlock);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, LRNColorFilters);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(textFiltersIOS, NSArray);

ABI48_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI48_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI48_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI48_0_0ReactTag);
ABI48_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI48_0_0ReactTag);
ABI48_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI48_0_0ReactTag);

@end

