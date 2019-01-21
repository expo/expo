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

#import "FBSDKHashtag.h"

#import "FBSDKCoreKit+Internal.h"

#define FBSDK_HASHTAG_STRING_KEY @"hashtag"

static NSRegularExpression *HashtagRegularExpression()
{
  static NSRegularExpression *hashtagRegularExpression = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    hashtagRegularExpression = [[NSRegularExpression alloc] initWithPattern:@"^#\\w+$" options:0 error:NULL];
  });
  return hashtagRegularExpression;
}

@implementation FBSDKHashtag

#pragma mark - Class Methods

+ (instancetype)hashtagWithString:(NSString *)hashtagString
{
  FBSDKHashtag *hashtag = [[self alloc] init];
  hashtag.stringRepresentation = hashtagString;
  return hashtag;
}

#pragma mark - Properties

- (NSString *)description
{
  if (self.valid) {
    return _stringRepresentation;
  } else {
    return [NSString stringWithFormat:@"Invalid hashtag '%@'", _stringRepresentation];
  }
}

- (BOOL)isValid
{
  if (_stringRepresentation == nil) {
    return NO;
  }
  NSRange fullString = NSMakeRange(0, _stringRepresentation.length);
  NSRegularExpression *hashtagRegularExpression = HashtagRegularExpression();
  NSUInteger numberOfMatches = [hashtagRegularExpression numberOfMatchesInString:_stringRepresentation
                                                                                        options:0
                                                                                          range:fullString];
  return numberOfMatches > 0;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  return _stringRepresentation.hash;
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKHashtag class]]) {
    return NO;
  }
  return [self isEqualToHashtag:(FBSDKHashtag *)object];
}

- (BOOL)isEqualToHashtag:(FBSDKHashtag *)hashtag
{
  return (hashtag &&
          [FBSDKInternalUtility object:_stringRepresentation isEqualToObject:hashtag.stringRepresentation]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder
{
  if ((self = [self init])) {
    _stringRepresentation = [aDecoder decodeObjectOfClass:[NSString class] forKey:FBSDK_HASHTAG_STRING_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder
{
  [aCoder encodeObject:_stringRepresentation forKey:FBSDK_HASHTAG_STRING_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKHashtag *copy = [[FBSDKHashtag alloc] init];
  copy.stringRepresentation = [_stringRepresentation copy];
  return copy;
}

@end
