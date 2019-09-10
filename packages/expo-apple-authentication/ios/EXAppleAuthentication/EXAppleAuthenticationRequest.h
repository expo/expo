// Copyright 2018-present 650 Industries. All rights reserved.

@import AuthenticationServices;

NS_ASSUME_NONNULL_BEGIN

API_AVAILABLE(ios(13.0))

@interface EXAppleAuthenticationRequest : NSObject <ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding>

- (instancetype)initWithOptions:(NSDictionary *)options
                    andCallback:(void(^)(NSDictionary *response, NSError *error))callback;

- (void)performOperation:(ASAuthorizationProviderAuthorizationOperation)operation;

+ (EXAppleAuthenticationRequest *)performOperation:(ASAuthorizationProviderAuthorizationOperation)operation
                                       withOptions:(NSDictionary *)options
                                      withCallback:(void(^)(NSDictionary *, NSError *))callback;

@end

NS_ASSUME_NONNULL_END
