#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>

@interface ABI42_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI42_0_0LottieAnimationView, ABI42_0_0RCTViewManager)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI42_0_0RCTBubblingEventBlock);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI42_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI42_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI42_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI42_0_0ReactTag);
ABI42_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI42_0_0ReactTag);
ABI42_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI42_0_0ReactTag);

@end

