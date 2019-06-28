/**
 @file          BNCLog.m
 @package       Branch-SDK
 @brief         Simple logging functions.

 @author        Edward Smith
 @date          October 2016
 @copyright     Copyright © 2016 Branch. All rights reserved.
*/

#import "BNCLog.h"
#import <stdatomic.h> // import not available in Xcode 7

#define _countof(array)  (sizeof(array)/sizeof(array[0]))
static NSNumber *bnc_LogIsInitialized = nil;

// All log synchronization and globals are coordinated through the bnc_LogQueue.
static dispatch_queue_t bnc_LogQueue = nil;

static off_t bnc_LogOffset           = 0;
static off_t bnc_LogOffsetMax        = 100;
static off_t bnc_LogRecordSize       = 1024;
static BNCLogOutputFunctionPtr bnc_LoggingFunction = nil; // Default to just NSLog output.
static BNCLogFlushFunctionPtr  bnc_LogFlushFunction = nil;
static NSDateFormatter *bnc_LogDateFormatter = nil;

// A fallback attempt at logging if an error occurs in BNCLog.
// BNCLog can't log itself, but if an error occurs it uses this simple define:
extern void BNCLogInternalErrorFunction(int linenumber, NSString*format, ...);
void BNCLogInternalErrorFunction(int linenumber, NSString*format, ...) {

    va_list args;
    va_start(args, format);
    NSString* message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    NSLog(@"[branch.io] BNCLog.m (%d) Log error: %@", linenumber, message);
}

#define BNCLogInternalError(...) \
    BNCLogInternalErrorFunction(__LINE__, __VA_ARGS__)


inline static void BNCLogInitializeClient_Internal() {
    BNCLogClientInitializeFunctionPtr initFunction = BNCLogSetClientInitializeFunction(NULL);
    if (initFunction) {
        initFunction();
    }
}

#pragma mark - Default Output Functions

static int bnc_LogDescriptor = -1;

void BNCLogFunctionOutputToStdOut(
        NSDate*_Nonnull timestamp,
        BNCLogLevel level,
        NSString *_Nullable message
    ) {
    NSData *data = [message dataUsingEncoding:NSNEXTSTEPStringEncoding];
    if (!data) data = [@"<nil>" dataUsingEncoding:NSNEXTSTEPStringEncoding];
    long n = write(STDOUT_FILENO, data.bytes, data.length);
    if (n < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't write log message (%d): %s.", e, strerror(e));
    }
    write(STDOUT_FILENO, "\n   ", sizeof('\n'));
}

void BNCLogFunctionOutputToStdErr(
        NSDate*_Nonnull timestamp,
        BNCLogLevel level,
        NSString *_Nullable message
    ) {
    NSData *data = [message dataUsingEncoding:NSNEXTSTEPStringEncoding];
    if (!data) data = [@"<nil>" dataUsingEncoding:NSNEXTSTEPStringEncoding];
    long n = write(STDERR_FILENO, data.bytes, data.length);
    if (n < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't write log message (%d): %s.", e, strerror(e));
    }
    write(STDERR_FILENO, "\n   ", sizeof('\n'));
}

void BNCLogFunctionOutputToFileDescriptor(
        NSDate*_Nonnull timestamp,
        BNCLogLevel level,
        NSString *_Nullable message
    ) {
    // Pad length to even characters
    if (!message) message = @"";
    NSString *string = [NSString stringWithFormat:@"%@\n", message];
    NSData *data = [string dataUsingEncoding:NSUTF8StringEncoding];
    if ((data.length & 1) == 1) {
        string = [NSString stringWithFormat:@"%@ \n", message];
        data = [string dataUsingEncoding:NSUTF8StringEncoding];
    }
    if ((data.length & 1) != 0) {
        BNCLogInternalError(@"Writing un-even bytes!");
    }
    long n = write(bnc_LogDescriptor, data.bytes, data.length);
    if (n < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't write log message (%d): %s.", e, strerror(e));
    }
}

void BNCLogFlushFileDescriptor() {
    if (bnc_LogDescriptor >= 0) {
        fsync(bnc_LogDescriptor);
    }
}

