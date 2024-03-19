#import "RNDateTimePickerShadowView.h"

@implementation RNDateTimePickerShadowView

- (instancetype)init
{
  if (self = [super init]) {
    YGNodeSetMeasureFunc(self.yogaNode, RNDateTimePickerShadowViewMeasure);
  }
  return self;
}

- (void)setDate:(NSDate *)date {
  _date = date;
  YGNodeMarkDirty(self.yogaNode);
}

- (void)setLocale:(NSLocale *)locale {
  _locale = locale;
  YGNodeMarkDirty(self.yogaNode);
}

- (void)setMode:(UIDatePickerMode)mode {
  _mode = mode;
  YGNodeMarkDirty(self.yogaNode);
}


- (void)setDisplayIOS:(UIDatePickerStyle)displayIOS {
  _displayIOS = displayIOS;
  YGNodeMarkDirty(self.yogaNode);
}

- (void)setTimeZoneOffsetInMinutes:(NSInteger)timeZoneOffsetInMinutes {
  _timeZoneOffsetInMinutes = timeZoneOffsetInMinutes;
  YGNodeMarkDirty(self.yogaNode);
}

- (void)setTimeZoneName:(NSString *)timeZoneName {
  _timeZoneName = timeZoneName;
  YGNodeMarkDirty(self.yogaNode);
}

static YGSize RNDateTimePickerShadowViewMeasure(YGNodeConstRef node, float width, YGMeasureMode widthMode, float height, YGMeasureMode heightMode)
{
  RNDateTimePickerShadowView *shadowPickerView = (__bridge RNDateTimePickerShadowView *)YGNodeGetContext(node);

  __block CGSize size;
  dispatch_sync(dispatch_get_main_queue(), ^{
    [shadowPickerView.picker setDate:shadowPickerView.date];
    [shadowPickerView.picker setDatePickerMode:shadowPickerView.mode];
    [shadowPickerView.picker setLocale:shadowPickerView.locale];
    [shadowPickerView.picker setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:shadowPickerView.timeZoneOffsetInMinutes * 60]];

    if (shadowPickerView.timeZoneName) {
      NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:shadowPickerView.timeZoneName];
      if (timeZone != nil) {
        [shadowPickerView.picker setTimeZone:timeZone];
      } else {
        RCTLogWarn(@"'%@' does not exist in NSTimeZone.knownTimeZoneNames. Falling back to localTimeZone=%@", shadowPickerView.timeZoneName, NSTimeZone.localTimeZone.name);
        [shadowPickerView.picker setTimeZone:NSTimeZone.localTimeZone];
      }
    } else {
      [shadowPickerView.picker setTimeZone:NSTimeZone.localTimeZone];
    }

    if (@available(iOS 14.0, *)) {
      [shadowPickerView.picker setPreferredDatePickerStyle:shadowPickerView.displayIOS];
    }

    size = [shadowPickerView.picker sizeThatFits:UILayoutFittingCompressedSize];
    size.width += 10;
  });

  return (YGSize){
    RCTYogaFloatFromCoreGraphicsFloat(size.width),
    RCTYogaFloatFromCoreGraphicsFloat(size.height)
  };
}

@end
