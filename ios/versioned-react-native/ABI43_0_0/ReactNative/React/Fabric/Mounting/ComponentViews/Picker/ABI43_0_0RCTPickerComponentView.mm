/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTPickerComponentView.h"

#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <UIKit/UIKit.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/iospicker/PickerComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/iospicker/PickerEventEmitter.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/iospicker/PickerProps.h>
#import <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/ABI43_0_0RCTAttributedTextUtils.h>

#import "ABI43_0_0RCTConversions.h"
#import "ABI43_0_0RCTFabricComponentsPlugins.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

@interface ABI43_0_0RCTPickerComponentView () <UIPickerViewAccessibilityDelegate, UIPickerViewDelegate, UIPickerViewDataSource>

@end

@implementation ABI43_0_0RCTPickerComponentView {
  UIPickerView *_pickerView;
  std::vector<PickerItemsStruct> _items;
  NSInteger _selectedIndex;
  NSString *_accessibilityLabel;
  NSDictionary<NSAttributedStringKey, id> *_textAttributes;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _pickerView = [[UIPickerView alloc] initWithFrame:self.bounds];
    self.contentView = _pickerView;
    [self setPropsToDefault];
  }

  return self;
}

- (void)setPropsToDefault
{
  static const auto defaultProps = std::make_shared<const PickerProps>();
  _props = defaultProps;
  _pickerView.delegate = self;
  _pickerView.dataSource = self;
  _selectedIndex = NSNotFound;
  NSMutableParagraphStyle *const paragraphStyle = [NSMutableParagraphStyle new];
  paragraphStyle.alignment = NSTextAlignmentCenter;
  _textAttributes = @{
    NSForegroundColorAttributeName : [UIColor blackColor],
    NSFontAttributeName : [UIFont systemFontOfSize:21],
    NSParagraphStyleAttributeName : paragraphStyle
  };
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _selectedIndex = NSNotFound;
}

#pragma mark - ABI43_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<PickerComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldPickerProps = *std::static_pointer_cast<const PickerProps>(_props);
  const auto &newPickerProps = *std::static_pointer_cast<const PickerProps>(props);
  bool needsToReload = false;

  if (oldPickerProps.items != newPickerProps.items) {
    _items = newPickerProps.items;
    needsToReload = true;
  }

  if (oldPickerProps.selectedIndex != newPickerProps.selectedIndex) {
    _selectedIndex = newPickerProps.selectedIndex;
    [self setSelectedIndex];
  }

  if (oldPickerProps.textAttributes != newPickerProps.textAttributes) {
    _textAttributes = ABI43_0_0RCTNSTextAttributesFromTextAttributes(newPickerProps.getEffectiveTextAttributes());
    needsToReload = true;
  }

  // TODO (T75217510) - Figure out testID.
  if (oldPickerProps.testID != newPickerProps.testID) {
  }

  if (oldPickerProps.accessibilityLabel != newPickerProps.accessibilityLabel) {
    _accessibilityLabel = [NSString stringWithUTF8String:newPickerProps.accessibilityLabel.c_str()];
  }

  if (needsToReload) {
    [_pickerView reloadAllComponents];
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  if ([commandName isEqualToString:@"setNativeSelectedIndex"] && [args objectAtIndex:0]) {
    NSNumber *selectedIndex = [args objectAtIndex:0];
    if (_selectedIndex != selectedIndex.integerValue) {
      [self setSelectedIndex];
    }
  } else {
    ABI43_0_0RCTLogWarn(@"Attempting to send unknown command to Picker component: %@", commandName);
  }
}

- (void)setSelectedIndex
{
  BOOL animated = _selectedIndex != NSNotFound; // Don't animate the initial value.
  [_pickerView selectRow:_selectedIndex inComponent:0 animated:animated];
}

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return 1;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView numberOfRowsInComponent:(__unused NSInteger)component
{
  return _items.size();
}

#pragma mark - UIPickerViewDelegate methods

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(__unused NSInteger)component
{
  return [NSString stringWithUTF8String:_items[row].label.c_str()];
}

- (CGFloat)pickerView:(__unused UIPickerView *)pickerView rowHeightForComponent:(NSInteger)__unused component
{
  return ((UIFont *)_textAttributes[NSFontAttributeName]).pointSize + 19;
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UILabel *)label
{
  if (!label) {
    label = [[UILabel alloc] initWithFrame:(CGRect){CGPointZero,
                                                    {
                                                        [pickerView rowSizeForComponent:component].width,
                                                        [pickerView rowSizeForComponent:component].height,
                                                    }}];
  }
  NSMutableDictionary<NSAttributedStringKey, id> *attributes = [_textAttributes mutableCopy];
  // Color can be passed in from <Picker style={}/> or from <Picker.Item color={}/>
  // If Picker.Item color is set, use that. Else fall back to Picker style (with black as default).
  if (ABI43_0_0RCTUIColorFromSharedColor(_items[row].textColor)) {
    attributes[NSForegroundColorAttributeName] = ABI43_0_0RCTUIColorFromSharedColor(_items[row].textColor);
  }
  label.attributedText = [[NSAttributedString alloc] initWithString:[self pickerView:pickerView
                                                                         titleForRow:row
                                                                        forComponent:component]
                                                         attributes:attributes];
  return label;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(__unused NSInteger)component
{
  _selectedIndex = row;
  PickerEventEmitter::PickerIOSChangeEvent event = {.newValue = _items[row].value, .newIndex = (int)row};
  if (_eventEmitter) {
    std::static_pointer_cast<PickerEventEmitter const>(_eventEmitter)->onChange(event);
  }
}

#pragma mark - UIPickerViewAccessibilityDelegate protocol

- (NSString *)pickerView:(UIPickerView *)pickerView accessibilityLabelForComponent:(NSInteger)component
{
  return _accessibilityLabel;
}

@end

Class<ABI43_0_0RCTComponentViewProtocol> ABI43_0_0RCTPickerCls(void)
{
  return ABI43_0_0RCTPickerComponentView.class;
}