void BNCLogSetOutputToURL_Interal(NSURL *_Nullable url) {
    if (url == nil) return;
    bnc_LogDescriptor = open(
        url.path.UTF8String,
        O_RDWR|O_CREAT|O_APPEND,
        S_IRUSR|S_IWUSR|S_IRGRP|S_IWGRP
    );
    if (bnc_LogDescriptor < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't open log file '%@'.", url);
        BNCLogInternalError(@"Can't open log file (%d): %s.", e, strerror(e));
        return;
    }
    bnc_LoggingFunction = BNCLogFunctionOutputToFileDescriptor;
    bnc_LogFlushFunction = BNCLogFlushFileDescriptor;
}

void BNCLogSetOutputToURL(NSURL *_Nullable url) {
    dispatch_sync(bnc_LogQueue, ^{
        if (bnc_LogFlushFunction)
            bnc_LogFlushFunction();
        if (bnc_LogDescriptor >= 0) {
            close(bnc_LogDescriptor);
            bnc_LogDescriptor = -1;
        }
        BNCLogSetOutputToURL_Interal(url);
    });
}

#pragma mark - Record Wrap Output File Functions

void BNCLogRecordWrapWrite(NSDate*_Nonnull timestamp, BNCLogLevel level, NSString *_Nullable message) {

    NSString * string = [NSString stringWithFormat:@"%@ %ld %@",
        [bnc_LogDateFormatter stringFromDate:timestamp], (long) level, message];
    NSData *stringData = [string dataUsingEncoding:NSUTF8StringEncoding];

    char buffer[bnc_LogRecordSize];
    memset(buffer, ' ', sizeof(buffer));
    buffer[sizeof(buffer)-1] = '\n';
    long len = MIN(stringData.length, sizeof(buffer)-1);
    memcpy(buffer, stringData.bytes, len);

    off_t n = write(bnc_LogDescriptor, buffer, sizeof(buffer));
    if (n < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't write log message (%d): %s.", e, strerror(e));
    }
    bnc_LogOffset++;
    if (bnc_LogOffset >= bnc_LogOffsetMax) {
        bnc_LogOffset = 0;
        n = lseek(bnc_LogDescriptor, 0, SEEK_SET);
        if (n < 0) {
            int e = errno;
            BNCLogInternalError(@"Can't seek in log (%d): %s.", e, strerror(e));
        }
    }
}

void BNCLogRecordWrapFlush() {
    if (bnc_LogDescriptor >= 0) {
        fsync(bnc_LogDescriptor);
    }
}

BOOL BNCLogRecordWrapOpenURL_Internal(NSURL *url, long maxRecords, long recordSize) {
    if (url == nil) return NO;
    bnc_LogOffsetMax = MAX(1, maxRecords);
    bnc_LogRecordSize = MAX(64, recordSize);
    if ((bnc_LogRecordSize & 1) != 0) {
        // Can't have odd-length records.
        bnc_LogRecordSize++;
    }
    bnc_LogDescriptor = open(
        url.path.UTF8String,
        O_RDWR|O_CREAT,
        S_IRUSR|S_IWUSR|S_IRGRP|S_IWGRP
    );
    if (bnc_LogDescriptor < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't open log file '%@'.", url);
        BNCLogInternalError(@"Can't open log file (%d): %s.", e, strerror(e));
        return NO;
    }
    bnc_LoggingFunction = BNCLogRecordWrapWrite;
    bnc_LogFlushFunction = BNCLogRecordWrapFlush;

    // Truncate the file if the file size > max file size.

    off_t fileOffset = 0;
    off_t maxSz = bnc_LogOffsetMax * bnc_LogRecordSize;
    off_t sz = lseek(bnc_LogDescriptor, 0, SEEK_END);
    if (sz < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't seek in log (%d): %s.", e, strerror(e));
    } else if (sz > maxSz) {
        fileOffset = ftruncate(bnc_LogDescriptor, maxSz);
        if (fileOffset < 0) {
            int e = errno;
            BNCLogInternalError(@"Can't truncate log (%d): %s.", e, strerror(e));
        }
    }
    lseek(bnc_LogDescriptor, 0, SEEK_SET);

    // Read the records until the oldest record is found --

    off_t oldestOffset = 0;
    NSDate * oldestDate = [NSDate distantFuture];
    NSDate * lastDate = [NSDate distantFuture];

    off_t offset = 0;
    char buffer[bnc_LogRecordSize];
    ssize_t bytesRead = read(bnc_LogDescriptor, &buffer, sizeof(buffer));
    while ((unsigned long) bytesRead == sizeof(buffer)) {
        NSString *dateString =
            [[NSString alloc] initWithBytes:buffer length:27 encoding:NSUTF8StringEncoding];
        NSDate *date = [bnc_LogDateFormatter dateFromString:dateString];
        if ([date compare:oldestDate] < 0 ||
              [date compare:lastDate] < 0) {
            oldestOffset = offset;
            oldestDate = date;
        }
        offset++;
        if (date) lastDate = date;
        bytesRead = read(bnc_LogDescriptor, &buffer, sizeof(buffer));
    }
    if (offset < bnc_LogOffsetMax)
        bnc_LogOffset = offset;
    else
    if (oldestOffset >= bnc_LogOffsetMax)
        bnc_LogOffset = 0;
    else
        bnc_LogOffset = oldestOffset;
    sz = lseek(bnc_LogDescriptor, bnc_LogOffset*bnc_LogRecordSize, SEEK_SET);
    if (sz < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't seek in log (%d): %s.", e, strerror(e));
    }
    return YES;
}

