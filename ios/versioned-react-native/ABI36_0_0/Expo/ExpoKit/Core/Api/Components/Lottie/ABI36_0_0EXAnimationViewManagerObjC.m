#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>

@interface ABI36_0_0RCT_EXTERN_MODULE(ABI36_0_0LottieAnimationView, ABI36_0_0RCTViewManager)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, RCTBubblingEventBlock);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI36_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)reactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI36_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)reactTag);
ABI36_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)reactTag);
ABI36_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)reactTag);

@end

