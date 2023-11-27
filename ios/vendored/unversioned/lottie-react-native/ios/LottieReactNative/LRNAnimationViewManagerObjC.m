#import <React/RCTViewManager.h>
#import "RCTConvert+Lottie.h"

@interface RCT_EXTERN_MODULE(LottieAnimationView, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
RCT_EXPORT_VIEW_PROPERTY(sourceURL, NSString);
RCT_EXPORT_VIEW_PROPERTY(sourceDotLottieURI, NSString);
RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
RCT_EXPORT_VIEW_PROPERTY(autoPlay, BOOL);
RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onAnimationFailure, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onAnimationLoaded, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(colorFilters, LRNColorFilters);
RCT_EXPORT_VIEW_PROPERTY(textFiltersIOS, NSArray);
RCT_EXPORT_VIEW_PROPERTY(renderMode, NSString);

RCT_EXTERN_METHOD(play:(nonnull NSNumber *)reactTag fromFrame:(nonnull NSNumber *) startFrame toFrame:(nonnull NSNumber *) endFrame);

RCT_EXTERN_METHOD(reset:(nonnull NSNumber *)reactTag);
RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)reactTag);
RCT_EXTERN_METHOD(resume:(nonnull NSNumber *)reactTag);

@end

