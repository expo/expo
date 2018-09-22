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

#import "FBSDKCameraEffectTextures.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareUtility.h"

static NSString *const FBSDKCameraEffectTexturesTexturesKey = @"textures";

@implementation FBSDKCameraEffectTextures
{
  NSMutableDictionary<NSString *, UIImage *> *_textures;
}

#pragma mark - Object Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {
    _textures = [NSMutableDictionary new];
  }
  return self;
}

- (void)setImage:(UIImage *)image forKey:(NSString *)key
{
  [self _setValue:image forKey:key];
}

- (UIImage *)imageForKey:(NSString *)key
{
  return [self _valueOfClass:[UIImage class] forKey:key];
}

- (NSDictionary<NSString *, UIImage *> *)allTextures
{
  return _textures;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  return [_textures hash];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKCameraEffectTextures class]]) {
    return NO;
  }
  return [self isEqualToCameraEffectTextures:(FBSDKCameraEffectTextures *)object];
}

- (BOOL)isEqualToCameraEffectTextures:(FBSDKCameraEffectTextures *)object
{
  return [FBSDKInternalUtility object:_textures isEqualToObject:[object allTextures]];
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _textures = [decoder decodeObjectOfClass:[NSMutableDictionary class]
                                      forKey:FBSDKCameraEffectTexturesTexturesKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_textures forKey:FBSDKCameraEffectTexturesTexturesKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKCameraEffectTextures *copy = [FBSDKCameraEffectTextures new];
  copy->_textures = [_textures copy];
  return copy;
}

#pragma mark - Helper Methods

- (void)_setValue:(id)value forKey:(NSString *)key
{
  if (value) {
    _textures[key] = value;
  } else {
    [_textures removeObjectForKey:key];
  }
}

- (id)_valueForKey:(NSString *)key
{
  key = [FBSDKTypeUtility stringValue:key];
  return (key ? [FBSDKTypeUtility objectValue:_textures[key]] : nil);
}

- (id)_valueOfClass:(__unsafe_unretained Class)cls forKey:(NSString *)key
{
  id value = [self _valueForKey:key];
  return ([value isKindOfClass:cls] ? value : nil);
}

@end
