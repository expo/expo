#ifdef RCT_NEW_ARCH_ENABLED

#import "RNCPickerComponentView.h"
#import "RNCPicker.h"

#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnpicker/ComponentDescriptors.h>
#import <react/renderer/components/rnpicker/Props.h>
#import <react/renderer/components/rnpicker/RCTComponentViewHelpers.h>
#import <React/RCTFont.h>

using namespace facebook::react;

@interface RNCPickerComponentView() <
UIPickerViewDelegate
#ifdef RCT_NEW_ARCH_ENABLED
, RCTRNCPickerViewProtocol
#endif
>
@end

@implementation RNCPickerComponentView
{
    RNCPicker *picker;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNCPickerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const RNCPickerProps>();
        _props = defaultProps;
        picker = [[RNCPicker alloc] initWithFrame:self.bounds];
        self.contentView = picker;
        picker.delegate = self;
    }
    return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &newProps = *std::static_pointer_cast<const RNCPickerProps>(props);
    NSMutableArray *items = [NSMutableArray new];
    for (RNCPickerItemsStruct item : newProps.items)
    {
        NSMutableDictionary *dictItem = [NSMutableDictionary new];
        dictItem[@"value"] = RCTNSStringFromStringNilIfEmpty(item.value);
        dictItem[@"label"] = RCTNSStringFromStringNilIfEmpty(item.label);
        dictItem[@"textColor"] = RCTUIColorFromSharedColor(item.textColor);
        dictItem[@"testID"] = RCTNSStringFromStringNilIfEmpty(item.testID);
        [items addObject:dictItem];
    }
    picker.items = items;
    picker.selectedIndex = newProps.selectedIndex;
    picker.color = RCTUIColorFromSharedColor(newProps.color);
    NSString *textAlign = RCTNSStringFromStringNilIfEmpty(newProps.themeVariant);
    if ([textAlign isEqualToString:@"auto"]){
        picker.textAlign = NSTextAlignmentNatural;
    } else if ([textAlign isEqualToString:@"left"]){
        picker.textAlign = NSTextAlignmentLeft;
    } else if ([textAlign isEqualToString:@"center"]){
        picker.textAlign = NSTextAlignmentCenter;
    } else if ([textAlign isEqualToString:@"right"]){
        picker.textAlign = NSTextAlignmentRight;
    } else if ([textAlign isEqualToString:@"justify"]){
        picker.textAlign = NSTextAlignmentJustified;
    }
    picker.numberOfLines = newProps.numberOfLines;
    picker.font = [RCTFont updateFont:picker.font withFamily:RCTNSStringFromStringNilIfEmpty(newProps.fontFamily) size:@(newProps.fontSize) weight:RCTNSStringFromStringNilIfEmpty(newProps.fontWeight) style:RCTNSStringFromStringNilIfEmpty(newProps.fontStyle) variant:nil scaleMultiplier:1];
    if (@available(iOS 13.4, *)) {
        NSString *themeVariant = RCTNSStringFromStringNilIfEmpty(newProps.themeVariant);
            if (themeVariant) {
                if ([themeVariant isEqual:@"dark"])
                    picker.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
                else if ([themeVariant isEqual:@"light"])
                    picker.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
                else
                    picker.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
            }
        }
    [super updateProps:props oldProps:oldProps];
}

// already added in case https://github.com/facebook/react-native/pull/35378 has been merged
- (BOOL)shouldBeRecycled
{
    return NO;
}

- (void)prepareForRecycle
{
    picker = [[RNCPicker alloc] initWithFrame:self.bounds];
    self.contentView = picker;
    picker.delegate = self;
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
    RCTRNCPickerHandleCommand(self, commandName, args);
}

- (void)setNativeSelectedIndex:(NSInteger)selectedIndex
{
    picker.selectedIndex = selectedIndex;
}

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return [picker numberOfComponentsInPickerView:pickerView];
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView
numberOfRowsInComponent:(__unused NSInteger)component
{
  return [picker pickerView:pickerView numberOfRowsInComponent:component];
}

#pragma mark - UIPickerViewDelegate methods

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(__unused NSInteger)component
{
  return [picker pickerView:pickerView titleForRow:row forComponent:component];
}

- (CGFloat)pickerView:(__unused UIPickerView *)pickerView rowHeightForComponent:(__unused NSInteger) component {
  return [picker pickerView:pickerView rowHeightForComponent:component];
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UIView *)view
{
    return [picker pickerView:pickerView viewForRow:row forComponent:component reusingView:view];
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component
{
    [picker pickerView:pickerView didSelectRow:row inComponent:component withEventEmitter:_eventEmitter];
}

@end

Class<RCTComponentViewProtocol> RNCPickerCls(void)
{
    return RNCPickerComponentView.class;
}

#endif
