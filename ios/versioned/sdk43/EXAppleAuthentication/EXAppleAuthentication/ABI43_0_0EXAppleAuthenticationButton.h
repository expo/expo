// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

@import AuthenticationServices;

API_AVAILABLE(ios(13.0))
@interface ABI43_0_0EXAppleAuthenticationButton : ASAuthorizationAppleIDButton

@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onButtonPress;

@end
