// Copyright © 2021 650 Industries. All rights reserved.

#import <ABI49_0_0EXJSONUtils/NSDictionary+ABI49_0_0EXJSONUtils.h>

#define ABI49_0_0EXGetNonNullManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(value != nil, @"Value for (key = %@) should not be null", key); \
  NSAssert([value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@", key, NSStringFromClass([Type class])); \
  value; \
})

#define ABI49_0_0EXGetNullableManifestValue(Type, key) \
({ \
  id value = [self objectForKey:key]; \
  NSAssert(!value || [value isKindOfClass:[Type class]], @"Value for (key = %@) should be a %@ or null", key, NSStringFromClass([Type class])); \
  value; \
})

@implementation NSDictionary (ABI49_0_0EXJSONUtils)

- (NSString *)expo_stringForKey:(id)key {
  return ABI49_0_0EXGetNonNullManifestValue(NSString, key);
}

- (nullable NSString *)expo_nullableStringForKey:(id)key {
  return ABI49_0_0EXGetNullableManifestValue(NSString, key);
}

- (NSNumber *)expo_numberForKey:(id)key {
  return ABI49_0_0EXGetNonNullManifestValue(NSNumber, key);
}

- (nullable NSNumber *)expo_nullableNumberForKey:(id)key {
  return ABI49_0_0EXGetNullableManifestValue(NSNumber, key);
}

- (NSArray *)expo_arrayForKey:(id)key {
  return ABI49_0_0EXGetNonNullManifestValue(NSArray, key);
}

- (nullable NSArray *)expo_nullableArrayForKey:(id)key {
  return ABI49_0_0EXGetNullableManifestValue(NSArray, key);
}

- (NSDictionary *)expo_dictionaryForKey:(id)key {
  return ABI49_0_0EXGetNonNullManifestValue(NSDictionary, key);
}

- (nullable NSDictionary *)expo_nullableDictionaryForKey:(id)key {
  return ABI49_0_0EXGetNullableManifestValue(NSDictionary, key);
}

@end
