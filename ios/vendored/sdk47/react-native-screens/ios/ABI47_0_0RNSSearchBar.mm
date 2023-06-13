#import <UIKit/UIKit.h>

#import "ABI47_0_0RNSSearchBar.h"

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTComponent.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/EventEmitters.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/ABI47_0_0RCTComponentViewHelpers.h>
#import "ABI47_0_0RNSConvert.h"
#endif

@implementation ABI47_0_0RNSSearchBar {
  __weak ABI47_0_0RCTBridge *_bridge;
  UISearchController *_controller;
  UIColor *_textColor;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    [self initCommonProps];
  }
  return self;
}

#ifdef RN_FABRIC_ENABLED
- (instancetype)init
{
  if (self = [super init]) {
    static const auto defaultProps = std::make_shared<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarProps>();
    _props = defaultProps;
    [self initCommonProps];
  }
  return self;
}
#endif

- (void)initCommonProps
{
  _controller = [[UISearchController alloc] initWithSearchResultsController:nil];
  _controller.searchBar.delegate = self;
  _hideWhenScrolling = YES;
}

- (void)emitOnFocusEvent
{
#ifdef RN_FABRIC_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter>(_eventEmitter)
        ->onFocus(ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter::OnFocus{});
  }
#else
  if (self.onFocus) {
    self.onFocus(@{});
  }
#endif
}

- (void)emitOnBlurEvent
{
#ifdef RN_FABRIC_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter>(_eventEmitter)
        ->onBlur(ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter::OnBlur{});
  }
#else
  if (self.onBlur) {
    self.onBlur(@{});
  }
#endif
}

- (void)emitOnSearchButtonPressEventWithText:(NSString *)text
{
#ifdef RN_FABRIC_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter>(_eventEmitter)
        ->onSearchButtonPress(
            ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter::OnSearchButtonPress{.text = ABI47_0_0RCTStringFromNSString(text)});
  }
#else
  if (self.onSearchButtonPress) {
    self.onSearchButtonPress(@{
      @"text" : text,
    });
  }
#endif
}

- (void)emitOnCancelButtonPressEvent
{
#ifdef RN_FABRIC_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter>(_eventEmitter)
        ->onCancelButtonPress(ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter::OnCancelButtonPress{});
  }
#else
  if (self.onCancelButtonPress) {
    self.onCancelButtonPress(@{});
  }
#endif
}

- (void)emitOnChangeTextEventWithText:(NSString *)text
{
#ifdef RN_FABRIC_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter>(_eventEmitter)
        ->onChangeText(ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarEventEmitter::OnChangeText{.text = ABI47_0_0RCTStringFromNSString(text)});
  }
#else
  if (self.onChangeText) {
    self.onChangeText(@{
      @"text" : text,
    });
  }
#endif
}

- (void)setObscureBackground:(BOOL)obscureBackground
{
  if (@available(iOS 9.1, *)) {
    [_controller setObscuresBackgroundDuringPresentation:obscureBackground];
  }
}

- (void)setHideNavigationBar:(BOOL)hideNavigationBar
{
  [_controller setHidesNavigationBarDuringPresentation:hideNavigationBar];
}

- (void)setHideWhenScrolling:(BOOL)hideWhenScrolling
{
  _hideWhenScrolling = hideWhenScrolling;
}

- (void)setAutoCapitalize:(UITextAutocapitalizationType)autoCapitalize
{
  [_controller.searchBar setAutocapitalizationType:autoCapitalize];
}

- (void)setPlaceholder:(NSString *)placeholder
{
  [_controller.searchBar setPlaceholder:placeholder];
}

- (void)setBarTintColor:(UIColor *)barTintColor
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0 && !TARGET_OS_TV
  if (@available(iOS 13.0, *)) {
    [_controller.searchBar.searchTextField setBackgroundColor:barTintColor];
  }
#endif
}

- (void)setTintColor:(UIColor *)tintColor
{
  [_controller.searchBar setTintColor:tintColor];
}

- (void)setTextColor:(UIColor *)textColor
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0 && !TARGET_OS_TV
  _textColor = textColor;
  if (@available(iOS 13.0, *)) {
    [_controller.searchBar.searchTextField setTextColor:_textColor];
  }
#endif
}

- (void)setCancelButtonText:(NSString *)text
{
  [_controller.searchBar setValue:text forKey:@"cancelButtonText"];
}

- (void)hideCancelButton
{
#if !TARGET_OS_TV
  if (@available(iOS 13, *)) {
    // On iOS 13+ UISearchController automatically shows/hides cancel button
    // https://developer.apple.com/documentation/uikit/uisearchcontroller/3152926-automaticallyshowscancelbutton?language=objc
  } else {
    [_controller.searchBar setShowsCancelButton:NO animated:YES];
  }
#endif
}

