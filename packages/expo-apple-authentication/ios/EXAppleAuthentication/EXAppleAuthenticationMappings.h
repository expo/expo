// Copyright 2018-present 650 Industries. All rights reserved.

@import AuthenticationServices;

@interface EXAppleAuthenticationMappings : NSObject

+ (NSNumber *)exportCredentialState:(ASAuthorizationAppleIDProviderCredentialState)credentialState API_AVAILABLE(ios(13.0));

+ (NSArray<ASAuthorizationScope> *)importScopes:(NSArray<NSNumber *> *)scopes API_AVAILABLE(ios(13.0));

+ (ASAuthorizationOpenIDOperation)importOperation:(NSNumber *)operation API_AVAILABLE(ios(13.0));

@end
