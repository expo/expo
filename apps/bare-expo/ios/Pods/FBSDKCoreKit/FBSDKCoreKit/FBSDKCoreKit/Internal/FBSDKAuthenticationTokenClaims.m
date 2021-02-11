// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKAuthenticationTokenClaims.h"

#ifdef FBSDKCOCOAPODS
 #import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>
#else
 #import "FBSDKCoreKit+Internal.h"
#endif

static long const MaxTimeSinceTokenIssued = 10 * 60; // 10 mins

@implementation FBSDKAuthenticationTokenClaims

- (instancetype)initWithJti:(NSString *)jti
                        iss:(NSString *)iss
                        aud:(NSString *)aud
                      nonce:(NSString *)nonce
                        exp:(long)exp
                        iat:(long)iat
                        sub:(NSString *)sub
                       name:(nullable NSString *)name
                      email:(nullable NSString *)email
                    picture:(nullable NSString *)picture
{
  if (self = [super init]) {
    _jti = jti;
    _iss = iss;
    _aud = aud;
    _nonce = nonce;
    _exp = exp;
    _iat = iat;
    _sub = sub;
    _name = name;
    _email = email;
    _picture = picture;
  }

  return self;
}

+ (nullable FBSDKAuthenticationTokenClaims *)validatedClaimsWithEncodedString:(NSString *)encodedClaims nonce:(NSString *)expectedNonce
{
  NSError *error;
  NSData *claimsData = [FBSDKBase64 decodeAsData:[FBSDKBase64 base64FromBase64Url:encodedClaims]];

  if (claimsData) {
    NSDictionary *claimsDict = [FBSDKTypeUtility JSONObjectWithData:claimsData options:0 error:&error];
    if (!error) {
      long currentTime = [[NSNumber numberWithDouble:[[NSDate date] timeIntervalSince1970]] longValue];

      // verify claims
      NSString *jti = [FBSDKTypeUtility stringValue:claimsDict[@"jti"]];
      BOOL hasJti = jti.length > 0;

      NSString *iss = [FBSDKTypeUtility stringValue:claimsDict[@"iss"]];
      BOOL isFacebook = iss.length > 0 && [[[NSURL URLWithString:iss] host] isEqualToString:@"facebook.com"];

      NSString *aud = [FBSDKTypeUtility stringValue:claimsDict[@"aud"]];
      BOOL audMatched = [aud isEqualToString:[FBSDKSettings appID]];

      NSNumber *expValue = [FBSDKTypeUtility numberValue:claimsDict[@"exp"]];
      long exp = [expValue doubleValue];
      BOOL isExpired = expValue == nil || exp <= currentTime;

      NSNumber *iatValue = [FBSDKTypeUtility numberValue:claimsDict[@"iat"]];
      long iat = [iatValue doubleValue];
      BOOL issuedRecently = iatValue != nil && iat >= currentTime - MaxTimeSinceTokenIssued;

      NSString *nonce = [FBSDKTypeUtility stringValue:claimsDict[@"nonce"]];
      BOOL nonceMatched = nonce.length > 0 && [nonce isEqualToString:expectedNonce];

      NSString *sub = [FBSDKTypeUtility stringValue:claimsDict[@"sub"]];
      BOOL userIDValid = sub.length > 0;

      NSString *name = [FBSDKTypeUtility stringValue:claimsDict[@"name"]];
      NSString *email = [FBSDKTypeUtility stringValue:claimsDict[@"email"]];
      NSString *picture = [FBSDKTypeUtility stringValue:claimsDict[@"picture"]];

      if (hasJti && isFacebook && audMatched && !isExpired && issuedRecently && nonceMatched && userIDValid) {
        return [[FBSDKAuthenticationTokenClaims alloc] initWithJti:jti
                                                               iss:iss
                                                               aud:aud
                                                             nonce:nonce
                                                               exp:exp
                                                               iat:iat
                                                               sub:sub
                                                              name:name
                                                             email:email
                                                           picture:picture];
      }
    }
  }

  return nil;
}

- (BOOL)isEqualToClaims:(FBSDKAuthenticationTokenClaims *)claims
{
  return [_jti isEqualToString:claims.jti]
  && [_iss isEqualToString:claims.iss]
  && [_aud isEqualToString:claims.aud]
  && [_nonce isEqualToString:claims.nonce]
  && _exp == claims.exp
  && _iat == claims.iat
  && [_sub isEqualToString:claims.sub]
  && [_name isEqualToString:claims.name]
  && [_email isEqualToString:claims.email]
  && [_picture isEqualToString:claims.picture];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }

  if (![object isKindOfClass:[FBSDKAuthenticationTokenClaims class]]) {
    return NO;
  }

  return [self isEqualToClaims:(FBSDKAuthenticationTokenClaims *)object];
}

@end
