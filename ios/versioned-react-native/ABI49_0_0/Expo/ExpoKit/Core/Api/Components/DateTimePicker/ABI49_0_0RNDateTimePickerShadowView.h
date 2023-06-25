#import <ABI49_0_0React/ABI49_0_0RCTShadowView.h>
#import "ABI49_0_0RNDateTimePicker.h"

@interface ABI49_0_0RNDateTimePickerShadowView : ABI49_0_0RCTShadowView

@property (nullable, nonatomic, strong) ABI49_0_0RNDateTimePicker *picker;
@property (nonatomic) UIDatePickerMode mode;
@property (nullable, nonatomic, strong) NSDate *date;
@property (nullable, nonatomic, strong) NSLocale *locale;
@property (nonatomic, assign) UIDatePickerStyle displayIOS API_AVAILABLE(ios(13.4));

@end
