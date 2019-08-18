// Software License Agreement (BSD License)
//
// Copyright (c) 2010-2016, Deusty, LLC
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

#import "DDDispatchQueueLogFormatter.h"
#import <libkern/OSAtomic.h>
#import <objc/runtime.h>


#if !__has_feature(objc_arc)
#error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
#endif

@interface DDDispatchQueueLogFormatter () {
    DDDispatchQueueLogFormatterMode _mode;
    NSString *_dateFormatterKey;
    
    int32_t _atomicLoggerCount;
    NSDateFormatter *_threadUnsafeDateFormatter; // Use [self stringFromDate]
    
    OSSpinLock _lock;
    
    NSUInteger _minQueueLength;           // _prefix == Only access via atomic property
    NSUInteger _maxQueueLength;           // _prefix == Only access via atomic property
    NSMutableDictionary *_replacements;   // _prefix == Only access from within spinlock
}

@end


@implementation DDDispatchQueueLogFormatter

- (instancetype)init {
    if ((self = [super init])) {
        _mode = DDDispatchQueueLogFormatterModeShareble;

        // We need to carefully pick the name for storing in thread dictionary to not
        // use a formatter configured by subclass and avoid surprises.
        Class cls = [self class];
        Class superClass = class_getSuperclass(cls);
        SEL configMethodName = @selector(configureDateFormatter:);
        Method configMethod = class_getInstanceMethod(cls, configMethodName);
        while (class_getInstanceMethod(superClass, configMethodName) == configMethod) {
            cls = superClass;
            superClass = class_getSuperclass(cls);
        }
        // now `cls` is the class that provides implementation for `configureDateFormatter:`
        _dateFormatterKey = [NSString stringWithFormat:@"%s_NSDateFormatter", class_getName(cls)];

        _atomicLoggerCount = 0;
        _threadUnsafeDateFormatter = nil;

        _minQueueLength = 0;
        _maxQueueLength = 0;
        _lock = OS_SPINLOCK_INIT;
        _replacements = [[NSMutableDictionary alloc] init];

        // Set default replacements:

        _replacements[@"com.apple.main-thread"] = @"main";
    }

    return self;
}

