#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

#import <UIKit/UIKit.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#import "ABI49_0_0RNCSlider.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI49_0_0RNCLoadImageCompletionBlock)(NSError * _Nullable error, UIImage * _Nullable image);
typedef void (^ABI49_0_0RNCLoadImageFailureBlock)();

@interface ABI49_0_0RNCSliderComponentView : ABI49_0_0RCTViewComponentView

@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onRNCSliderValueChange;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onRNCSliderSlidingStart;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onRNCSliderSlidingComplete;

@property (nonatomic, assign) float step;
@property (nonatomic, assign) float lastValue;
@property (nonatomic, assign) bool isSliding;

@property (nonatomic, assign) float lowerLimit;
@property (nonatomic, assign) float upperLimit;

@property (nonatomic, strong) UIImage *trackImage;
@property (nonatomic, strong) UIImage *minimumTrackImage;
@property (nonatomic, strong) UIImage *maximumTrackImage;
@property (nonatomic, strong) UIImage *thumbImage;
@property (nonatomic, assign) bool tapToSeek;
@property (nonatomic, strong) NSString *accessibilityUnits;
@property (nonatomic, strong) NSArray *accessibilityIncrements;

- (float) discreteValue:(float)value;

@end

NS_ASSUME_NONNULL_END

#endif
