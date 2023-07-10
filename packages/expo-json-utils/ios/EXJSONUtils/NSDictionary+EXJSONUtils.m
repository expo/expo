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

- (NSString *)expo_stringForKey:(id)key {
  return EXGetNonNullManifestValue(NSString, key);
}

- (nullable NSString *)expo_nullableStringForKey:(id)key {
  return EXGetNullableManifestValue(NSString, key);
}

- (NSNumber *)expo_numberForKey:(id)key {
  return EXGetNonNullManifestValue(NSNumber, key);
}

- (nullable NSNumber *)expo_nullableNumberForKey:(id)key {
  return EXGetNullableManifestValue(NSNumber, key);
}

- (NSArray *)expo_arrayForKey:(id)key {
  return EXGetNonNullManifestValue(NSArray, key);
}

- (nullable NSArray *)expo_nullableArrayForKey:(id)key {
  return EXGetNullableManifestValue(NSArray, key);
}

- (NSDictionary *)expo_dictionaryForKey:(id)key {
  return EXGetNonNullManifestValue(NSDictionary, key);
}

- (nullable NSDictionary *)expo_nullableDictionaryForKey:(id)key {
  return EXGetNullableManifestValue(NSDictionary, key);
}

@end
