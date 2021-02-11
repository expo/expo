#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>

@interface ABI39_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI39_0_0LottieAnimationView, ABI39_0_0RCTViewManager)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI39_0_0RCTBubblingEventBlock);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI39_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)reactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI39_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)reactTag);
ABI39_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)reactTag);
ABI39_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)reactTag);

@end

