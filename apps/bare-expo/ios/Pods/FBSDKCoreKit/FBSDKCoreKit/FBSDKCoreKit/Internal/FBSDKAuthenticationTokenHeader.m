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

#import "FBSDKAuthenticationTokenHeader.h"

#ifdef FBSDKCOCOAPODS
 #import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>
#else
 #import "FBSDKCoreKit+Internal.h"
#endif

@implementation FBSDKAuthenticationTokenHeader

- (instancetype)initWithAlg:(NSString *)alg
                        typ:(NSString *)typ
                        kid:(NSString *)kid
{
  if (self = [super init]) {
    _alg = alg;
    _typ = typ;
    _kid = kid;
  }

  return self;
}

+ (nullable FBSDKAuthenticationTokenHeader *)validatedHeaderWithEncodedString:(NSString *)encodedHeader
{
  NSError *error;
  NSData *headerData = [FBSDKBase64 decodeAsData:[FBSDKBase64 base64FromBase64Url:encodedHeader]];

  if (headerData) {
    NSDictionary *header = [FBSDKTypeUtility JSONObjectWithData:headerData options:0 error:&error];
    NSString *alg = [FBSDKTypeUtility dictionary:header objectForKey:@"alg" ofType:NSString.class];
    NSString *typ = [FBSDKTypeUtility dictionary:header objectForKey:@"typ" ofType:NSString.class];
    NSString *kid = [FBSDKTypeUtility dictionary:header objectForKey:@"kid" ofType:NSString.class];
    if (!error && [alg isEqualToString:@"RS256"] && [typ isEqualToString:@"JWT"] && kid.length > 0) {
      return [[FBSDKAuthenticationTokenHeader alloc] initWithAlg:alg typ:typ kid:kid];
    }
  }

  return nil;
}

- (BOOL)isEqualToHeader:(FBSDKAuthenticationTokenHeader *)header
{
  return [_alg isEqualToString:header.alg]
  && [_typ isEqualToString:header.typ]
  && [_kid isEqualToString:header.kid];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }

  if (![object isKindOfClass:[FBSDKAuthenticationTokenHeader class]]) {
    return NO;
  }

  return [self isEqualToHeader:(FBSDKAuthenticationTokenHeader *)object];
}

@end
