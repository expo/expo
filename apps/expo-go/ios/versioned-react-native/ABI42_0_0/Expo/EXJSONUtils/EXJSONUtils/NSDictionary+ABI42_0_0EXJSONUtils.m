// Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXJSONUtils/NSDictionary+ABI42_0_0EXJSONUtils.h>

#define ABI42_0_0EXGetNonNullManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(value != nil, @"Value for (key = %@) should not be null", key); \
  NSAssert([value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@", key, NSStringFromClass([Type class])); \
  value; \
})

#define ABI42_0_0EXGetNullableManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(!value || [value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@ or null", key, NSStringFromClass([Type class])); \
  value; \
})

@implementation NSDictionary (ABI42_0_0EXJSONUtils)

- (NSString *)stringForKey:(NSString *)key {
  return ABI42_0_0EXGetNonNullManifestValue(NSString, key);
}

- (nullable NSString *)nullableStringForKey:(NSString *)key {
  return ABI42_0_0EXGetNullableManifestValue(NSString, key);
}

- (NSNumber *)numberForKey:(NSString *)key {
  return ABI42_0_0EXGetNonNullManifestValue(NSNumber, key);
}

- (nullable NSNumber *)nullableNumberForKey:(NSString *)key {
  return ABI42_0_0EXGetNullableManifestValue(NSNumber, key);
}

- (NSArray *)arrayForKey:(NSString *)key {
  return ABI42_0_0EXGetNonNullManifestValue(NSArray, key);
}

- (nullable NSArray *)nullableArrayForKey:(NSString *)key {
  return ABI42_0_0EXGetNullableManifestValue(NSArray, key);
}

- (NSDictionary *)dictionaryForKey:(NSString *)key {
  return ABI42_0_0EXGetNonNullManifestValue(NSDictionary, key);
}

- (nullable NSDictionary *)nullableDictionaryForKey:(NSString *)key {
  return ABI42_0_0EXGetNullableManifestValue(NSDictionary, key);
}

@end
