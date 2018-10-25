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

#import "FBSDKShareOpenGraphValueContainer.h"
#import "FBSDKShareOpenGraphValueContainer+Internal.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareOpenGraphObject.h"
#import "FBSDKSharePhoto.h"
#import "FBSDKShareUtility.h"

#define FBSDK_SHARE_OPEN_GRAPH_VALUE_CONTAINER_PROPERTIES_KEY @"properties"

@implementation FBSDKShareOpenGraphValueContainer
{
  NSMutableDictionary *_properties;
}

#pragma mark - Object Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {
    _properties = [[NSMutableDictionary alloc] init];
  }
  return self;
}

#pragma mark - Public Methods

- (NSDictionary *)allData
{
  return [_properties copy];
}

- (NSArray *)arrayForKey:(NSString *)key
{
  return [self _valueOfClass:[NSArray class] forKey:key];
}

- (void)enumerateKeysAndObjectsUsingBlock:(void (^)(NSString *key, id object, BOOL *stop))block
{
  [_properties enumerateKeysAndObjectsUsingBlock:block];
}

- (NSEnumerator *)keyEnumerator
{
  return [_properties keyEnumerator];
}

- (NSNumber *)numberForKey:(NSString *)key
{
  return [self _valueOfClass:[NSNumber class] forKey:key];
}

- (NSEnumerator *)objectEnumerator
{
  return [_properties objectEnumerator];
}

- (FBSDKShareOpenGraphObject *)objectForKey:(NSString *)key
{
  return [self _valueOfClass:[FBSDKShareOpenGraphObject class] forKey:key];
}

- (id)objectForKeyedSubscript:(id<NSCopying>)key
{
  return [self _valueForKey:key];
}

- (void)parseProperties:(NSDictionary *)properties
{
  [FBSDKShareUtility assertOpenGraphValues:properties requireKeyNamespace:[self requireKeyNamespace]];
  [_properties addEntriesFromDictionary:[FBSDKShareUtility convertOpenGraphValues:properties]];
}

- (FBSDKSharePhoto *)photoForKey:(NSString *)key
{
  return [self _valueOfClass:[FBSDKSharePhoto class] forKey:key];
}

- (void)removeObjectForKey:(NSString *)key
{
  [_properties removeObjectForKey:key];
}

- (void)setArray:(NSArray *)array forKey:(NSString *)key
{
  [self _setValue:array forKey:key];
}

- (void)setNumber:(NSNumber *)number forKey:(NSString *)key
{
  [self _setValue:number forKey:key];
}

- (void)setObject:(FBSDKShareOpenGraphObject *)object forKey:(NSString *)key
{
  [self _setValue:object forKey:key];
}

- (void)setPhoto:(FBSDKSharePhoto *)photo forKey:(NSString *)key
{
  [self _setValue:photo forKey:key];
}

- (void)setString:(NSString *)string forKey:(NSString *)key
{
  [self _setValue:string forKey:key];
}

- (void)setURL:(NSURL *)URL forKey:(NSString *)key
{
  [self _setValue:URL forKey:key];
}
- (NSString *)stringForKey:(NSString *)key
{
  return [self _valueOfClass:[NSString class] forKey:key];
}

- (NSURL *)URLForKey:(NSString *)key
{
  return [self _valueOfClass:[NSURL class] forKey:key];
}

- (id)valueForKey:(NSString *)key
{
  return [self _valueForKey:key] ?: [super valueForKey:key];
}

#pragma mark - Internal Methods

- (NSDictionary *)allProperties
{
  return _properties;
}

- (BOOL)requireKeyNamespace
{
  return YES;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  return [_properties hash];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKShareOpenGraphValueContainer class]]) {
    return NO;
  }
  return [self isEqualToShareOpenGraphValueContainer:(FBSDKShareOpenGraphValueContainer *)object];
}

- (BOOL)isEqualToShareOpenGraphValueContainer:(FBSDKShareOpenGraphValueContainer *)object
{
  return [FBSDKInternalUtility object:_properties isEqualToObject:[object allProperties]];
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    NSSet *classes = [NSSet setWithObjects:
                      [NSArray class],
                      [NSDictionary class],
                      [FBSDKShareOpenGraphObject class],
                      [FBSDKSharePhoto class],
                      nil];
    NSDictionary *properties = [decoder decodeObjectOfClasses:classes
                                                       forKey:FBSDK_SHARE_OPEN_GRAPH_VALUE_CONTAINER_PROPERTIES_KEY];
    if ([properties count]) {
      [self parseProperties:properties];
    }
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_properties forKey:FBSDK_SHARE_OPEN_GRAPH_VALUE_CONTAINER_PROPERTIES_KEY];
}

#pragma mark - Helper Methods

- (void)_setValue:(id)value forKey:(NSString *)key
{
  [FBSDKShareUtility assertOpenGraphKey:key requireNamespace:[self requireKeyNamespace]];
  [FBSDKShareUtility assertOpenGraphValue:value];
  if (value) {
    _properties[key] = value;
  } else {
    [self removeObjectForKey:key];
  }
}

- (id)_valueForKey:(id)key
{
  key = [FBSDKTypeUtility stringValue:key];
  return (key ? [FBSDKTypeUtility objectValue:_properties[key]] : nil);
}

- (id)_valueOfClass:(__unsafe_unretained Class)cls forKey:(NSString *)key
{
  id value = [self _valueForKey:key];
  return ([value isKindOfClass:cls] ? value : nil);
}

@end
