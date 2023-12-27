#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

@interface ABI43_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI43_0_0LottieAnimationView, ABI43_0_0RCTViewManager)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI43_0_0RCTBubblingEventBlock);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI43_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI43_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI43_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI43_0_0ReactTag);
ABI43_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI43_0_0ReactTag);
ABI43_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI43_0_0ReactTag);

@end

