#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>
#import "ABI45_0_0RCTConvert+Lottie.h"

@interface ABI45_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI45_0_0LottieAnimationView, ABI45_0_0RCTViewManager)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI45_0_0RCTBubblingEventBlock);
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, LRNColorFilters);

ABI45_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI45_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI45_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI45_0_0ReactTag);
ABI45_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI45_0_0ReactTag);
ABI45_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI45_0_0ReactTag);

@end

