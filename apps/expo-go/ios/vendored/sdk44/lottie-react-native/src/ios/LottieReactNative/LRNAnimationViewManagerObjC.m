#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>
#import "ABI44_0_0RCTConvert+Lottie.h"

@interface ABI44_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI44_0_0LottieAnimationView, ABI44_0_0RCTViewManager)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI44_0_0RCTBubblingEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, LRNColorFilters);

ABI44_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI44_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI44_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI44_0_0ReactTag);
ABI44_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI44_0_0ReactTag);
ABI44_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI44_0_0ReactTag);

@end

