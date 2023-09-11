#import "ABI47_0_0RNDateTimePickerShadowView.h"

@implementation ABI47_0_0RNDateTimePickerShadowView

- (instancetype)init
{
  if (self = [super init]) {
    ABI47_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI47_0_0RNDateTimePickerShadowViewMeasure);
  }
  return self;
}

- (void)setDate:(NSDate *)date {
  _date = date;
  ABI47_0_0YGNodeMarkDirty(self.yogaNode);
}

- (void)setLocale:(NSLocale *)locale {
  _locale = locale;
  ABI47_0_0YGNodeMarkDirty(self.yogaNode);
}

- (void)setMode:(UIDatePickerMode)mode {
  _mode = mode;
  ABI47_0_0YGNodeMarkDirty(self.yogaNode);
}


- (void)setDisplayIOS:(UIDatePickerStyle)displayIOS {
  _displayIOS = displayIOS;
  ABI47_0_0YGNodeMarkDirty(self.yogaNode);
}

static ABI47_0_0YGSize ABI47_0_0RNDateTimePickerShadowViewMeasure(ABI47_0_0YGNodeRef node, float width, ABI47_0_0YGMeasureMode widthMode, float height, ABI47_0_0YGMeasureMode heightMode)
{
  ABI47_0_0RNDateTimePickerShadowView *shadowPickerView = (__bridge ABI47_0_0RNDateTimePickerShadowView *)ABI47_0_0YGNodeGetContext(node);

  __block CGSize size;
  dispatch_sync(dispatch_get_main_queue(), ^{
    [shadowPickerView.picker setDate:shadowPickerView.date];
    [shadowPickerView.picker setDatePickerMode:shadowPickerView.mode];
    [shadowPickerView.picker setLocale:shadowPickerView.locale];
    if (@available(iOS 14.0, *)) {
      [shadowPickerView.picker setPreferredDatePickerStyle:shadowPickerView.displayIOS];
    }
    size = [shadowPickerView.picker sizeThatFits:UILayoutFittingCompressedSize];
  });
  
  return (ABI47_0_0YGSize){
    ABI47_0_0RCTYogaFloatFromCoreGraphicsFloat(size.width),
    ABI47_0_0RCTYogaFloatFromCoreGraphicsFloat(size.height)
  };
}

@end