BOOL BNCLogRecordWrapOpenURL(NSURL *url, long maxRecords, long recordSize) {
    __block BOOL result = NO;
    dispatch_sync(bnc_LogQueue, ^{
        if (bnc_LogFlushFunction)
            bnc_LogFlushFunction();
        if (bnc_LogDescriptor >= 0) {
            close(bnc_LogDescriptor);
            bnc_LogDescriptor = -1;
        }
        bnc_LoggingFunction = NULL;
        bnc_LogFlushFunction = NULL;
        result = BNCLogRecordWrapOpenURL_Internal(url, maxRecords, recordSize);
    });
    return result;
}

void BNCLogSetOutputToURLRecordWrapSize(NSURL *_Nullable url, long maxRecords, long recordSize) {
    BNCLogRecordWrapOpenURL(url, maxRecords, recordSize);
}

void BNCLogSetOutputToURLRecordWrap(NSURL *_Nullable url, long maxRecords) {
    BNCLogSetOutputToURLRecordWrapSize(url, maxRecords, 1024);
}

#pragma mark - Byte Wrap Output File Functions

void BNCLogByteWrapWrite(NSDate*_Nonnull timestamp, BNCLogLevel level, NSString *_Nullable message) {

    NSString * string = [NSString stringWithFormat:@"%@ %ld %@\n",
        [bnc_LogDateFormatter stringFromDate:timestamp], (long) level, message];
    NSData *stringData = [string dataUsingEncoding:NSUTF8StringEncoding];

    if ((stringData.length & 1) != 0) {
        string = [NSString stringWithFormat:@"%@ %ld %@ \n",
            [bnc_LogDateFormatter stringFromDate:timestamp], (long) level, message];
        stringData = [string dataUsingEncoding:NSUTF8StringEncoding];
    }

    // Truncate the file if the file size > max file size.

    if ((bnc_LogOffset + stringData.length) > bnc_LogOffsetMax) {
        long n = ftruncate(bnc_LogDescriptor, bnc_LogOffset);
        if (n < 0) {
            int e = errno;
            BNCLogInternalError(@"Can't truncate log (%d): %s.", e, strerror(e));
        }
        lseek(bnc_LogDescriptor, 0, SEEK_SET);
        bnc_LogOffset = 0;
    }

    long n = write(bnc_LogDescriptor, stringData.bytes, stringData.length);
    if (n < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't write log message (%d): %s.", e, strerror(e));
    } else {
        bnc_LogOffset += n;
    }
}

void BNCLogByteWrapFlush() {
    if (bnc_LogDescriptor >= 0) {
        fsync(bnc_LogDescriptor);
    }
}

