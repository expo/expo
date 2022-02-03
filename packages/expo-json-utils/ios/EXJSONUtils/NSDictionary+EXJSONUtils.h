// Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSDictionary<__covariant KeyType, __covariant ObjectType> (EXJSONUtils)

- (NSString *)stringForKey:(KeyType)key;
- (nullable NSString *)nullableStringForKey:(KeyType)key;
- (NSNumber *)numberForKey:(KeyType)key;
- (nullable NSNumber *)nullableNumberForKey:(KeyType)key;
- (NSArray *)arrayForKey:(KeyType)key;
- (nullable NSArray *)nullableArrayForKey:(KeyType)key;
- (NSDictionary *)dictionaryForKey:(KeyType)key;
- (nullable NSDictionary *)nullableDictionaryForKey:(KeyType)key;

@end

NS_ASSUME_NONNULL_END
