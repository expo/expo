//
//  BNCJSONUtility.m
//  Branch
//
//  Created by Ernest Cho on 9/17/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCJSONUtility.h"

@implementation BNCJSONUtility

+ (BOOL)isNumber:(nullable id)number {
    if (number && ([number isKindOfClass:[NSNumber class]])) {
        return YES;
    }
    return NO;
}

+ (BOOL)isString:(nullable id)string {
    if (string && ([string isKindOfClass:[NSString class]])) {
        return YES;
    }
    return NO;
}

+ (BOOL)isDictionary:(nullable id)dictionary {
    if (dictionary && ([dictionary isKindOfClass:[NSDictionary class]])) {
        return YES;
    }
    return NO;
}

+ (BOOL)isArray:(nullable id)array {
    if (array && ([array isKindOfClass:[NSArray class]])) {
        return YES;
    }
    return NO;
}

+ (nullable NSDictionary *)dictionaryForKey:(NSString *)key json:(NSDictionary *)json {
    if (![self isString:key] || ![self isDictionary:json]) {
        return nil;
    }
    
    NSDictionary *tmp = nil;
    if ([self isDictionary:json[key]]) {
        tmp = json[key];
    }
    return tmp;
}

+ (nullable NSDictionary<NSString *, NSString *> *)stringDictionaryForKey:(NSString *)key json:(NSDictionary *)json {
    NSMutableDictionary<NSString *, NSString *> *typed = nil;
    
    NSDictionary *untyped = [self dictionaryForKey:key json:json];
    if (untyped) {
        typed = [NSMutableDictionary<NSString *, NSString *> new];
    }
    for (id key in untyped.allKeys) {
        id object = untyped[key];
        
        if ([self isString:key] && [self isString:object]) {
            [typed setObject:object forKey:key];
        }
    }
    return typed;
}

+ (nullable NSArray *)arrayForKey:(NSString *)key json:(NSDictionary *)json {
    if (![self isString:key] || ![self isDictionary:json]) {
        return nil;
    }

    NSArray *tmp = nil;
    if ([self isArray:json[key]]) {
        tmp = json[key];
    }
    return tmp;
}

+ (nullable NSArray<NSString *> *)stringArrayForKey:(NSString *)key json:(NSDictionary *)json {
    NSMutableArray<NSString *> *typed = nil;
    
    NSArray *untyped = [self arrayForKey:key json:json];
    if (untyped) {
        typed = [NSMutableArray<NSString *> new];
    }
    for (id item in untyped) {
        if ([self isString:item]) {
            [typed addObject:item];
        }
    }
    
    return typed;
}

+ (nullable NSString *)stringForKey:(NSString *)key json:(NSDictionary *)json {
    if (![self isString:key] || ![self isDictionary:json]) {
        return nil;
    }
    
    NSString *tmp = nil;
    if ([self isString:json[key]]) {
        tmp = [json[key] copy];
    }
    return tmp;
}

+ (nullable NSNumber *)numberForKey:(NSString *)key json:(NSDictionary *)json {
    if (![self isString:key] || ![self isDictionary:json]) {
        return nil;
    }
    
    NSNumber *tmp = nil;
    if ([self isNumber:json[key]]) {
        tmp = [json[key] copy];
    }
    return tmp;
}

@end
