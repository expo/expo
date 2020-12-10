//
//  AMPIdentify.m
//  Copyright (c) 2015 Amplitude Inc. (https://amplitude.com/)
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
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

#import "AMPIdentify.h"
#import "AMPConstants.h"
#import "AMPUtils.h"

@interface AMPIdentify()
@end

@implementation AMPIdentify {
    NSMutableSet *_userProperties;
}

- (instancetype)init {
    if ((self = [super init])) {
        _userPropertyOperations = [[NSMutableDictionary alloc] init];
        _userProperties = [[NSMutableSet alloc] init];
    }
    return self;
}

+ (instancetype)identify {
    return [[self alloc] init];
}

- (AMPIdentify*)add:(NSString*) property value:(NSObject*) value {
    if ([value isKindOfClass:[NSNumber class]] || [value isKindOfClass:[NSString class]]) {
        [self addToUserProperties:AMP_OP_ADD property:property value:value];
    } else {
        AMPLITUDE_LOG(@"Unsupported value type for ADD operation, expecting NSNumber or NSString");
    }
    return self;
}

- (AMPIdentify*)append:(NSString*) property value:(NSObject*) value {
    [self addToUserProperties:AMP_OP_APPEND property:property value:value];
    return self;
}

- (AMPIdentify*)clearAll {
    if ([_userPropertyOperations count] > 0) {
        if ([_userPropertyOperations objectForKey:AMP_OP_CLEAR_ALL] == nil) {
            AMPLITUDE_LOG(@"Need to send $clearAll on its own Identify object without any other operations, skipping $clearAll");
        }
        return self;
    }
    [_userPropertyOperations setObject:@"-" forKey:AMP_OP_CLEAR_ALL];
    return self;
}

- (AMPIdentify*)prepend:(NSString*) property value:(NSObject*) value {
    [self addToUserProperties:AMP_OP_PREPEND property:property value:value];
    return self;
}

- (AMPIdentify*)set:(NSString*) property value:(NSObject*) value {
    [self addToUserProperties:AMP_OP_SET property:property value:value];
    return self;
}

- (AMPIdentify*)setOnce:(NSString*) property value:(NSObject*) value {
    [self addToUserProperties:AMP_OP_SET_ONCE property:property value:value];
    return self;
}

- (AMPIdentify*)unset:(NSString*) property {
    [self addToUserProperties:AMP_OP_UNSET property:property value:@"-"];
    return self;
}

- (void)addToUserProperties:(NSString*)operation property:(NSString*) property value:(NSObject*) value {
    if (value == nil) {
        AMPLITUDE_LOG(@"Attempting to perform operation '%@' with nil value for property '%@', ignoring", operation, property);
        return;
    }

    // Check that clearAll wasn't already used in this Identify.
    if ([_userPropertyOperations objectForKey:AMP_OP_CLEAR_ALL] != nil) {
        AMPLITUDE_LOG(@"This Identify already contains a $clearAll operation, ignoring operation %@", operation);
        return;
    }

    // Check if property was already used in a previous operation.
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
