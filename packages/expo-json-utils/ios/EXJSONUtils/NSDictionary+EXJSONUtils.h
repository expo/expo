// Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSDictionary<__covariant KeyType, __covariant ObjectType> (EXJSONUtils)

- (NSString *)expo_stringForKey:(KeyType)key;
- (nullable NSString *)expo_nullableStringForKey:(KeyType)key;
- (NSNumber *)expo_numberForKey:(KeyType)key;
- (nullable NSNumber *)expo_nullableNumberForKey:(KeyType)key;
- (NSArray *)expo_arrayForKey:(KeyType)key;
- (nullable NSArray *)expo_nullableArrayForKey:(KeyType)key;
- (NSDictionary *)expo_dictionaryForKey:(KeyType)key;
- (nullable NSDictionary *)expo_nullableDictionaryForKey:(KeyType)key;

@end

NS_ASSUME_NONNULL_END
