// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <GoogleSignIn/GoogleSignIn.h>
#import <EXGoogleSignIn/EXGoogleSignIn.h>

@interface EXGoogleSignIn (Serialization)

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input;
+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input;
+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input;
+ (NSDictionary *)jsonFromGIDAuthentication:(GIDAuthentication *)input;
+ (NSString *)jsonFromGIDSignInErrorCode:(GIDSignInErrorCode)input;

@end
