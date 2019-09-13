// Copyright 2018-present 650 Industries. All rights reserved.

@import AuthenticationServices;

NS_ASSUME_NONNULL_BEGIN

@interface EXAppleAuthenticationMappings : NSObject

+ (NSNumber *)exportCredentialState:(ASAuthorizationAppleIDProviderCredentialState)credentialState API_AVAILABLE(ios(13.0));

+ (NSNumber *)exportRealUserStatus:(ASUserDetectionStatus)detectionStatus API_AVAILABLE(ios(13.0));

+ (NSArray<ASAuthorizationScope> *)importScopes:(NSArray<NSNumber *> *)scopes API_AVAILABLE(ios(13.0));

+ (ASAuthorizationOpenIDOperation)importOperation:(NSNumber *)operation API_AVAILABLE(ios(13.0));

+ (NSDictionary *)exportFullName:(NSPersonNameComponents *)nameComponents;

+ (NSString *)exportData:(NSData *)data;

@end

NS_ASSUME_NONNULL_END
