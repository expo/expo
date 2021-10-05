#import <UIKit/UIKit.h>

#import "RNSSearchBar.h"

#import <React/RCTBridge.h>
#import <React/RCTComponent.h>
#import <React/RCTUIManager.h>

@implementation RNSSearchBar {
  __weak RCTBridge *_bridge;
  UISearchController *_controller;
  UIColor *_textColor;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[UISearchController alloc] initWithSearchResultsController:nil];
    _controller.searchBar.delegate = self;
    _hideWhenScrolling = YES;
  }
  return self;
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

  if (self.onFocus) {
    self.onFocus(@{});
  }
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar
{
  if (self.onBlur) {
    self.onBlur(@{});
  }
  [self hideCancelButton];
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText
{
  if (self.onChangeText) {
    self.onChangeText(@{
      @"text" : _controller.searchBar.text,
    });
  }
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar
{
  if (self.onSearchButtonPress) {
    self.onSearchButtonPress(@{
      @"text" : _controller.searchBar.text,
    });
  }
}

#if !TARGET_OS_TV
- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar
{
  _controller.searchBar.text = @"";
  [self resignFirstResponder];
  [self hideCancelButton];

  if (self.onCancelButtonPress) {
    self.onCancelButtonPress(@{});
  }
  if (self.onChangeText) {
    self.onChangeText(@{
      @"text" : _controller.searchBar.text,
    });
  }
}
#endif

@end

@implementation RNSSearchBarManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RNSSearchBar alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_VIEW_PROPERTY(obscureBackground, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hideNavigationBar, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hideWhenScrolling, BOOL)
RCT_EXPORT_VIEW_PROPERTY(autoCapitalize, UITextAutocapitalizationType)
RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(cancelButtonText, NSString)

RCT_EXPORT_VIEW_PROPERTY(onChangeText, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCancelButtonPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSearchButtonPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFocus, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onBlur, RCTBubblingEventBlock)

@end
