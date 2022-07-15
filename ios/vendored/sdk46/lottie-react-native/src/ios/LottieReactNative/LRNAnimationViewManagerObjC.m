#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>
#import "ABI46_0_0RCTConvert+Lottie.h"

@interface ABI46_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI46_0_0LottieAnimationView, ABI46_0_0RCTViewManager)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(sourceURL, NSString);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI46_0_0RCTBubblingEventBlock);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, LRNColorFilters);
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(textFiltersIOS, NSArray);

ABI46_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI46_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI46_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI46_0_0ReactTag);
ABI46_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI46_0_0ReactTag);
ABI46_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI46_0_0ReactTag);

@end

