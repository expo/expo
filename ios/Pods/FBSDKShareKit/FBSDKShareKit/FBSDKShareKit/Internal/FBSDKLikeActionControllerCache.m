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

#import "FBSDKLikeActionControllerCache.h"

#import <UIKit/UIKit.h>

#import "FBSDKLikeActionController.h"

// after 1 day, expire the cached states
#define FBSDK_LIKE_ACTION_CONTROLLER_CACHE_TIMEOUT 60 * 24

#define FBSDK_LIKE_ACTION_CONTROLLER_CACHE_ACCESS_TOKEN_KEY @"accessTokenString"
#define FBSDK_LIKE_ACTION_CONTROLLER_CACHE_ITEMS_KEY @"items"

@implementation FBSDKLikeActionControllerCache
{
  NSString *_accessTokenString;
  NSMutableDictionary *_items;
}

#pragma mark - Object Lifecycle

- (instancetype)initWithAccessTokenString:(NSString *)accessTokenString
{
  if ((self = [super init])) {
    _accessTokenString = [accessTokenString copy];
    _items = [[NSMutableDictionary alloc] init];
  }
  return self;
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  NSString *accessTokenString = [decoder decodeObjectOfClass:[NSString class]
                                                      forKey:FBSDK_LIKE_ACTION_CONTROLLER_CACHE_ACCESS_TOKEN_KEY];
  if ((self = [self initWithAccessTokenString:accessTokenString])) {
    NSSet *allowedClasses = [NSSet setWithObjects:[NSDictionary class], [FBSDKLikeActionController class], nil];
    NSDictionary *items = [decoder decodeObjectOfClasses:allowedClasses
                                                  forKey:FBSDK_LIKE_ACTION_CONTROLLER_CACHE_ITEMS_KEY];
    _items = [[NSMutableDictionary alloc] initWithDictionary:items];
    [self _prune];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_accessTokenString forKey:FBSDK_LIKE_ACTION_CONTROLLER_CACHE_ACCESS_TOKEN_KEY];
  [encoder encodeObject:_items forKey:FBSDK_LIKE_ACTION_CONTROLLER_CACHE_ITEMS_KEY];
}

#pragma mark - Public Methods

- (id)objectForKeyedSubscript:(id)key
{
  return _items[key];
}

- (void)resetForAccessTokenString:(NSString *)accessTokenString
{
  _accessTokenString = [accessTokenString copy];
  [_items removeAllObjects];
}

- (void)setObject:(id)object forKeyedSubscript:(id)key
{
  _items[key] = object;
}

#pragma mark - Helper Methods

- (void)_prune
{
  NSMutableArray *keysToRemove = [[NSMutableArray alloc] init];
  [_items enumerateKeysAndObjectsUsingBlock:^(NSString *objectID,
                                              FBSDKLikeActionController *likeActionController,
                                              BOOL *stop) {
    NSDate *lastUpdateTime = likeActionController.lastUpdateTime;
    if (!lastUpdateTime ||
        ([[NSDate date] timeIntervalSinceDate:lastUpdateTime] > FBSDK_LIKE_ACTION_CONTROLLER_CACHE_TIMEOUT)) {
      [keysToRemove addObject:objectID];
    }
  }];
  [_items removeObjectsForKeys:keysToRemove];
}

@end
