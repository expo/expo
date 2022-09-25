// Copyright © 2021 650 Industries. All rights reserved.

#import <EXJSONUtils/NSDictionary+EXJSONUtils.h>

#define EXGetNonNullManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(value != nil, @"Value for (key = %@) should not be null", key); \
  NSAssert([value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@", key, NSStringFromClass([Type class])); \
  value; \
})

#define EXGetNullableManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(!value || [value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@ or null", key, NSStringFromClass([Type class])); \
  value; \
})

@implementation NSDictionary (EXJSONUtils)

- (NSString *)stringForKey:(id)key {
  return EXGetNonNullManifestValue(NSString, key);
}

- (nullable NSString *)nullableStringForKey:(id)key {
  return EXGetNullableManifestValue(NSString, key);
}

- (NSNumber *)numberForKey:(id)key {
  return EXGetNonNullManifestValue(NSNumber, key);
}

- (nullable NSNumber *)nullableNumberForKey:(id)key {
  return EXGetNullableManifestValue(NSNumber, key);
}

- (NSArray *)arrayForKey:(id)key {
  return EXGetNonNullManifestValue(NSArray, key);
}

- (nullable NSArray *)nullableArrayForKey:(id)key {
  return EXGetNullableManifestValue(NSArray, key);
}

- (NSDictionary *)dictionaryForKey:(id)key {
  return EXGetNonNullManifestValue(NSDictionary, key);
}

- (nullable NSDictionary *)nullableDictionaryForKey:(id)key {
  return EXGetNullableManifestValue(NSDictionary, key);
}

@end
