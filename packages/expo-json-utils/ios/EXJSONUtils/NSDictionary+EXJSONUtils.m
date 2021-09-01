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

- (NSString *)stringForKey:(NSString *)key {
  return EXGetNonNullManifestValue(NSString, key);
}

- (nullable NSString *)nullableStringForKey:(NSString *)key {
  return EXGetNullableManifestValue(NSString, key);
}

- (NSNumber *)numberForKey:(NSString *)key {
  return EXGetNonNullManifestValue(NSNumber, key);
}

- (nullable NSNumber *)nullableNumberForKey:(NSString *)key {
  return EXGetNullableManifestValue(NSNumber, key);
}

- (NSArray *)arrayForKey:(NSString *)key {
  return EXGetNonNullManifestValue(NSArray, key);
}

- (nullable NSArray *)nullableArrayForKey:(NSString *)key {
  return EXGetNullableManifestValue(NSArray, key);
}

- (NSDictionary *)dictionaryForKey:(NSString *)key {
  return EXGetNonNullManifestValue(NSDictionary, key);
}

- (nullable NSDictionary *)nullableDictionaryForKey:(NSString *)key {
  return EXGetNullableManifestValue(NSDictionary, key);
}

@end
