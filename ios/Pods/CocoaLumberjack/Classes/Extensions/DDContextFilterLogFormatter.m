// Software License Agreement (BSD License)
//
// Copyright (c) 2010-2019, Deusty, LLC
// All rights reserved.
//
// Redistribution and use of this software in source and binary forms,
// with or without modification, are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
//
// * Neither the name of Deusty nor the names of its contributors may be used
//   to endorse or promote products derived from this software without specific
//   prior written permission of Deusty, LLC.

#import "DDContextFilterLogFormatter.h"
#import <pthread/pthread.h>

#if !__has_feature(objc_arc)
#error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
#endif

@interface DDLoggingContextSet : NSObject

- (void)addToSet:(NSInteger)loggingContext;
- (void)removeFromSet:(NSInteger)loggingContext;

@property (readonly, copy) NSArray *currentSet;

- (BOOL)isInSet:(NSInteger)loggingContext;

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface DDContextWhitelistFilterLogFormatter () {
    DDLoggingContextSet *_contextSet;
}

@end


@implementation DDContextWhitelistFilterLogFormatter

- (instancetype)init {
    if ((self = [super init])) {
        _contextSet = [[DDLoggingContextSet alloc] init];
    }

    return self;
}

- (void)addToWhitelist:(NSInteger)loggingContext {
    [_contextSet addToSet:loggingContext];
}

- (void)removeFromWhitelist:(NSInteger)loggingContext {
    [_contextSet removeFromSet:loggingContext];
}

- (NSArray *)whitelist {
    return [_contextSet currentSet];
}

- (BOOL)isOnWhitelist:(NSInteger)loggingContext {
    return [_contextSet isInSet:loggingContext];
}

- (NSString *)formatLogMessage:(DDLogMessage *)logMessage {
    if ([self isOnWhitelist:logMessage->_context]) {
        return logMessage->_message;
    } else {
        return nil;
    }
}

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface DDContextBlacklistFilterLogFormatter () {
    DDLoggingContextSet *_contextSet;
}

@end


@implementation DDContextBlacklistFilterLogFormatter

- (instancetype)init {
    if ((self = [super init])) {
        _contextSet = [[DDLoggingContextSet alloc] init];
    }

    return self;
}

- (void)addToBlacklist:(NSInteger)loggingContext {
    [_contextSet addToSet:loggingContext];
}

- (void)removeFromBlacklist:(NSInteger)loggingContext {
    [_contextSet removeFromSet:loggingContext];
}

- (NSArray *)blacklist {
    return [_contextSet currentSet];
}

- (BOOL)isOnBlacklist:(NSInteger)loggingContext {
    return [_contextSet isInSet:loggingContext];
}

- (NSString *)formatLogMessage:(DDLogMessage *)logMessage {
    if ([self isOnBlacklist:logMessage->_context]) {
        return nil;
    } else {
        return logMessage->_message;
    }
}

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


@interface DDLoggingContextSet () {
    pthread_mutex_t _mutex;
    NSMutableSet *_set;
}

@end


@implementation DDLoggingContextSet

- (instancetype)init {
    if ((self = [super init])) {
        _set = [[NSMutableSet alloc] init];
        pthread_mutex_init(&_mutex, NULL);
    }

    return self;
}

- (void)dealloc {
    pthread_mutex_destroy(&_mutex);
}

- (void)addToSet:(NSInteger)loggingContext {
    pthread_mutex_lock(&_mutex);
    {
        [_set addObject:@(loggingContext)];
    }
    pthread_mutex_unlock(&_mutex);
}

- (void)removeFromSet:(NSInteger)loggingContext {
    pthread_mutex_lock(&_mutex);
    {
        [_set removeObject:@(loggingContext)];
    }
    pthread_mutex_unlock(&_mutex);
}

- (NSArray *)currentSet {
    NSArray *result = nil;

    pthread_mutex_lock(&_mutex);
    {
        result = [_set allObjects];
    }
    pthread_mutex_unlock(&_mutex);

    return result;
}

- (BOOL)isInSet:(NSInteger)loggingContext {
    BOOL result = NO;

    pthread_mutex_lock(&_mutex);
    {
        result = [_set containsObject:@(loggingContext)];
    }
    pthread_mutex_unlock(&_mutex);

    return result;
}

@end
