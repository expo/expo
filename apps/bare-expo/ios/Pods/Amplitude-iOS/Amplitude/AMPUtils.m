//
//  AMPUtil.m
//  Pods
//
//  Created by Daniel Jih on 10/4/15.
//
//

#ifndef AMPLITUDE_DEBUG
#define AMPLITUDE_DEBUG 0
#endif

#ifndef AMPLITUDE_LOG
#if AMPLITUDE_DEBUG
#   define AMPLITUDE_LOG(fmt, ...) NSLog(fmt, ##__VA_ARGS__)
#else
#   define AMPLITUDE_LOG(...)
#endif
#endif

#import <Foundation/Foundation.h>
#import "AMPUtils.h"
#import "AMPARCMacros.h"

@interface AMPUtils()
@end

@implementation AMPUtils

+ (id)alloc
{
    // Util class cannot be instantiated.
    return nil;
}

+ (NSString*)generateUUID
{
    CFUUIDRef uuid = CFUUIDCreate(kCFAllocatorDefault);
#if __has_feature(objc_arc)
    NSString *uuidStr = (__bridge_transfer NSString *)CFUUIDCreateString(kCFAllocatorDefault, uuid);
#else
    NSString *uuidStr = (NSString *) CFUUIDCreateString(kCFAllocatorDefault, uuid);
#endif
    CFRelease(uuid);
    return SAFE_ARC_AUTORELEASE(uuidStr);
}

+ (id) makeJSONSerializable:(id) obj
{
    if (obj == nil) {
        return [NSNull null];
    }
    if ([obj isKindOfClass:[NSString class]] ||
        [obj isKindOfClass:[NSNull class]]) {
        return obj;
    }
    if ([obj isKindOfClass:[NSNumber class]]) {
        if (!isfinite([obj floatValue])) {
            return [NSNull null];
        } else {
            return obj;
        }
    }
    if ([obj isKindOfClass:[NSDate class]]) {
        return [obj description];
    }
    if ([obj isKindOfClass:[NSArray class]]) {
        NSMutableArray *arr = [NSMutableArray array];
        id objCopy = [obj copy];
        for (id i in objCopy) {
            [arr addObject:[self makeJSONSerializable:i]];
        }
        SAFE_ARC_RELEASE(objCopy);
        return [NSArray arrayWithArray:arr];
    }
    if ([obj isKindOfClass:[NSDictionary class]]) {
        NSMutableDictionary *dict = [NSMutableDictionary dictionary];
        id objCopy = [obj copy];
        for (id key in objCopy) {
            NSString *coercedKey = [self coerceToString:key withName:@"property key"];
            dict[coercedKey] = [self makeJSONSerializable:objCopy[key]];
        }
        SAFE_ARC_RELEASE(objCopy);
        return [NSDictionary dictionaryWithDictionary:dict];
    }
    NSString *str = [obj description];
    AMPLITUDE_LOG(@"WARNING: Invalid property value type, received %@, coercing to %@", [obj class], str);
    return str;
}

+ (BOOL) isEmptyString:(NSString*) str
{
    return str == nil || [str isKindOfClass:[NSNull class]] || [str length] == 0;
}

+ (NSString *) coerceToString: (id) obj withName:(NSString *) name
{
    NSString *coercedString;
    if (![obj isKindOfClass:[NSString class]]) {
        coercedString = [obj description];
        AMPLITUDE_LOG(@"WARNING: Non-string %@, received %@, coercing to %@", name, [obj class], coercedString);
    } else {
        coercedString = obj;
    }
    return coercedString;
}

+ (NSDictionary *) validateGroups:(NSDictionary *) obj
{
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    id objCopy = [obj copy];
    for (id key in objCopy) {
        NSString *coercedKey = [self coerceToString:key withName:@"groupType"];

        id value = objCopy[key];
        if ([value isKindOfClass:[NSString class]]) {
            dict[coercedKey] = value;
        } else if ([value isKindOfClass:[NSArray class]]) {
            NSMutableArray *arr = [NSMutableArray array];
            for (id i in value) {
                if ([i isKindOfClass:[NSArray class]]) {
                    AMPLITUDE_LOG(@"WARNING: Skipping nested NSArray in groupName value for groupType %@", coercedKey);
                    continue;
                } else if ([i isKindOfClass:[NSDictionary class]]) {
                    AMPLITUDE_LOG(@"WARNING: Skipping nested NSDictionary in groupName value for groupType %@", coercedKey);
                    continue;
                } else if ([i isKindOfClass:[NSString class]] || [i isKindOfClass:[NSNumber class]] || [i isKindOfClass:[NSDate class]]) {
                    [arr addObject:[self coerceToString:i withName:@"groupType"]];
                } else {
                    AMPLITUDE_LOG(@"WARNING: Invalid groupName value in array for groupType %@ (received class %@). Please use NSStrings", coercedKey, [i class]);
                }
            }
            dict[coercedKey] = [NSArray arrayWithArray:arr];
        } else if ([value isKindOfClass:[NSNumber class]] || [value isKindOfClass:[NSDate class]]){
            dict[coercedKey] = [self coerceToString:value withName:@"groupName"];
        } else {
            AMPLITUDE_LOG(@"WARNING: Invalid groupName value for groupType %@ (received class %@). Please use NSString or NSArray of NSStrings", coercedKey, [value class]);
        }
    }
    SAFE_ARC_RELEASE(objCopy);
    return [NSDictionary dictionaryWithDictionary:dict];
}

+ (NSString*) platformDataDirectory
{
#if TARGET_OS_TV
    return [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) objectAtIndex: 0];
#else
    return [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) objectAtIndex: 0];
#endif
}

@end
