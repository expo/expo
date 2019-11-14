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

#import "DDMultiFormatter.h"

#if !__has_feature(objc_arc)
#error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
#endif


@interface DDMultiFormatter () {
    dispatch_queue_t _queue;
    NSMutableArray *_formatters;
}

- (DDLogMessage *)logMessageForLine:(NSString *)line originalMessage:(DDLogMessage *)message;

@end


@implementation DDMultiFormatter

- (instancetype)init {
    self = [super init];

    if (self) {
        _queue = dispatch_queue_create("cocoa.lumberjack.multiformatter", DISPATCH_QUEUE_CONCURRENT);
        _formatters = [NSMutableArray new];
    }

    return self;
}

#pragma mark Processing

- (NSString *)formatLogMessage:(DDLogMessage *)logMessage {
    __block NSString *line = logMessage->_message;

    dispatch_sync(_queue, ^{
        for (id<DDLogFormatter> formatter in self->_formatters) {
            DDLogMessage *message = [self logMessageForLine:line originalMessage:logMessage];
            line = [formatter formatLogMessage:message];

            if (!line) {
                break;
            }
        }
    });

    return line;
}

- (DDLogMessage *)logMessageForLine:(NSString *)line originalMessage:(DDLogMessage *)message {
    DDLogMessage *newMessage = [message copy];

    newMessage->_message = line;
    return newMessage;
}

#pragma mark Formatters

- (NSArray *)formatters {
    __block NSArray *formatters;

    dispatch_sync(_queue, ^{
        formatters = [self->_formatters copy];
    });

    return formatters;
}

- (void)addFormatter:(id<DDLogFormatter>)formatter {
    dispatch_barrier_async(_queue, ^{
        [self->_formatters addObject:formatter];
    });
}

- (void)removeFormatter:(id<DDLogFormatter>)formatter {
    dispatch_barrier_async(_queue, ^{
        [self->_formatters removeObject:formatter];
    });
}

- (void)removeAllFormatters {
    dispatch_barrier_async(_queue, ^{
        [self->_formatters removeAllObjects];
    });
}

- (BOOL)isFormattingWithFormatter:(id<DDLogFormatter>)formatter {
    __block BOOL hasFormatter;

    dispatch_sync(_queue, ^{
        hasFormatter = [self->_formatters containsObject:formatter];
    });

    return hasFormatter;
}

@end
