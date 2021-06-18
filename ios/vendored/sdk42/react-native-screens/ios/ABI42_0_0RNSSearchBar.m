#import <UIKit/UIKit.h>

#import "ABI42_0_0RNSSearchBar.h"

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTComponent.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>

@implementation ABI42_0_0RNSSearchBar
{
  __weak ABI42_0_0RCTBridge *_bridge;
  UISearchController *_controller;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [UISearchController new];
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
  if (@available(iOS 13.0, *)) {
    [_controller.searchBar.searchTextField setBackgroundColor:barTintColor];
  }
}

#pragma mark delegate methods

- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar
{
  [_controller.searchBar setShowsCancelButton:YES animated:YES];
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
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText
{
  if (self.onChangeText) {
    self.onChangeText(@{
      @"text": _controller.searchBar.text,
    });
  }
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar
{
  if (self.onSearchButtonPress) {
    self.onSearchButtonPress(@{
      @"text": _controller.searchBar.text,
    });
  }
}

#if !TARGET_OS_TV
- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar
{
  _controller.searchBar.text = @"";
  [self resignFirstResponder];
  [_controller.searchBar setShowsCancelButton:NO animated:YES];
    
  if (self.onCancelButtonPress) {
    self.onCancelButtonPress(@{});
  }
  if (self.onChangeText) {
    self.onChangeText(@{
      @"text": _controller.searchBar.text,
    });
  }
}
#endif

@end

@implementation ABI42_0_0RNSSearchBarManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    return [[ABI42_0_0RNSSearchBar alloc] initWithBridge:self.bridge];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(obscureBackground, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(hideNavigationBar, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(hideWhenScrolling, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(autoCapitalize, UITextAutocapitalizationType)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onChangeText, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onCancelButtonPress, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onSearchButtonPress, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onFocus, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onBlur, ABI42_0_0RCTBubblingEventBlock)

@end
