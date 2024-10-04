// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

@import AuthenticationServices;

API_AVAILABLE(ios(13.0))
@interface ABI42_0_0EXAppleAuthenticationButton : ASAuthorizationAppleIDButton

@property (nonatomic, copy) ABI42_0_0UMDirectEventBlock onButtonPress;

@end
