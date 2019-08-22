#import "RNCSignInWithAppleButton.h"

@implementation RNCSignInWithAppleButton {
  ASAuthorizationAppleIDButton *_button;
}

- (void)onDidPress {
  _onPress(nil);
}

- (void)setType:(NSNumber *)type
{
  _type = type;
  [self loadButton];
}

- (void)setStyle:(NSNumber *)style
{
  _style = style;
  [self loadButton];
}

- (void)setCornerRadius:(NSNumber *)cornerRadius
{
  _cornerRadius = cornerRadius;
  if (_button) {
    _button.cornerRadius = [_cornerRadius floatValue];
  }
}

- (void)loadButton
{
  if (_type && _style) {
    _button = [[ASAuthorizationAppleIDButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonTypeDefault
                                                           authorizationButtonStyle:ASAuthorizationAppleIDButtonStyleBlack];

    [_button addTarget:self
                action:@selector(onDidPress)
      forControlEvents:UIControlEventTouchUpInside];
    
    if (_cornerRadius) {
      _button.cornerRadius = [_cornerRadius floatValue];
    }
  }
}

- (void)layoutSubviews
{
  [self addSubview:_button];
}

@end
