#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#import "ABI47_0_0RCTConvert+Lottie.h"

@interface ABI47_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI47_0_0LottieAnimationView, ABI47_0_0RCTViewManager)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(sourceURL, NSString);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI47_0_0RCTBubblingEventBlock);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, LRNColorFilters);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(textFiltersIOS, NSArray);

ABI47_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI47_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI47_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI47_0_0ReactTag);
ABI47_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI47_0_0ReactTag);
ABI47_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI47_0_0ReactTag);

@end

