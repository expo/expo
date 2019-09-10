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

#import "DDOSLogger.h"

#import <os/log.h>

@interface DDOSLogger () {
    NSString *_subsystem;
    NSString *_category;
}
@property (copy, nonatomic, readonly) NSString *subsystem;
@property (copy, nonatomic, readonly) NSString *category;
@property (strong, nonatomic, readwrite) os_log_t  logger;
@end

@implementation DDOSLogger

@synthesize subsystem = _subsystem;
@synthesize category = _category;

#pragma mark - Initialization

/**
 * Assertion
 * Swift: (String, String)?
 */
- (instancetype)initWithSubsystem:(NSString *)subsystem category:(NSString *)category {
    NSAssert((subsystem == nil) == (category == nil), @"Either both subsystem and category or neither can be nil.");
    if (self = [super init]) {
        _subsystem = [subsystem copy];
        _category = [category copy];
    }
    return self;
}

static DDOSLogger *sharedInstance;

- (instancetype)init {
    return [self initWithSubsystem:nil category:nil];
}

+ (instancetype)sharedInstance {
    static dispatch_once_t DDOSLoggerOnceToken;

    dispatch_once(&DDOSLoggerOnceToken, ^{
        sharedInstance = [[[self class] alloc] init];
    });

    return sharedInstance;
}

#pragma mark - os_log

- (os_log_t)getLogger {
    if (self.subsystem == nil || self.category == nil) {
        return OS_LOG_DEFAULT;
    }
    __auto_type subdomain = self.subsystem.UTF8String;
    __auto_type category = self.category.UTF8String;
    return os_log_create(subdomain, category);
}

- (os_log_t)logger {
    if (_logger == nil)  {
        _logger = [self getLogger];
    }
    return _logger;
}

#pragma mark - DDLogger

- (void)logMessage:(DDLogMessage *)logMessage {
    // Skip captured log messages
    if ([logMessage->_fileName isEqualToString:@"DDASLLogCapture"]) {
        return;
    }

    if(@available(iOS 10.0, macOS 10.12, tvOS 10.0, watchOS 3.0, *)) {

        NSString * message = _logFormatter ? [_logFormatter formatLogMessage:logMessage] : logMessage->_message;
        if (message != nil) {
            const char *msg = [message UTF8String];
            __auto_type logger = [self logger];
            switch (logMessage->_flag) {
                case DDLogFlagError     :
                    os_log_error(logger, "%{public}s", msg);
                    break;
                case DDLogFlagWarning   :
                case DDLogFlagInfo      :
                    os_log_info(logger, "%{public}s", msg);
                    break;
                case DDLogFlagDebug     :
                case DDLogFlagVerbose   :
                default                 :
                    os_log_debug(logger, "%{public}s", msg);
                    break;
            }
        }

    }

}

- (DDLoggerName)loggerName {
    return DDLoggerNameOS;
}
@end
