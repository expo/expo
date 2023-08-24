#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>
#import "ABI49_0_0RCTConvert+Lottie.h"

@interface ABI49_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI49_0_0LottieAnimationView, ABI49_0_0RCTViewManager)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(sourceURL, NSString);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI49_0_0RCTBubblingEventBlock);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, LRNColorFilters);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(textFiltersIOS, NSArray);

ABI49_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI49_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI49_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI49_0_0ReactTag);
ABI49_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI49_0_0ReactTag);
ABI49_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI49_0_0ReactTag);

@end

