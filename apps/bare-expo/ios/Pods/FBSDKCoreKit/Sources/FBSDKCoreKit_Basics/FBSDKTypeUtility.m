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

#import "FBSDKTypeUtility.h"

@implementation FBSDKTypeUtility

#pragma mark - Class Methods

+ (NSArray *)arrayValue:(id)object
{
  return (NSArray *)[self _objectValue:object ofClass:[NSArray class]];
}

+ (nullable id)array:(NSArray *)array objectAtIndex:(NSUInteger)index
{
  if ([self arrayValue:array] && index < array.count) {
    return [array objectAtIndex:index];
  }

  return nil;
}

+ (void)array:(NSMutableArray *)array addObject:(id)object
{
  if (object && [array isKindOfClass:NSMutableArray.class]) {
    [array addObject:object];
  }
}

+ (void)array:(NSMutableArray *)array addObject:(nullable id)object atIndex:(NSUInteger)index
{
  if (object && [array isKindOfClass:NSMutableArray.class]) {
    if (index < array.count) {
      [array insertObject:object atIndex:index];
    } else if (index == array.count) {
      [array addObject:object];
    }
  }
}

+ (BOOL)boolValue:(id)object
{
  if ([object isKindOfClass:[NSNumber class]]) {
    // @0 or @NO returns NO, otherwise YES
    return ((NSNumber *)object).boolValue;
  } else if ([object isKindOfClass:[NSString class]]) {
    // Returns YES on encountering one of "Y", "y", "T", "t", or a digit 1-9, otherwise NO
    return ((NSString *)object).boolValue;
  } else {
    return ([self objectValue:object] != nil);
  }
}

+ (NSDictionary *)dictionaryValue:(id)object
{
  return (NSDictionary *)[self _objectValue:object ofClass:[NSDictionary class]];
}

+ (id)dictionary:(NSDictionary *)dictionary objectForKey:(NSString *)key ofType:(Class)type
{
  id potentialValue = [[self dictionaryValue:dictionary] objectForKey:key];

  if ([potentialValue isKindOfClass:type]) {
    return potentialValue;
  } else {
    return nil;
  }
}

+ (void)dictionary:(NSMutableDictionary *)dictionary setObject:(id)object forKey:(id<NSCopying>)key
{
  if (object && key) {
    dictionary[key] = object;
  }
}

+ (void)dictionary:(NSDictionary *)dictionary enumerateKeysAndObjectsUsingBlock:(void(NS_NOESCAPE ^)(id key, id obj, BOOL *stop))block
{
  NSDictionary *validDictionary = [self dictionaryValue:dictionary];
  if (validDictionary) {
    [validDictionary enumerateKeysAndObjectsUsingBlock:block];
  }
}

+ (NSNumber *)numberValue:(id)object
{
  return [self _objectValue:object ofClass:NSNumber.class];
}

+ (NSInteger)integerValue:(id)object
{
  if ([object isKindOfClass:[NSNumber class]]) {
    return ((NSNumber *)object).integerValue;
  } else if ([object isKindOfClass:[NSString class]]) {
    return ((NSString *)object).integerValue;
  } else {
    return 0;
  }
}

+ (id)objectValue:(id)object
{
  return ([object isKindOfClass:[NSNull class]] ? nil : object);
}

+ (NSString *)stringValue:(id)object
{
  if ([object isKindOfClass:[NSString class]]) {
    return (NSString *)object;
  } else if ([object isKindOfClass:[NSNumber class]]) {
    return ((NSNumber *)object).stringValue;
  } else if ([object isKindOfClass:[NSURL class]]) {
    return ((NSURL *)object).absoluteString;
  } else {
    return nil;
  }
}

+ (NSTimeInterval)timeIntervalValue:(id)object
{
  if ([object isKindOfClass:[NSNumber class]]) {
    return ((NSNumber *)object).doubleValue;
  } else if ([object isKindOfClass:[NSString class]]) {
    return ((NSString *)object).doubleValue;
  } else {
    return 0;
  }
}

+ (NSUInteger)unsignedIntegerValue:(id)object
{
  if ([object isKindOfClass:[NSNumber class]]) {
    return ((NSNumber *)object).unsignedIntegerValue;
  } else {
    // there is no direct support for strings containing unsigned values > NSIntegerMax - not worth writing ourselves
    // right now, so just cap unsigned values at NSIntegerMax until we have a need for larger
    NSInteger integerValue = [self integerValue:object];
    if (integerValue < 0) {
      integerValue = 0;
    }
    return (NSUInteger)integerValue;
  }
}

+ (NSURL *)URLValue:(id)object
{
  if ([object isKindOfClass:[NSURL class]]) {
    return (NSURL *)object;
  } else if ([object isKindOfClass:[NSString class]]) {
    return [NSURL URLWithString:(NSString *)object];
  } else {
    return nil;
  }
}

+ (BOOL)isValidJSONObject:(id)obj
{
  return [NSJSONSerialization isValidJSONObject:obj];
}

+ (NSData *)dataWithJSONObject:(id)obj options:(NSJSONWritingOptions)opt error:(NSError *__autoreleasing _Nullable *)error
{
  NSData *data;

  @try {
    data = [NSJSONSerialization dataWithJSONObject:obj options:opt error:error];
  } @catch (NSException *exception) {
    NSLog(@"FBSDKJSONSerialization - dataWithJSONObject:options:error failed: %@", exception.reason);
  }
  return data;
}

+ (id)JSONObjectWithData:(NSData *)data options:(NSJSONReadingOptions)opt error:(NSError *__autoreleasing _Nullable *)error
{
  if (![data isKindOfClass:NSData.class]) {
    return nil;
  }

  id object;
  @try {
    object = [NSJSONSerialization JSONObjectWithData:data options:opt error:error];
  } @catch (NSException *exception) {
    NSLog(@"FBSDKJSONSerialization - JSONObjectWithData:options:error failed: %@", exception.reason);
  }
  return object;
}

#pragma mark - Helper Methods

+ (id)_objectValue:(id)object ofClass:(Class)expectedClass
{
  return ([object isKindOfClass:expectedClass] ? object : nil);
}

@end
