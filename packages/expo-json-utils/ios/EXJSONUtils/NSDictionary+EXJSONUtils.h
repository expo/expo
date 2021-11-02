// Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSDictionary (EXJSONUtils)

- (NSString *)stringForKey:(NSString *)key;
- (nullable NSString *)nullableStringForKey:(NSString *)key;
- (NSNumber *)numberForKey:(NSString *)key;
- (nullable NSNumber *)nullableNumberForKey:(NSString *)key;
- (NSArray *)arrayForKey:(NSString *)key;
- (nullable NSArray *)nullableArrayForKey:(NSString *)key;
- (NSDictionary *)dictionaryForKey:(NSString *)key;
- (nullable NSDictionary *)nullableDictionaryForKey:(NSString *)key;

@end

NS_ASSUME_NONNULL_END