NSString *BNCLogByteWrapReadNextRecord() {

    char *buffer = NULL;
    long bufferSize = 0;
    off_t originalOffset = lseek(bnc_LogDescriptor, 0, SEEK_CUR);
    if (originalOffset < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't find offset in log file (%d): %s.", e, strerror(e));
        goto error_exit;
    }

    do {

        bufferSize += 1024;
        if (buffer) free(buffer);
        buffer = malloc(bufferSize);
        if (!buffer) {
            BNCLogInternalError(@"Can't allocate a buffer of %ld bytes.", bufferSize);
            goto error_exit;
        }

        off_t newOffset = lseek(bnc_LogDescriptor, originalOffset, SEEK_SET);
        if (newOffset < 0) {
            int e = errno;
            BNCLogInternalError(@"Can't seek in log file (%d): %s.", e, strerror(e));
            goto error_exit;
        }
        ssize_t bytesRead = read(bnc_LogDescriptor, buffer, bufferSize);
        if (bytesRead == 0) {
            goto error_exit;
        } else if (bytesRead < 0) {
            int e = errno;
            if (e != EOF) {
                BNCLogInternalError(@"Can't read log message (%d): %s.", e, strerror(e));
            }
            goto error_exit;
        }

        char* p = buffer;
        intptr_t endByte = bytesRead;
        while ( (p-buffer) < endByte && *p != '\n') {
            p++;
        }
        if ((p-buffer) < endByte && *p == '\n') {
            intptr_t offset = (p-buffer)+1;
            NSString *result =
                [[NSString alloc]
                    initWithBytes:buffer length:offset encoding:NSUTF8StringEncoding];
            bnc_LogOffset = originalOffset + offset;
            newOffset = lseek(bnc_LogDescriptor, bnc_LogOffset, SEEK_SET);
            if (newOffset < 0) {
                int e = errno;
                BNCLogInternalError(@"Can't seek in log file (%d): %s.", e, strerror(e));
            }
            free(buffer);
            return result;
        }

    } while (bufferSize < 1024*20);

error_exit:
    if (buffer) free(buffer);
    return nil;
}

BOOL BNCLogByteWrapOpenURL_Internal(NSURL *url, long maxBytes) {
    if (url == nil) return NO;
    bnc_LogOffsetMax = MAX(256, maxBytes);
    bnc_LogDescriptor = open(
        url.path.UTF8String,
        O_RDWR|O_CREAT,
        S_IRUSR|S_IWUSR|S_IRGRP|S_IWGRP
    );
    if (bnc_LogDescriptor < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't open log file '%@'.", url);
        BNCLogInternalError(@"Can't open log file (%d): %s.", e, strerror(e));
        return NO;
    }
    bnc_LoggingFunction = BNCLogByteWrapWrite;
    bnc_LogFlushFunction = BNCLogByteWrapFlush;

    // Truncate the file if the file size > max file size.

    off_t newOffset = 0;
    off_t maxSz = bnc_LogOffsetMax;
    off_t sz = lseek(bnc_LogDescriptor, 0, SEEK_END);
    if (sz < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't seek in log (%d): %s.", e, strerror(e));
    } else if (sz > maxSz) {
        newOffset = ftruncate(bnc_LogDescriptor, maxSz);
        if (newOffset < 0) {
            int e = errno;
            BNCLogInternalError(@"Can't truncate log (%d): %s.", e, strerror(e));
        }
    }
    bnc_LogOffset = 0;
    lseek(bnc_LogDescriptor, bnc_LogOffset, SEEK_SET);

    // Read the records until the oldest record is found --

    BOOL logDidWrap = NO;
    off_t wrapOffset = 0;

    off_t lastOffset = 0;
    NSDate *lastDate = [NSDate distantPast];

    NSString *record = BNCLogByteWrapReadNextRecord();
    while (record) {
        NSDate *date = nil;
        NSString *dateString = @"";
        if (record.length >= 27) {
            dateString = [record substringWithRange:NSMakeRange(0, 27)];
            date = [bnc_LogDateFormatter dateFromString:dateString];
        }
        if (!date || [date compare:lastDate] < 0) {
            wrapOffset = lastOffset;
            logDidWrap = YES;
        }
        lastDate = date ?: [NSDate distantPast];
        lastOffset = bnc_LogOffset;
        record = BNCLogByteWrapReadNextRecord();
    }
    if (logDidWrap) {
        bnc_LogOffset = wrapOffset;
    } else if (bnc_LogOffset >= bnc_LogOffsetMax)
        bnc_LogOffset = 0;
    newOffset = lseek(bnc_LogDescriptor, bnc_LogOffset, SEEK_SET);
    if (newOffset < 0) {
        int e = errno;
        BNCLogInternalError(@"Can't seek in log (%d): %s.", e, strerror(e));
    }
    return YES;
}

