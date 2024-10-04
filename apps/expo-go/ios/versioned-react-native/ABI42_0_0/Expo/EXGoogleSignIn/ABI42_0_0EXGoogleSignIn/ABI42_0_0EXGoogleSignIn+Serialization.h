// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <GoogleSignIn/GoogleSignIn.h>
#import <ABI42_0_0EXGoogleSignIn/ABI42_0_0EXGoogleSignIn.h>

@interface ABI42_0_0EXGoogleSignIn (Serialization)

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input;
+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input;
+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input;
+ (NSDictionary *)jsonFromGIDAuthentication:(GIDAuthentication *)input;
+ (NSString *)jsonFromGIDSignInErrorCode:(GIDSignInErrorCode)input;

@end