- (instancetype)initWithMode:(DDDispatchQueueLogFormatterMode)mode {
    if ((self = [self init])) {
        _mode = mode;
    }
    return self;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@synthesize minQueueLength = _minQueueLength;
@synthesize maxQueueLength = _maxQueueLength;

- (NSString *)replacementStringForQueueLabel:(NSString *)longLabel {
    NSString *result = nil;

    OSSpinLockLock(&_lock);
    {
        result = _replacements[longLabel];
    }
    OSSpinLockUnlock(&_lock);

    return result;
}

- (void)setReplacementString:(NSString *)shortLabel forQueueLabel:(NSString *)longLabel {
    OSSpinLockLock(&_lock);
    {
        if (shortLabel) {
            _replacements[longLabel] = shortLabel;
        } else {
            [_replacements removeObjectForKey:longLabel];
        }
    }
    OSSpinLockUnlock(&_lock);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark DDLogFormatter
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (NSDateFormatter *)createDateFormatter {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [self configureDateFormatter:formatter];
    return formatter;
}

- (void)configureDateFormatter:(NSDateFormatter *)dateFormatter {
    [dateFormatter setFormatterBehavior:NSDateFormatterBehavior10_4];
    [dateFormatter setDateFormat:@"yyyy-MM-dd HH:mm:ss:SSS"];
    [dateFormatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];

    NSString *calendarIdentifier = nil;
#if defined(__IPHONE_8_0) || defined(__MAC_10_10)
    calendarIdentifier = NSCalendarIdentifierGregorian;
#else
    calendarIdentifier = NSGregorianCalendar;
#endif

    [dateFormatter setCalendar:[[NSCalendar alloc] initWithCalendarIdentifier:calendarIdentifier]];
}

- (NSString *)stringFromDate:(NSDate *)date {

    NSDateFormatter *dateFormatter = nil;
    if (_mode == DDDispatchQueueLogFormatterModeNonShareble) {
        // Single-threaded mode.

        dateFormatter = _threadUnsafeDateFormatter;
        if (dateFormatter == nil) {
            dateFormatter = [self createDateFormatter];
            _threadUnsafeDateFormatter = dateFormatter;
        }
    } else {
        // Multi-threaded mode.
        // NSDateFormatter is NOT thread-safe.

        NSString *key = _dateFormatterKey;

        NSMutableDictionary *threadDictionary = [[NSThread currentThread] threadDictionary];
        dateFormatter = threadDictionary[key];

        if (dateFormatter == nil) {
            dateFormatter = [self createDateFormatter];
            threadDictionary[key] = dateFormatter;
        }
    }

    return [dateFormatter stringFromDate:date];
}

- (NSString *)queueThreadLabelForLogMessage:(DDLogMessage *)logMessage {
    // As per the DDLogFormatter contract, this method is always invoked on the same thread/dispatch_queue

    NSUInteger minQueueLength = self.minQueueLength;
    NSUInteger maxQueueLength = self.maxQueueLength;

    // Get the name of the queue, thread, or machID (whichever we are to use).

    NSString *queueThreadLabel = nil;

    BOOL useQueueLabel = YES;
    BOOL useThreadName = NO;

    if (logMessage->_queueLabel) {
        // If you manually create a thread, it's dispatch_queue will have one of the thread names below.
        // Since all such threads have the same name, we'd prefer to use the threadName or the machThreadID.

        NSArray *names = @[
            @"com.apple.root.low-priority",
            @"com.apple.root.default-priority",
            @"com.apple.root.high-priority",
            @"com.apple.root.low-overcommit-priority",
            @"com.apple.root.default-overcommit-priority",
            @"com.apple.root.high-overcommit-priority"
        ];

        for (NSString * name in names) {
            if ([logMessage->_queueLabel isEqualToString:name]) {
                useQueueLabel = NO;
                useThreadName = [logMessage->_threadName length] > 0;
                break;
            }
        }
    } else {
        useQueueLabel = NO;
        useThreadName = [logMessage->_threadName length] > 0;
    }

    if (useQueueLabel || useThreadName) {
        NSString *fullLabel;
        NSString *abrvLabel;

        if (useQueueLabel) {
            fullLabel = logMessage->_queueLabel;
        } else {
            fullLabel = logMessage->_threadName;
        }

        OSSpinLockLock(&_lock);
        {
            abrvLabel = _replacements[fullLabel];
        }
        OSSpinLockUnlock(&_lock);

        if (abrvLabel) {
            queueThreadLabel = abrvLabel;
        } else {
            queueThreadLabel = fullLabel;
        }
    } else {
        queueThreadLabel = logMessage->_threadID;
    }

    // Now use the thread label in the output

    NSUInteger labelLength = [queueThreadLabel length];

    // labelLength > maxQueueLength : truncate
    // labelLength < minQueueLength : padding
    //                              : exact

    if ((maxQueueLength > 0) && (labelLength > maxQueueLength)) {
        // Truncate

        return [queueThreadLabel substringToIndex:maxQueueLength];
    } else if (labelLength < minQueueLength) {
        // Padding

        NSUInteger numSpaces = minQueueLength - labelLength;

        char spaces[numSpaces + 1];
        memset(spaces, ' ', numSpaces);
        spaces[numSpaces] = '\0';

        return [NSString stringWithFormat:@"%@%s", queueThreadLabel, spaces];
    } else {
        // Exact

        return queueThreadLabel;
    }
}

- (NSString *)formatLogMessage:(DDLogMessage *)logMessage {
    NSString *timestamp = [self stringFromDate:(logMessage->_timestamp)];
    NSString *queueThreadLabel = [self queueThreadLabelForLogMessage:logMessage];

    return [NSString stringWithFormat:@"%@ [%@] %@", timestamp, queueThreadLabel, logMessage->_message];
}

- (void)didAddToLogger:(id <DDLogger>  __attribute__((unused)))logger {
    int32_t count = 0;
    count = OSAtomicIncrement32(&_atomicLoggerCount);
    NSAssert(count <= 1 || _mode == DDDispatchQueueLogFormatterModeShareble, @"Can't reuse formatter with multiple loggers in non-shareable mode.");
}

- (void)willRemoveFromLogger:(id <DDLogger> __attribute__((unused)))logger {
    OSAtomicDecrement32(&_atomicLoggerCount);
}

@end