void BNCLogSetOutputToURLByteWrap(NSURL *_Nullable URL, long maxBytes) {
    __block BOOL result = NO;
    dispatch_sync(bnc_LogQueue, ^{
        if (bnc_LogFlushFunction)
            bnc_LogFlushFunction();
        if (bnc_LogDescriptor >= 0) {
            close(bnc_LogDescriptor);
            bnc_LogDescriptor = -1;
        }
        result = BNCLogByteWrapOpenURL_Internal(URL, maxBytes);
    });
}

#pragma mark - Log Message Severity

static BNCLogLevel bnc_LogDisplayLevel = BNCLogLevelWarning;

BNCLogLevel BNCLogDisplayLevel() {
    __block BNCLogLevel level = BNCLogLevelAll;
    dispatch_sync(bnc_LogQueue, ^{
        level = bnc_LogDisplayLevel;
    });
    return level;
}

void BNCLogSetDisplayLevel(BNCLogLevel level) {
    BNCLogInitializeClient_Internal();
    dispatch_async(bnc_LogQueue, ^{
        bnc_LogDisplayLevel = level;
    });
}

static NSString*const bnc_logLevelStrings[] = {
    @"BNCLogLevelAll",
    @"BNCLogLevelBreakPoint",
    @"BNCLogLevelDebug",
    @"BNCLogLevelWarning",
    @"BNCLogLevelError",
    @"BNCLogLevelAssert",
    @"BNCLogLevelLog",
    @"BNCLogLevelNone",
    @"BNCLogLevelMax"
};

NSString* BNCLogStringFromLogLevel(BNCLogLevel level) {
    level = MAX(MIN(level, BNCLogLevelMax), 0);
    return bnc_logLevelStrings[level];
}

BNCLogLevel BNCLogLevelFromString(NSString*string) {
    if (!string) return BNCLogLevelNone;
    for (NSUInteger i = 0; i < _countof(bnc_logLevelStrings); ++i) {
        if ([bnc_logLevelStrings[i] isEqualToString:string]) {
            return i;
        }
    }
    if ([string isEqualToString:@"BNCLogLevelDebugSDK"]) {
        return BNCLogLevelDebugSDK;
    }
    return BNCLogLevelNone;
}

#pragma mark - Client Initialization Function

static _Atomic(BNCLogClientInitializeFunctionPtr) bnc_LogClientInitializeFunctionPtr = (BNCLogClientInitializeFunctionPtr) 0;

extern BNCLogClientInitializeFunctionPtr _Null_unspecified BNCLogSetClientInitializeFunction(
        BNCLogClientInitializeFunctionPtr _Nullable clientInitializationFunction
    ) {
    BNCLogClientInitializeFunctionPtr lastPtr =
        atomic_exchange(&bnc_LogClientInitializeFunctionPtr, clientInitializationFunction);
    return lastPtr;
}

#pragma mark - Break Points

static BOOL bnc_LogBreakPointsAreEnabled = NO;

BOOL BNCLogBreakPointsAreEnabled() {
    __block BOOL enabled = NO;
    dispatch_sync(bnc_LogQueue, ^{
        enabled = bnc_LogBreakPointsAreEnabled;
    });
    return enabled;
}

void BNCLogSetBreakPointsEnabled(BOOL enabled) {
    dispatch_async(bnc_LogQueue, ^{
        bnc_LogBreakPointsAreEnabled = enabled;
    });
}

#pragma mark - Log Functions

