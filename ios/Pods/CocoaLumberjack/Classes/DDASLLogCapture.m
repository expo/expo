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

#import "DDASLLogCapture.h"

// Disable legacy macros
#ifndef DD_LEGACY_MACROS
    #define DD_LEGACY_MACROS 0
#endif

#import "DDLog.h"

#include <asl.h>
#include <notify.h>
#include <notify_keys.h>
#include <sys/time.h>

static BOOL _cancel = YES;
static DDLogLevel _captureLevel = DDLogLevelVerbose;

#ifdef __IPHONE_8_0
    #define DDASL_IOS_PIVOT_VERSION __IPHONE_8_0
#endif
#ifdef __MAC_10_10
    #define DDASL_OSX_PIVOT_VERSION __MAC_10_10
#endif

@implementation DDASLLogCapture

static aslmsg (*dd_asl_next)(aslresponse obj);
static void (*dd_asl_release)(aslresponse obj);

+ (void)initialize
{
    #if (defined(DDASL_IOS_PIVOT_VERSION) && __IPHONE_OS_VERSION_MAX_ALLOWED >= DDASL_IOS_PIVOT_VERSION) || (defined(DDASL_OSX_PIVOT_VERSION) && __MAC_OS_X_VERSION_MAX_ALLOWED >= DDASL_OSX_PIVOT_VERSION)
        #if __IPHONE_OS_VERSION_MIN_REQUIRED < DDASL_IOS_PIVOT_VERSION || __MAC_OS_X_VERSION_MIN_REQUIRED < DDASL_OSX_PIVOT_VERSION
            #pragma GCC diagnostic push
            #pragma GCC diagnostic ignored "-Wdeprecated-declarations"
                // Building on falsely advertised SDK, targeting deprecated API
                dd_asl_next    = &aslresponse_next;
                dd_asl_release = &aslresponse_free;
            #pragma GCC diagnostic pop
        #else
            // Building on lastest, correct SDK, targeting latest API
            dd_asl_next    = &asl_next;
            dd_asl_release = &asl_release;
        #endif
    #else
        // Building on old SDKs, targeting deprecated API
        dd_asl_next    = &aslresponse_next;
        dd_asl_release = &aslresponse_free;
    #endif
}

+ (void)start {
    // Ignore subsequent calls
    if (!_cancel) {
        return;
    }
    
    _cancel = NO;
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^(void) {
        [self captureAslLogs];
    });
}

+ (void)stop {
    _cancel = YES;
}

+ (DDLogLevel)captureLevel {
    return _captureLevel;
}

+ (void)setCaptureLevel:(DDLogLevel)level {
    _captureLevel = level;
}

#pragma mark - Private methods

+ (void)configureAslQuery:(aslmsg)query {
    const char param[] = "7";  // ASL_LEVEL_DEBUG, which is everything. We'll rely on regular DDlog log level to filter
    
    asl_set_query(query, ASL_KEY_LEVEL, param, ASL_QUERY_OP_LESS_EQUAL | ASL_QUERY_OP_NUMERIC);

    // Don't retrieve logs from our own DDASLLogger
    asl_set_query(query, kDDASLKeyDDLog, kDDASLDDLogValue, ASL_QUERY_OP_NOT_EQUAL);
    
#if !TARGET_OS_IPHONE || TARGET_SIMULATOR
    int processId = [[NSProcessInfo processInfo] processIdentifier];
    char pid[16];
    sprintf(pid, "%d", processId);
    asl_set_query(query, ASL_KEY_PID, pid, ASL_QUERY_OP_EQUAL | ASL_QUERY_OP_NUMERIC);
#endif
}

