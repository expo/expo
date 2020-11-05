#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>

@interface ABI37_0_0RCT_EXTERN_MODULE(ABI37_0_0LottieAnimationView, ABI37_0_0RCTViewManager)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, RCTBubblingEventBlock);
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI37_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)reactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI37_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)reactTag);
ABI37_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)reactTag);
ABI37_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)reactTag);

@end

