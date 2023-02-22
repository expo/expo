// Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXJSONUtils/NSDictionary+ABI48_0_0EXJSONUtils.h>

#define ABI48_0_0EXGetNonNullManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(value != nil, @"Value for (key = %@) should not be null", key); \
  NSAssert([value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@", key, NSStringFromClass([Type class])); \
  value; \
})

#define ABI48_0_0EXGetNullableManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(!value || [value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@ or null", key, NSStringFromClass([Type class])); \
  value; \
})

@implementation NSDictionary (ABI48_0_0EXJSONUtils)

- (NSString *)stringForKey:(id)key {
  return ABI48_0_0EXGetNonNullManifestValue(NSString, key);
}

- (nullable NSString *)nullableStringForKey:(id)key {
  return ABI48_0_0EXGetNullableManifestValue(NSString, key);
}

- (NSNumber *)numberForKey:(id)key {
  return ABI48_0_0EXGetNonNullManifestValue(NSNumber, key);
}

- (nullable NSNumber *)nullableNumberForKey:(id)key {
  return ABI48_0_0EXGetNullableManifestValue(NSNumber, key);
}

- (NSArray *)arrayForKey:(id)key {
  return ABI48_0_0EXGetNonNullManifestValue(NSArray, key);
}

- (nullable NSArray *)nullableArrayForKey:(id)key {
  return ABI48_0_0EXGetNullableManifestValue(NSArray, key);
}

- (NSDictionary *)dictionaryForKey:(id)key {
  return ABI48_0_0EXGetNonNullManifestValue(NSDictionary, key);
}

- (nullable NSDictionary *)nullableDictionaryForKey:(id)key {
  return ABI48_0_0EXGetNullableManifestValue(NSDictionary, key);
}

@end
