#import <React/RCTShadowView.h>
#import "RNDateTimePicker.h"

@interface RNDateTimePickerShadowView : RCTShadowView

@property (nullable, nonatomic, strong) RNDateTimePicker *picker;
@property (nonatomic) UIDatePickerMode mode;
@property (nullable, nonatomic, strong) NSDate *date;
@property (nullable, nonatomic, strong) NSLocale *locale;
@property (nonatomic, assign) UIDatePickerStyle displayIOS API_AVAILABLE(ios(13.4));

@end