+ (void)aslMessageReceived:(aslmsg)msg {
    const char* messageCString = asl_get( msg, ASL_KEY_MSG );
    if ( messageCString == NULL )
        return;

    int flag;
    BOOL async;

    const char* levelCString = asl_get(msg, ASL_KEY_LEVEL);
    switch (levelCString? atoi(levelCString) : 0) {
        // By default all NSLog's with a ASL_LEVEL_WARNING level
        case ASL_LEVEL_EMERG    :
        case ASL_LEVEL_ALERT    :
        case ASL_LEVEL_CRIT     : flag = DDLogFlagError;    async = NO;  break;
        case ASL_LEVEL_ERR      : flag = DDLogFlagWarning;  async = YES; break;
        case ASL_LEVEL_WARNING  : flag = DDLogFlagInfo;     async = YES; break;
        case ASL_LEVEL_NOTICE   : flag = DDLogFlagDebug;    async = YES; break;
        case ASL_LEVEL_INFO     :
        case ASL_LEVEL_DEBUG    :
        default                 : flag = DDLogFlagVerbose;  async = YES;  break;
    }

    if (!(_captureLevel & flag)) {
        return;
    }

    //  NSString * sender = [NSString stringWithCString:asl_get(msg, ASL_KEY_SENDER) encoding:NSUTF8StringEncoding];
    NSString *message = @(messageCString);

    const char* secondsCString = asl_get( msg, ASL_KEY_TIME );
    const char* nanoCString = asl_get( msg, ASL_KEY_TIME_NSEC );
    NSTimeInterval seconds = secondsCString ? strtod(secondsCString, NULL) : [NSDate timeIntervalSinceReferenceDate] - NSTimeIntervalSince1970;
    double nanoSeconds = nanoCString? strtod(nanoCString, NULL) : 0;
    NSTimeInterval totalSeconds = seconds + (nanoSeconds / 1e9);

    NSDate *timeStamp = [NSDate dateWithTimeIntervalSince1970:totalSeconds];

    DDLogMessage *logMessage = [[DDLogMessage alloc]initWithMessage:message
                                                              level:_captureLevel
                                                               flag:flag
                                                            context:0
                                                               file:@"DDASLLogCapture"
                                                           function:0
                                                               line:0
                                                                tag:nil
                                                            options:0
                                                          timestamp:timeStamp];
    
    [DDLog log:async message:logMessage];
}

+ (void)captureAslLogs {
    @autoreleasepool
    {
        /*
           We use ASL_KEY_MSG_ID to see each message once, but there's no
           obvious way to get the "next" ID. To bootstrap the process, we'll
           search by timestamp until we've seen a message.
         */

        struct timeval timeval = {
            .tv_sec = 0
        };
        gettimeofday(&timeval, NULL);
        unsigned long long startTime = timeval.tv_sec;
        __block unsigned long long lastSeenID = 0;

        /*
           syslogd posts kNotifyASLDBUpdate (com.apple.system.logger.message)
           through the notify API when it saves messages to the ASL database.
           There is some coalescing - currently it is sent at most twice per
           second - but there is no documented guarantee about this. In any
           case, there may be multiple messages per notification.

           Notify notifications don't carry any payload, so we need to search
           for the messages.
         */
        int notifyToken = 0;  // Can be used to unregister with notify_cancel().
        notify_register_dispatch(kNotifyASLDBUpdate, &notifyToken, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^(int token)
        {
            // At least one message has been posted; build a search query.
            @autoreleasepool
            {
                aslmsg query = asl_new(ASL_TYPE_QUERY);
                char stringValue[64];

                if (lastSeenID > 0) {
                    snprintf(stringValue, sizeof stringValue, "%llu", lastSeenID);
                    asl_set_query(query, ASL_KEY_MSG_ID, stringValue, ASL_QUERY_OP_GREATER | ASL_QUERY_OP_NUMERIC);
                } else {
                    snprintf(stringValue, sizeof stringValue, "%llu", startTime);
                    asl_set_query(query, ASL_KEY_TIME, stringValue, ASL_QUERY_OP_GREATER_EQUAL | ASL_QUERY_OP_NUMERIC);
                }

                [self configureAslQuery:query];

                // Iterate over new messages.
                aslmsg msg;
                aslresponse response = asl_search(NULL, query);
                
                while ((msg = dd_asl_next(response)))
                {
                    [self aslMessageReceived:msg];

                    // Keep track of which messages we've seen.
                    lastSeenID = atoll(asl_get(msg, ASL_KEY_MSG_ID));
                }
                dd_asl_release(response);
                asl_free(query);

                if (_cancel) {
                    notify_cancel(token);
                    return;
                }

            }
        });
    }
}

@end
