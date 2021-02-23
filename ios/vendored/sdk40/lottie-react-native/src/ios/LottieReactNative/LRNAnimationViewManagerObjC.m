#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>

@interface ABI40_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI40_0_0LottieAnimationView, ABI40_0_0RCTViewManager)

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI40_0_0RCTBubblingEventBlock);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI40_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)reactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI40_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)reactTag);
ABI40_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)reactTag);
ABI40_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)reactTag);

@end

