#import "ABI49_0_0RNDateTimePickerShadowView.h"

@implementation ABI49_0_0RNDateTimePickerShadowView

- (instancetype)init
{
  if (self = [super init]) {
    ABI49_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI49_0_0RNDateTimePickerShadowViewMeasure);
  }
  return self;
}

- (void)setDate:(NSDate *)date {
  _date = date;
  ABI49_0_0YGNodeMarkDirty(self.yogaNode);
}

- (void)setLocale:(NSLocale *)locale {
  _locale = locale;
  ABI49_0_0YGNodeMarkDirty(self.yogaNode);
}

- (void)setMode:(UIDatePickerMode)mode {
  _mode = mode;
  ABI49_0_0YGNodeMarkDirty(self.yogaNode);
}


- (void)setDisplayIOS:(UIDatePickerStyle)displayIOS {
  _displayIOS = displayIOS;
  ABI49_0_0YGNodeMarkDirty(self.yogaNode);
}

static ABI49_0_0YGSize ABI49_0_0RNDateTimePickerShadowViewMeasure(ABI49_0_0YGNodeRef node, float width, ABI49_0_0YGMeasureMode widthMode, float height, ABI49_0_0YGMeasureMode heightMode)
{
  ABI49_0_0RNDateTimePickerShadowView *shadowPickerView = (__bridge ABI49_0_0RNDateTimePickerShadowView *)ABI49_0_0YGNodeGetContext(node);

  __block CGSize size;
  dispatch_sync(dispatch_get_main_queue(), ^{
    [shadowPickerView.picker setDate:shadowPickerView.date];
    [shadowPickerView.picker setDatePickerMode:shadowPickerView.mode];
    [shadowPickerView.picker setLocale:shadowPickerView.locale];
    if (@available(iOS 14.0, *)) {
      [shadowPickerView.picker setPreferredDatePickerStyle:shadowPickerView.displayIOS];
    }
	size = [shadowPickerView.picker sizeThatFits:UILayoutFittingCompressedSize];
	size.width += 10;
  });
  
  return (ABI49_0_0YGSize){
    ABI49_0_0RCTYogaFloatFromCoreGraphicsFloat(size.width),
    ABI49_0_0RCTYogaFloatFromCoreGraphicsFloat(size.height)
  };
}

@end
