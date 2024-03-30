/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCPicker.h"

#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

@interface RNCPicker() <UIPickerViewDataSource, UIPickerViewDelegate>
@end

@implementation RNCPicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _color = [UIColor blackColor];
    _font = [UIFont systemFontOfSize:21]; // TODO: selected title default should be 23.5
    _selectedIndex = NSNotFound;
    _textAlign = NSTextAlignmentCenter;
    _numberOfLines = 1;
#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
    self.delegate = self;
#endif
    self.dataSource = self;
    [self selectRow:0 inComponent:0 animated:YES]; // Workaround for missing selection indicator lines (see https://stackoverflow.com/questions/39564660/uipickerview-selection-indicator-not-visible-in-ios10)
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)setItems:(NSArray<NSDictionary *> *)items
{
  _items = [items copy];
  [self setNeedsLayout];
}

- (void)setSelectedIndex:(NSInteger)selectedIndex
{
  if (_selectedIndex != selectedIndex) {
    BOOL animated = _selectedIndex != NSNotFound; // Don't animate the initial value
    _selectedIndex = selectedIndex;
    dispatch_async(dispatch_get_main_queue(), ^{
      [self selectRow:selectedIndex inComponent:0 animated:animated];
    });
  }
}

- (void)setNumberOfLines:(NSInteger)numberOfLines
{
  _numberOfLines = numberOfLines;
  [self reloadAllComponents];
  [self setNeedsLayout];
}

- (void) setFont:(UIFont *)font
{
  _font = font;
  [self reloadAllComponents];
  [self setNeedsLayout];
}

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return 1;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView
numberOfRowsInComponent:(__unused NSInteger)component
{
  return _items.count;
}

#pragma mark - UIPickerViewDelegate methods

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(__unused NSInteger)component
{
  return [RCTConvert NSString:_items[row][@"label"]];
}

- (CGFloat)pickerView:(__unused UIPickerView *)pickerView rowHeightForComponent:(__unused NSInteger) component {
  return (_font.lineHeight) * _numberOfLines + 20;
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UIView *)view
{
  if (!view) {
      CGFloat rowHeight = [pickerView rowSizeForComponent:component].height;
      CGFloat rowWidth = [pickerView rowSizeForComponent:component].width;
      view = [[UIView alloc] initWithFrame:CGRectZero];
      RNCPickerLabel* label = [[RNCPickerLabel alloc] initWithFrame:(CGRect) {
          CGPointZero,
          {
              rowWidth,
              rowHeight,
          }
      }];
    [view insertSubview:label atIndex:0];
  }

  RNCPickerLabel* label = view.subviews[0];
  label.font = _font;

  label.textColor =
#ifdef RCT_NEW_ARCH_ENABLED
    _items[row][@"textColor"]
#else
     [RCTConvert UIColor:_items[row][@"textColor"]]
#endif
     ?: _color;

  label.textAlignment = _textAlign;
  label.text = [self pickerView:pickerView titleForRow:row forComponent:component];
  label.accessibilityIdentifier = _items[row][@"testID"];
    
  label.numberOfLines = _numberOfLines;

  label.leftInset = 20.0;
  label.rightInset = 20.0;
  
  return view;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component
{
  _selectedIndex = row;
  if (_onChange && _items.count > (NSUInteger)row) {
    _onChange(@{
      @"newIndex": @(row),
      @"newValue": RCTNullIfNil(_items[row][@"value"]),
    });
  }
}

#ifdef RCT_NEW_ARCH_ENABLED
- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component
  withEventEmitter:(facebook::react::SharedViewEventEmitter)eventEmitter
{
    _selectedIndex = row;
      if (eventEmitter != nullptr && _items.count > (NSUInteger)row) {
          std::dynamic_pointer_cast<const facebook::react::RNCPickerEventEmitter>(eventEmitter)
              ->onChange(facebook::react::RNCPickerEventEmitter::OnChange{
                  .newIndex = (int)row,
                  .newValue =  RCTStringFromNSString(RCTNullIfNil(_items[row][@"value"])),
              });
        }
}
#endif

@end
