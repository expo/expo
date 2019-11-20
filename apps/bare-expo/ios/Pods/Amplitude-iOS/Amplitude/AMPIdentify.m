//
//  AMPIdentify.m
//  Amplitude
//
//  Created by Daniel Jih on 10/5/15.
//  Copyright © 2015 Amplitude. All rights reserved.
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
#import "AMPIdentify.h"
#import "AMPARCMacros.h"
#import "AMPConstants.h"
#import "AMPUtils.h"

@interface AMPIdentify()
@end

@implementation AMPIdentify
{
    NSMutableSet *_userProperties;
}

- (id)init
{
    if ((self = [super init])) {
        _userPropertyOperations = [[NSMutableDictionary alloc] init];
        _userProperties = [[NSMutableSet alloc] init];
    }
    return self;
}

+ (instancetype)identify
{
    return SAFE_ARC_AUTORELEASE([[self alloc] init]);
}

- (void)dealloc
{
    SAFE_ARC_RELEASE(_userPropertyOperations);
    SAFE_ARC_RELEASE(_userProperties);
    SAFE_ARC_SUPER_DEALLOC();
}

- (AMPIdentify*)add:(NSString*) property value:(NSObject*) value
{
    if ([value isKindOfClass:[NSNumber class]] || [value isKindOfClass:[NSString class]]) {
        [self addToUserProperties:AMP_OP_ADD property:property value:value];
    } else {
        AMPLITUDE_LOG(@"Unsupported value type for ADD operation, expecting NSNumber or NSString");
    }
    return self;
}

- (AMPIdentify*)append:(NSString*) property value:(NSObject*) value
{
    [self addToUserProperties:AMP_OP_APPEND property:property value:value];
    return self;
}

- (AMPIdentify*)clearAll
{
    if ([_userPropertyOperations count] > 0) {
        if ([_userPropertyOperations objectForKey:AMP_OP_CLEAR_ALL] == nil) {
            AMPLITUDE_LOG(@"Need to send $clearAll on its own Identify object without any other operations, skipping $clearAll");
        }
        return self;
    }
    [_userPropertyOperations setObject:@"-" forKey:AMP_OP_CLEAR_ALL];
    return self;
}

- (AMPIdentify*)prepend:(NSString*) property value:(NSObject*) value
{
    [self addToUserProperties:AMP_OP_PREPEND property:property value:value];
    return self;
}

- (AMPIdentify*)set:(NSString*) property value:(NSObject*) value
{
    [self addToUserProperties:AMP_OP_SET property:property value:value];
    return self;
}

- (AMPIdentify*)setOnce:(NSString*) property value:(NSObject*) value
{
    [self addToUserProperties:AMP_OP_SET_ONCE property:property value:value];
    return self;
}

- (AMPIdentify*)unset:(NSString*) property
{
    [self addToUserProperties:AMP_OP_UNSET property:property value:@"-"];
    return self;
}

- (void)addToUserProperties:(NSString*)operation property:(NSString*) property value:(NSObject*) value
{
    if (value == nil) {
        AMPLITUDE_LOG(@"Attempting to perform operation '%@' with nil value for property '%@', ignoring", operation, property);
        return;
    }

    // check that clearAll wasn't already used in this Identify
    if ([_userPropertyOperations objectForKey:AMP_OP_CLEAR_ALL] != nil) {
        AMPLITUDE_LOG(@"This Identify already contains a $clearAll operation, ignoring operation %@", operation);
        return;
    }

    // check if property already used in a previous operation
    if ([_userProperties containsObject:property]) {
        AMPLITUDE_LOG(@"Already used property '%@' in previous operation, ignoring for operation '%@'", property, operation);
        return;
    }

    NSMutableDictionary *operations = [_userPropertyOperations objectForKey:operation];
    if (operations == nil) {
        operations = [NSMutableDictionary dictionary];
        [_userPropertyOperations setObject:operations forKey:operation];
    }
    [operations setObject:[AMPUtils makeJSONSerializable:value] forKey:property];
    [_userProperties addObject:property];
}

@end
