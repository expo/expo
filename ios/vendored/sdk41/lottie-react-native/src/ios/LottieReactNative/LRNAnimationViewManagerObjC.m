#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>

@interface ABI41_0_0RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ABI41_0_0LottieAnimationView, ABI41_0_0RCTViewManager)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI41_0_0RCTBubblingEventBlock);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(colorFilters, NSArray);

ABI41_0_0RCT_EXTERN_METHOD(play:(nonnull NSNumber *)ABI41_0_0ReactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

ABI41_0_0RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)ABI41_0_0ReactTag);
ABI41_0_0RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)ABI41_0_0ReactTag);
ABI41_0_0RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)ABI41_0_0ReactTag);

@end

