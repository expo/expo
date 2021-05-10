#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>

@interface ABI38_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI38_0_0LottieAnimationView, ABI38_0_0RCTViewManager)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI38_0_0RCTBubblingEventBlock);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI38_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)reactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI38_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)reactTag);
ABI38_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)reactTag);
ABI38_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)reactTag);

@end