- (void)showCancelButton
{
#if !TARGET_OS_TV
  if (@available(iOS 13, *)) {
    // On iOS 13+ UISearchController automatically shows/hides cancel button
    // https://developer.apple.com/documentation/uikit/uisearchcontroller/3152926-automaticallyshowscancelbutton?language=objc
  } else {
    [_controller.searchBar setShowsCancelButton:YES animated:YES];
  }
#endif
}

#pragma mark delegate methods

- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0 && !TARGET_OS_TV
  if (@available(iOS 13.0, *)) {
    // for some reason, the color does not change when set at the beginning,
    // so we apply it again here
    if (_textColor != nil) {
      [_controller.searchBar.searchTextField setTextColor:_textColor];
    }
  }
#endif

  [self showCancelButton];
  [self becomeFirstResponder];
  [self emitOnFocusEvent];
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar
{
  [self emitOnBlurEvent];
  [self hideCancelButton];
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText
{
  [self emitOnChangeTextEventWithText:_controller.searchBar.text];
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar
{
  [self emitOnSearchButtonPressEventWithText:_controller.searchBar.text];
}

#if !TARGET_OS_TV
- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar
{
  _controller.searchBar.text = @"";
  [self resignFirstResponder];
  [self hideCancelButton];

  [self emitOnCancelButtonPressEvent];
  [self emitOnChangeTextEventWithText:_controller.searchBar.text];
}
#endif // !TARGET_OS_TV

#pragma mark-- Fabric specific

#ifdef RN_FABRIC_ENABLED
- (void)updateProps:(ABI47_0_0facebook::ABI47_0_0React::Props::Shared const &)props
           oldProps:(ABI47_0_0facebook::ABI47_0_0React::Props::Shared const &)oldProps
{
  const auto &oldScreenProps = *std::static_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarProps>(_props);
  const auto &newScreenProps = *std::static_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarProps>(props);

  [self setHideWhenScrolling:newScreenProps.hideWhenScrolling];

  if (oldScreenProps.cancelButtonText != newScreenProps.cancelButtonText) {
    [self setCancelButtonText:ABI47_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.cancelButtonText)];
  }

  if (oldScreenProps.obscureBackground != newScreenProps.obscureBackground) {
    [self setObscureBackground:newScreenProps.obscureBackground];
  }

  if (oldScreenProps.hideNavigationBar != newScreenProps.hideNavigationBar) {
    [self setHideNavigationBar:newScreenProps.hideNavigationBar];
  }

  if (oldScreenProps.placeholder != newScreenProps.placeholder) {
    [self setPlaceholder:ABI47_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.placeholder)];
  }

  if (oldScreenProps.autoCapitalize != newScreenProps.autoCapitalize) {
    [self setAutoCapitalize:[ABI47_0_0RNSConvert UITextAutocapitalizationTypeFromCppEquivalent:newScreenProps.autoCapitalize]];
  }

  if (oldScreenProps.tintColor != newScreenProps.tintColor) {
    [self setTintColor:ABI47_0_0RCTUIColorFromSharedColor(newScreenProps.tintColor)];
  }

  if (oldScreenProps.barTintColor != newScreenProps.barTintColor) {
    [self setBarTintColor:ABI47_0_0RCTUIColorFromSharedColor(newScreenProps.barTintColor)];
  }

  if (oldScreenProps.textColor != newScreenProps.textColor) {
    [self setTextColor:ABI47_0_0RCTUIColorFromSharedColor(newScreenProps.textColor)];
  }

  [super updateProps:props oldProps:oldProps];
}

+ (ABI47_0_0facebook::ABI47_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI47_0_0facebook::ABI47_0_0React::concreteComponentDescriptorProvider<ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarComponentDescriptor>();
}

#else
#endif

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSSearchBarCls(void)
{
  return ABI47_0_0RNSSearchBar.class;
}
#endif

@implementation ABI47_0_0RNSSearchBarManager

ABI47_0_0RCT_EXPORT_MODULE()

#ifdef RN_FABRIC_ENABLED
#else
- (UIView *)view
{
  return [[ABI47_0_0RNSSearchBar alloc] initWithBridge:self.bridge];
}
#endif

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(obscureBackground, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(hideNavigationBar, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(hideWhenScrolling, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(autoCapitalize, UITextAutocapitalizationType)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cancelButtonText, NSString)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onChangeText, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onCancelButtonPress, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onSearchButtonPress, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onFocus, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onBlur, ABI47_0_0RCTBubblingEventBlock)

@end