BNCLogOutputFunctionPtr _Nullable BNCLogOutputFunction() {
    __block BNCLogOutputFunctionPtr ptr = NULL;
    dispatch_sync(bnc_LogQueue, ^{
        ptr = bnc_LoggingFunction;
    });
    return ptr;
}

void BNCLogCloseLogFile() {
    dispatch_sync(bnc_LogQueue, ^{
        if (bnc_LogFlushFunction)
            bnc_LogFlushFunction();
        if (bnc_LogDescriptor >= 0) {
            close(bnc_LogDescriptor);
            bnc_LogDescriptor = -1;
        }
        bnc_LogFlushFunction = NULL;
        bnc_LoggingFunction = NULL;
    });
}

void BNCLogSetOutputFunction(BNCLogOutputFunctionPtr _Nullable logFunction) {
    dispatch_async(bnc_LogQueue, ^{
        bnc_LoggingFunction = logFunction;
    });
}

BNCLogFlushFunctionPtr BNCLogFlushFunction() {
    __block BNCLogFlushFunctionPtr ptr = NULL;
    dispatch_sync(bnc_LogQueue, ^{
        ptr = bnc_LogFlushFunction;
    });
    return ptr;
}

void BNCLogSetFlushFunction(BNCLogFlushFunctionPtr flushFunction) {
    dispatch_async(bnc_LogQueue, ^{
        bnc_LogFlushFunction = flushFunction;
    });
}

#pragma mark - BNCLogInternal

void BNCLogWriteMessageFormat(
        BNCLogLevel logLevel,
        const char *_Nullable file,
        int32_t lineNumber,
        NSString *_Nullable message,
        ...
    ) {
    BNCLogInitializeClient_Internal();
    if (!file) file = "";
    if (!message) message = @"<nil>";
    if (![message isKindOfClass:[NSString class]]) {
        message = [NSString stringWithFormat:@"0x%016llx <%@> %@",
            (uint64_t) message, message.class, message.description];
    }

    NSString* filename =
        [[NSString stringWithCString:file encoding:NSMacOSRomanStringEncoding]
            lastPathComponent];

    NSString * const logLevels[BNCLogLevelMax] = {
        @"DebugSDK",
        @"Break",
        @"Debug",
        @"Warning",
        @"Error",
        @"Assert",
        @"Log",
        @"None",
    };

    logLevel = MAX(MIN(logLevel, BNCLogLevelMax-1), 0);
    NSString *levelString = logLevels[logLevel];

    va_list args;
    va_start(args, message);
    NSString* m = [[NSString alloc] initWithFormat:message arguments:args];
    NSString* s = [NSString stringWithFormat:
        @"[branch.io] %@(%d) %@: %@", filename, lineNumber, levelString, m];
    va_end(args);

    dispatch_async(bnc_LogQueue, ^{
        if (logLevel >= bnc_LogDisplayLevel) {
            NSLog(@"%@", s); // Upgrade this to unified logging when we can.
        }
        if (bnc_LoggingFunction)
            bnc_LoggingFunction([NSDate date], logLevel, s);
    });
}

void BNCLogWriteMessage(
        BNCLogLevel logLevel,
        NSString *_Nonnull file,
        int32_t lineNumber,
        NSString *_Nonnull message
    ) {
    BNCLogWriteMessageFormat(logLevel, file.UTF8String, lineNumber, @"%@", message);
}

void BNCLogFlushMessages() {
    dispatch_sync(bnc_LogQueue, ^{
        if (bnc_LogFlushFunction)
            bnc_LogFlushFunction();
    });
}

#pragma mark - BNCLogInitialize

__attribute__((constructor)) void BNCLogInitialize(void) {
    static dispatch_once_t onceToken = 0;
    dispatch_once(&onceToken, ^ {
        bnc_LogQueue = dispatch_queue_create("io.branch.sdk.log", DISPATCH_QUEUE_SERIAL);

        bnc_LogDateFormatter = [[NSDateFormatter alloc] init];
        bnc_LogDateFormatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
        bnc_LogDateFormatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss.SSSSSSX";
        bnc_LogDateFormatter.timeZone = [NSTimeZone timeZoneForSecondsFromGMT:0];

        bnc_LogIsInitialized = @(YES);
    });
}
