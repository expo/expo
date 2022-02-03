// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXUtilities.h>

@import AuthenticationServices;

API_AVAILABLE(ios(13.0))
@interface EXAppleAuthenticationButton : ASAuthorizationAppleIDButton

@property (nonatomic, copy) EXDirectEventBlock onButtonPress;

@end
