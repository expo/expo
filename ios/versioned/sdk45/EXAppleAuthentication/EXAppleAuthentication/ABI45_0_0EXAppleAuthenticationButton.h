// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUtilities.h>

@import AuthenticationServices;

API_AVAILABLE(ios(13.0))
@interface ABI45_0_0EXAppleAuthenticationButton : ASAuthorizationAppleIDButton

@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onButtonPress;

@end
