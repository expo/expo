// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXAppleAuthentication/ABI36_0_0EXAppleAuthenticationButton.h>

@implementation ABI36_0_0EXAppleAuthenticationButton

-(instancetype)initWithAuthorizationButtonType:(ASAuthorizationAppleIDButtonType)type
                      authorizationButtonStyle:(ASAuthorizationAppleIDButtonStyle)style
{
  if (self = [super initWithAuthorizationButtonType:type
                           authorizationButtonStyle:style]) {
    [self addTarget:self
             action:@selector(onDidPress)
   forControlEvents:UIControlEventTouchUpInside];
  }
  return self;
}

- (void)onDidPress {
  _onButtonPress(nil);
}

@end
