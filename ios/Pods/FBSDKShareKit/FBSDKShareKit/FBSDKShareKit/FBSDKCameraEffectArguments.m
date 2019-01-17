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

#import "FBSDKCameraEffectArguments.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareUtility.h"

static NSString *const FBSDKCameraEffectArgumentsArgumentsKey = @"arguments";

@implementation FBSDKCameraEffectArguments
{
  NSMutableDictionary *_arguments;
}

#pragma mark - Object Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {
    _arguments = [NSMutableDictionary new];
  }
  return self;
}

- (void)setString:(NSString *)string forKey:(NSString *)key
{
  [self _setValue:[string copy] forKey:key];
}

- (NSString *)stringForKey:(NSString *)key
{
  return [self _valueOfClass:[NSString class] forKey:key];
}

- (void)setArray:(NSArray<NSString *> *)array forKey:(NSString *)key
{
  [self _setValue:[array copy] forKey:key];
}

- (NSArray *)arrayForKey:(NSString *)key
{
  return [self _valueOfClass:[NSArray class] forKey:key];
}

- (NSDictionary *)allArguments
{
  return _arguments;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  return _arguments.hash;
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKCameraEffectArguments class]]) {
    return NO;
  }
  return [self isEqualToCameraEffectArguments:(FBSDKCameraEffectArguments *)object];
}

- (BOOL)isEqualToCameraEffectArguments:(FBSDKCameraEffectArguments *)object
{
  return [FBSDKInternalUtility object:_arguments isEqualToObject:[object allArguments]];
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _arguments = [decoder decodeObjectOfClass:[NSMutableDictionary class]
                                       forKey:FBSDKCameraEffectArgumentsArgumentsKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_arguments forKey:FBSDKCameraEffectArgumentsArgumentsKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKCameraEffectArguments *copy = [FBSDKCameraEffectArguments new];
  copy->_arguments = [_arguments copy];
  return copy;
}


#pragma mark - Helper Methods

- (void)_setValue:(id)value forKey:(NSString *)key
{
  [FBSDKCameraEffectArguments assertKey:key];
  if (value) {
    [FBSDKCameraEffectArguments assertValue:value];
    _arguments[key] = value;
  } else {
    [_arguments removeObjectForKey:key];
  }
}

- (id)_valueForKey:(NSString *)key
{
  key = [FBSDKTypeUtility stringValue:key];
  return (key ? [FBSDKTypeUtility objectValue:_arguments[key]] : nil);
}

- (id)_valueOfClass:(__unsafe_unretained Class)cls forKey:(NSString *)key
{
  id value = [self _valueForKey:key];
  return ([value isKindOfClass:cls] ? value : nil);
}

+ (void)assertKey:(id)key
{
  if ([key isKindOfClass:[NSString class]]) {
    return;
  }
  NSString *reason = [NSString stringWithFormat:@"Invalid key found in CameraEffectArguments: %@", key];
  @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
}

+ (void)assertValue:(id)value
{
  BOOL isInvalid = NO;
  if ([value isKindOfClass:[NSString class]]) {
    // Strings are always valid.
  } else if ([value isKindOfClass:[NSArray class]]) {
    // Allow only string arrays.
    for (id subValue in (NSArray *)value) {
      if (![subValue isKindOfClass:[NSString class]]) {
        isInvalid = YES;
        break;
      }
    }
  } else {
    isInvalid = YES;
  }

  if (isInvalid) {
    NSString *reason = [NSString stringWithFormat:@"Invalid value found in CameraEffectArguments: %@", value];
    @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
  }
}

@end
