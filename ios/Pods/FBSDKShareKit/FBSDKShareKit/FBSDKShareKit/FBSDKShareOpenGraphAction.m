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

#import "FBSDKShareOpenGraphAction.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareOpenGraphValueContainer+Internal.h"

#define FBSDK_SHARE_OPEN_GRAPH_ACTION_TYPE_KEY @"type"

@implementation FBSDKShareOpenGraphAction

#pragma mark - Class Methods

+ (instancetype)actionWithType:(NSString *)actionType object:(FBSDKShareOpenGraphObject *)object key:(NSString *)key
{
  FBSDKShareOpenGraphAction *action = [[FBSDKShareOpenGraphAction alloc] init];
  action.actionType = actionType;
  [action setObject:object forKey:key];
  return action;
}

+ (instancetype)actionWithType:(NSString *)actionType objectID:(NSString *)objectID key:(NSString *)key
{
  FBSDKShareOpenGraphAction *action = [[FBSDKShareOpenGraphAction alloc] init];
  action.actionType = actionType;
  [action setString:objectID forKey:key];
  return action;
}

+ (instancetype)actionWithType:(NSString *)actionType objectURL:(NSURL *)objectURL key:(NSString *)key
{
  FBSDKShareOpenGraphAction *action = [[FBSDKShareOpenGraphAction alloc] init];
  action.actionType = actionType;
  [action setURL:objectURL forKey:key];
  return action;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  return [FBSDKMath hashWithInteger:super.hash andInteger:_actionType.hash];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKShareOpenGraphAction class]]) {
    return NO;
  }
  return [self isEqualToShareOpenGraphAction:(FBSDKShareOpenGraphAction *)object];
}

- (BOOL)isEqualToShareOpenGraphAction:(FBSDKShareOpenGraphAction *)action
{
  return (action &&
          [FBSDKInternalUtility object:_actionType isEqualToObject:action.actionType] &&
          [self isEqualToShareOpenGraphValueContainer:action]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [super initWithCoder:decoder])) {
    _actionType = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_OPEN_GRAPH_ACTION_TYPE_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [super encodeWithCoder:encoder];
  [encoder encodeObject:_actionType forKey:FBSDK_SHARE_OPEN_GRAPH_ACTION_TYPE_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareOpenGraphAction *copy = [[FBSDKShareOpenGraphAction alloc] init];
  copy->_actionType = [_actionType copy];
  [copy parseProperties:[self allProperties]];
  return copy;
}

#pragma mark - Internal Methods

- (BOOL)requireKeyNamespace
{
  return NO;
}

@end
