// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXAppleAuthentication/ABI47_0_0EXAppleAuthenticationMappings.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXLogManager.h>

@implementation ABI47_0_0EXAppleAuthenticationMappings

+ (NSNumber *)exportCredentialState:(ASAuthorizationAppleIDProviderCredentialState)credentialState API_AVAILABLE(ios(13.0))
{
  switch (credentialState) {
    case ASAuthorizationAppleIDProviderCredentialRevoked:
      return @0;
    case ASAuthorizationAppleIDProviderCredentialAuthorized:
      return @1;
    case ASAuthorizationAppleIDProviderCredentialNotFound:
      return @2;
    case ASAuthorizationAppleIDProviderCredentialTransferred:
      return @3;
  }
}

+ (NSNumber *)exportRealUserStatus:(ASUserDetectionStatus)detectionStatus API_AVAILABLE(ios(13.0))
{
  switch (detectionStatus) {
    case ASUserDetectionStatusUnknown:
      return @1;
    case ASUserDetectionStatusLikelyReal:
      return @2;
    case ASUserDetectionStatusUnsupported:
    default:
      return @0;
  }
}

+ (ASAuthorizationScope)importScope:(NSNumber *)scope API_AVAILABLE(ios(13.0))
{
  switch ([scope intValue]) {
    case 0:
      return ASAuthorizationScopeFullName;
    case 1:
      return ASAuthorizationScopeEmail;
    default:
      @throw [[NSException alloc] initWithName:@"ERR_APPLE_AUTHENTICATION_INVALID_SCOPE"
                                        reason:[NSString stringWithFormat:@"Invalid Apple authentication scope: %@", scope]
                                      userInfo:nil];
  }
}

+ (NSArray<ASAuthorizationScope> *)importScopes:(NSArray<NSNumber *> *)scopes API_AVAILABLE(ios(13.0))
{
  NSMutableArray<ASAuthorizationScope> *importedScopes = [NSMutableArray new];

  [scopes enumerateObjectsUsingBlock:^(NSNumber *scope, NSUInteger idx, BOOL *stop) {
    [importedScopes addObject:[self importScope:scope]];
  }];
  return importedScopes;
}

+ (ASAuthorizationOpenIDOperation)importOperation:(NSNumber *)operation API_AVAILABLE(ios(13.0))
{
  switch ([operation intValue]) {
    case 0:
      return ASAuthorizationOperationImplicit;
    case 1:
      return ASAuthorizationOperationLogin;
    case 2:
      return ASAuthorizationOperationRefresh;
    case 3:
      return ASAuthorizationOperationLogout;
    default:
      @throw [[NSException alloc] initWithName:@"ERR_APPLE_AUTHENTICATION_INVALID_OPERATION"
                                        reason:[NSString stringWithFormat:@"Invalid type of Apple authentication operation: %@", operation]
                                      userInfo:nil];
  }
}

+ (NSDictionary *)exportFullName:(NSPersonNameComponents *)nameComponents
{
  return @{
           @"namePrefix": ABI47_0_0EXNullIfNil(nameComponents.namePrefix),
           @"givenName": ABI47_0_0EXNullIfNil(nameComponents.givenName),
           @"middleName": ABI47_0_0EXNullIfNil(nameComponents.middleName),
           @"familyName": ABI47_0_0EXNullIfNil(nameComponents.familyName),
           @"nameSuffix": ABI47_0_0EXNullIfNil(nameComponents.nameSuffix),
           @"nickname": ABI47_0_0EXNullIfNil(nameComponents.nickname)
           };
}

+ (NSString *)exportData:(NSData *)data
{
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

@end
