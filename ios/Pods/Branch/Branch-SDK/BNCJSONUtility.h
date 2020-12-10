//
//  BNCJSONUtility.h
//  Branch
//
//  Created by Ernest Cho on 9/17/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Utility methods to convert untyped data to typed data
@interface BNCJSONUtility : NSObject

+ (BOOL)isNumber:(nullable id)number;

+ (BOOL)isString:(nullable id)string;

+ (BOOL)isDictionary:(nullable id)dictionary;

+ (BOOL)isArray:(nullable id)array;

+ (nullable NSDictionary *)dictionaryForKey:(NSString *)key json:(NSDictionary *)json;

+ (nullable NSDictionary<NSString *, NSString *> *)stringDictionaryForKey:(NSString *)key json:(NSDictionary *)json;

+ (nullable NSArray *)arrayForKey:(NSString *)key json:(NSDictionary *)json;

+ (nullable NSArray<NSString *> *)stringArrayForKey:(NSString *)key json:(NSDictionary *)json;

+ (nullable NSString *)stringForKey:(NSString *)key json:(NSDictionary *)json;

+ (nullable NSNumber *)numberForKey:(NSString *)key json:(NSDictionary *)json;

@end

NS_ASSUME_NONNULL_END
