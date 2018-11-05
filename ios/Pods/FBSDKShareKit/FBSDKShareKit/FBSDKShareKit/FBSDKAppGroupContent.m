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

#import "FBSDKAppGroupContent.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareUtility.h"

#define FBSDK_APP_GROUP_CONTENT_GROUP_DESCRIPTION_KEY @"groupDescription"
#define FBSDK_APP_GROUP_CONTENT_NAME_KEY @"name"
#define FBSDK_APP_GROUP_CONTENT_PRIVACY_KEY @"privacy"

NSString *NSStringFromFBSDKAppGroupPrivacy(FBSDKAppGroupPrivacy privacy)
{
  switch (privacy) {
    case FBSDKAppGroupPrivacyClosed:{
      return @"closed";
    }
    case FBSDKAppGroupPrivacyOpen:{
      return @"open";
    }
  }
}

@implementation FBSDKAppGroupContent

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [_groupDescription hash],
    [_name hash],
    _privacy,
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKAppGroupContent class]]) {
    return NO;
  }
  return [self isEqualToAppGroupContent:(FBSDKAppGroupContent *)object];
}

- (BOOL)isEqualToAppGroupContent:(FBSDKAppGroupContent *)content
{
  return (content &&
          (_privacy == content.privacy) &&
          [FBSDKInternalUtility object:_name isEqualToObject:content.name] &&
          [FBSDKInternalUtility object:_groupDescription isEqualToObject:content.groupDescription]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _groupDescription = [decoder decodeObjectOfClass:[NSString class]
                                              forKey:FBSDK_APP_GROUP_CONTENT_GROUP_DESCRIPTION_KEY];
    _name = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_APP_GROUP_CONTENT_PRIVACY_KEY];
    _privacy = [decoder decodeIntegerForKey:FBSDK_APP_GROUP_CONTENT_PRIVACY_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_groupDescription forKey:FBSDK_APP_GROUP_CONTENT_GROUP_DESCRIPTION_KEY];
  [encoder encodeObject:_name forKey:FBSDK_APP_GROUP_CONTENT_NAME_KEY];
  [encoder encodeInteger:_privacy forKey:FBSDK_APP_GROUP_CONTENT_PRIVACY_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKAppGroupContent *copy = [[FBSDKAppGroupContent alloc] init];
  copy->_groupDescription = [_groupDescription copy];
  copy->_name = [_name copy];
  copy->_privacy = _privacy;
  return copy;
}

@end
