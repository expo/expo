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

#import "DDFileLogger.h"

#import <unistd.h>
#import <sys/attr.h>
#import <sys/xattr.h>
#import <libkern/OSAtomic.h>

#if !__has_feature(objc_arc)
#error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
#endif

// We probably shouldn't be using DDLog() statements within the DDLog implementation.
// But we still want to leave our log statements for any future debugging,
// and to allow other developers to trace the implementation (which is a great learning tool).
//
// So we use primitive logging macros around NSLog.
// We maintain the NS prefix on the macros to be explicit about the fact that we're using NSLog.

#ifndef DD_NSLOG_LEVEL
    #define DD_NSLOG_LEVEL 2
#endif

#define NSLogError(frmt, ...)    do{ if(DD_NSLOG_LEVEL >= 1) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogWarn(frmt, ...)     do{ if(DD_NSLOG_LEVEL >= 2) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogInfo(frmt, ...)     do{ if(DD_NSLOG_LEVEL >= 3) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogDebug(frmt, ...)    do{ if(DD_NSLOG_LEVEL >= 4) NSLog((frmt), ##__VA_ARGS__); } while(0)
#define NSLogVerbose(frmt, ...)  do{ if(DD_NSLOG_LEVEL >= 5) NSLog((frmt), ##__VA_ARGS__); } while(0)


#if TARGET_OS_IPHONE
BOOL doesAppRunInBackground(void);
#endif

unsigned long long const kDDDefaultLogMaxFileSize      = 1024 * 1024;      // 1 MB
NSTimeInterval     const kDDDefaultLogRollingFrequency = 60 * 60 * 24;     // 24 Hours
NSUInteger         const kDDDefaultLogMaxNumLogFiles   = 5;                // 5 Files
unsigned long long const kDDDefaultLogFilesDiskQuota   = 20 * 1024 * 1024; // 20 MB

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface DDLogFileManagerDefault () {
    NSUInteger _maximumNumberOfLogFiles;
    unsigned long long _logFilesDiskQuota;
    NSString *_logsDirectory;
#if TARGET_OS_IPHONE
    NSFileProtectionType _defaultFileProtectionLevel;
#endif
}

- (void)deleteOldLogFiles;
- (NSString *)defaultLogsDirectory;

@end

@implementation DDLogFileManagerDefault

@synthesize maximumNumberOfLogFiles = _maximumNumberOfLogFiles;
@synthesize logFilesDiskQuota = _logFilesDiskQuota;


- (instancetype)init {
    return [self initWithLogsDirectory:nil];
}

- (instancetype)initWithLogsDirectory:(NSString *)aLogsDirectory {
    if ((self = [super init])) {
        _maximumNumberOfLogFiles = kDDDefaultLogMaxNumLogFiles;
        _logFilesDiskQuota = kDDDefaultLogFilesDiskQuota;

        if (aLogsDirectory) {
            _logsDirectory = [aLogsDirectory copy];
        } else {
            _logsDirectory = [[self defaultLogsDirectory] copy];
        }

        NSKeyValueObservingOptions kvoOptions = NSKeyValueObservingOptionOld | NSKeyValueObservingOptionNew;

        [self addObserver:self forKeyPath:NSStringFromSelector(@selector(maximumNumberOfLogFiles)) options:kvoOptions context:nil];
        [self addObserver:self forKeyPath:NSStringFromSelector(@selector(logFilesDiskQuota)) options:kvoOptions context:nil];

        NSLogVerbose(@"DDFileLogManagerDefault: logsDirectory:\n%@", [self logsDirectory]);
        NSLogVerbose(@"DDFileLogManagerDefault: sortedLogFileNames:\n%@", [self sortedLogFileNames]);
    }

    return self;
}

+ (BOOL)automaticallyNotifiesObserversForKey:(NSString *)theKey
{
    BOOL automatic = NO;
    if ([theKey isEqualToString:@"maximumNumberOfLogFiles"] || [theKey isEqualToString:@"logFilesDiskQuota"]) {
        automatic = NO;
    } else {
        automatic = [super automaticallyNotifiesObserversForKey:theKey];
    }
    
    return automatic;
}

#if TARGET_OS_IPHONE
- (instancetype)initWithLogsDirectory:(NSString *)logsDirectory defaultFileProtectionLevel:(NSFileProtectionType)fileProtectionLevel {
    if ((self = [self initWithLogsDirectory:logsDirectory])) {
        if ([fileProtectionLevel isEqualToString:NSFileProtectionNone] ||
            [fileProtectionLevel isEqualToString:NSFileProtectionComplete] ||
            [fileProtectionLevel isEqualToString:NSFileProtectionCompleteUnlessOpen] ||
            [fileProtectionLevel isEqualToString:NSFileProtectionCompleteUntilFirstUserAuthentication]) {
            _defaultFileProtectionLevel = fileProtectionLevel;
        }
    }

    return self;
}

#endif

- (void)dealloc {
    // try-catch because the observer might be removed or never added. In this case, removeObserver throws and exception
    @try {
        [self removeObserver:self forKeyPath:NSStringFromSelector(@selector(maximumNumberOfLogFiles))];
        [self removeObserver:self forKeyPath:NSStringFromSelector(@selector(logFilesDiskQuota))];
    } @catch (NSException *exception) {
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
    NSNumber *old = change[NSKeyValueChangeOldKey];
    NSNumber *new = change[NSKeyValueChangeNewKey];

    if ([old isEqual:new]) {
        // No change in value - don't bother with any processing.
        return;
    }

    if ([keyPath isEqualToString:NSStringFromSelector(@selector(maximumNumberOfLogFiles))] ||
        [keyPath isEqualToString:NSStringFromSelector(@selector(logFilesDiskQuota))]) {
        NSLogInfo(@"DDFileLogManagerDefault: Responding to configuration change: %@", keyPath);

        dispatch_async([DDLog loggingQueue], ^{ @autoreleasepool {
                                                    [self deleteOldLogFiles];
                                                } });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark File Deleting
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Deletes archived log files that exceed the maximumNumberOfLogFiles or logFilesDiskQuota configuration values.
 **/
- (void)deleteOldLogFiles {
    NSLogVerbose(@"DDLogFileManagerDefault: deleteOldLogFiles");

    NSArray *sortedLogFileInfos = [self sortedLogFileInfos];

    NSUInteger firstIndexToDelete = NSNotFound;

    const unsigned long long diskQuota = self.logFilesDiskQuota;
    const NSUInteger maxNumLogFiles = self.maximumNumberOfLogFiles;

    if (diskQuota) {
        unsigned long long used = 0;

        for (NSUInteger i = 0; i < sortedLogFileInfos.count; i++) {
            DDLogFileInfo *info = sortedLogFileInfos[i];
            used += info.fileSize;

            if (used > diskQuota) {
                firstIndexToDelete = i;
                break;
            }
        }
    }

    if (maxNumLogFiles) {
        if (firstIndexToDelete == NSNotFound) {
            firstIndexToDelete = maxNumLogFiles;
        } else {
            firstIndexToDelete = MIN(firstIndexToDelete, maxNumLogFiles);
        }
    }

    if (firstIndexToDelete == 0) {
        // Do we consider the first file?
        // We are only supposed to be deleting archived files.
        // In most cases, the first file is likely the log file that is currently being written to.
        // So in most cases, we do not want to consider this file for deletion.

        if (sortedLogFileInfos.count > 0) {
            DDLogFileInfo *logFileInfo = sortedLogFileInfos[0];

            if (!logFileInfo.isArchived) {
                // Don't delete active file.
                ++firstIndexToDelete;
            }
        }
    }

    if (firstIndexToDelete != NSNotFound) {
        // removing all logfiles starting with firstIndexToDelete

        for (NSUInteger i = firstIndexToDelete; i < sortedLogFileInfos.count; i++) {
            DDLogFileInfo *logFileInfo = sortedLogFileInfos[i];

            NSLogInfo(@"DDLogFileManagerDefault: Deleting file: %@", logFileInfo.fileName);

            [[NSFileManager defaultManager] removeItemAtPath:logFileInfo.filePath error:nil];
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Log Files
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the path to the default logs directory.
 * If the logs directory doesn't exist, this method automatically creates it.
 **/
- (NSString *)defaultLogsDirectory {
#if TARGET_OS_IPHONE
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES);
    NSString *baseDir = paths.firstObject;
    NSString *logsDirectory = [baseDir stringByAppendingPathComponent:@"Logs"];

#else
    NSString *appName = [[NSProcessInfo processInfo] processName];
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES);
    NSString *basePath = ([paths count] > 0) ? paths[0] : NSTemporaryDirectory();
    NSString *logsDirectory = [[basePath stringByAppendingPathComponent:@"Logs"] stringByAppendingPathComponent:appName];

#endif

    return logsDirectory;
}

- (NSString *)logsDirectory {
    // We could do this check once, during initalization, and not bother again.
    // But this way the code continues to work if the directory gets deleted while the code is running.

    if (![[NSFileManager defaultManager] fileExistsAtPath:_logsDirectory]) {
        NSError *err = nil;

        if (![[NSFileManager defaultManager] createDirectoryAtPath:_logsDirectory
                                       withIntermediateDirectories:YES
                                                        attributes:nil
                                                             error:&err]) {
            NSLogError(@"DDFileLogManagerDefault: Error creating logsDirectory: %@", err);
        }
    }

    return _logsDirectory;
}

- (BOOL)isLogFile:(NSString *)fileName {
    NSString *appName = [self applicationName];

    BOOL hasProperPrefix = [fileName hasPrefix:appName];
    BOOL hasProperSuffix = [fileName hasSuffix:@".log"];
    
    return (hasProperPrefix && hasProperSuffix);
}

//if you change formater , then  change sortedLogFileInfos method also accordingly
- (NSDateFormatter *)logFileDateFormatter {
    NSMutableDictionary *dictionary = [[NSThread currentThread]
                                       threadDictionary];
    NSString *dateFormat = @"yyyy'-'MM'-'dd'--'HH'-'mm'-'ss'-'SSS'";
    NSString *key = [NSString stringWithFormat:@"logFileDateFormatter.%@", dateFormat];
    NSDateFormatter *dateFormatter = dictionary[key];

    if (dateFormatter == nil) {
        dateFormatter = [[NSDateFormatter alloc] init];
        [dateFormatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
        [dateFormatter setDateFormat:dateFormat];
        [dateFormatter setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
        dictionary[key] = dateFormatter;
    }

    return dateFormatter;
}

- (NSArray *)unsortedLogFilePaths {
    NSString *logsDirectory = [self logsDirectory];
    NSArray *fileNames = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:logsDirectory error:nil];

    NSMutableArray *unsortedLogFilePaths = [NSMutableArray arrayWithCapacity:[fileNames count]];

    for (NSString *fileName in fileNames) {
        // Filter out any files that aren't log files. (Just for extra safety)

    #if TARGET_IPHONE_SIMULATOR
        // In case of iPhone simulator there can be 'archived' extension. isLogFile:
        // method knows nothing about it. Thus removing it for this method.
        //
        // See full explanation in the header file.
        NSString *theFileName = [fileName stringByReplacingOccurrencesOfString:@".archived"
                                                                    withString:@""];

        if ([self isLogFile:theFileName])
    #else

        if ([self isLogFile:fileName])
    #endif
        {
            NSString *filePath = [logsDirectory stringByAppendingPathComponent:fileName];

            [unsortedLogFilePaths addObject:filePath];
        }
    }

    return unsortedLogFilePaths;
}

- (NSArray *)unsortedLogFileNames {
    NSArray *unsortedLogFilePaths = [self unsortedLogFilePaths];

    NSMutableArray *unsortedLogFileNames = [NSMutableArray arrayWithCapacity:[unsortedLogFilePaths count]];

    for (NSString *filePath in unsortedLogFilePaths) {
        [unsortedLogFileNames addObject:[filePath lastPathComponent]];
    }

    return unsortedLogFileNames;
}

- (NSArray *)unsortedLogFileInfos {
    NSArray *unsortedLogFilePaths = [self unsortedLogFilePaths];

    NSMutableArray *unsortedLogFileInfos = [NSMutableArray arrayWithCapacity:[unsortedLogFilePaths count]];

    for (NSString *filePath in unsortedLogFilePaths) {
        DDLogFileInfo *logFileInfo = [[DDLogFileInfo alloc] initWithFilePath:filePath];

        [unsortedLogFileInfos addObject:logFileInfo];
    }

    return unsortedLogFileInfos;
}

- (NSArray *)sortedLogFilePaths {
    NSArray *sortedLogFileInfos = [self sortedLogFileInfos];

    NSMutableArray *sortedLogFilePaths = [NSMutableArray arrayWithCapacity:[sortedLogFileInfos count]];

    for (DDLogFileInfo *logFileInfo in sortedLogFileInfos) {
        [sortedLogFilePaths addObject:[logFileInfo filePath]];
    }

    return sortedLogFilePaths;
}

- (NSArray *)sortedLogFileNames {
    NSArray *sortedLogFileInfos = [self sortedLogFileInfos];

    NSMutableArray *sortedLogFileNames = [NSMutableArray arrayWithCapacity:[sortedLogFileInfos count]];

    for (DDLogFileInfo *logFileInfo in sortedLogFileInfos) {
        [sortedLogFileNames addObject:[logFileInfo fileName]];
    }

    return sortedLogFileNames;
}

- (NSArray *)sortedLogFileInfos {
    return  [[self unsortedLogFileInfos] sortedArrayUsingComparator:^NSComparisonResult(DDLogFileInfo   * _Nonnull obj1, DDLogFileInfo   * _Nonnull obj2) {
        NSDate *date1 = [NSDate new];
        NSDate *date2 = [NSDate new];

        NSArray<NSString *> *arrayComponent = [[obj1 fileName] componentsSeparatedByString:@" "];
        if (arrayComponent.count > 0) {
            NSString *stringDate = arrayComponent.lastObject;
            stringDate = [stringDate stringByReplacingOccurrencesOfString:@".log" withString:@""];
            stringDate = [stringDate stringByReplacingOccurrencesOfString:@".archived" withString:@""];
            date1 = [[self logFileDateFormatter] dateFromString:stringDate] ?: [obj1 creationDate];
        }
        
        arrayComponent = [[obj2 fileName] componentsSeparatedByString:@" "];
        if (arrayComponent.count > 0) {
            NSString *stringDate = arrayComponent.lastObject;
            stringDate = [stringDate stringByReplacingOccurrencesOfString:@".log" withString:@""];
            stringDate = [stringDate stringByReplacingOccurrencesOfString:@".archived" withString:@""];
            date2 = [[self logFileDateFormatter] dateFromString:stringDate] ?: [obj2 creationDate];
        }
        
        return [date2 compare:date1];
    }];

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Creation
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//if you change newLogFileName , then  change isLogFile method also accordingly
- (NSString *)newLogFileName {
    NSString *appName = [self applicationName];

    NSDateFormatter *dateFormatter = [self logFileDateFormatter];
    NSString *formattedDate = [dateFormatter stringFromDate:[NSDate date]];

    return [NSString stringWithFormat:@"%@ %@.log", appName, formattedDate];
}

- (NSString *)createNewLogFile {
    NSString *fileName = [self newLogFileName];
    NSString *logsDirectory = [self logsDirectory];

    NSUInteger attempt = 1;

    do {
        NSString *actualFileName = fileName;

        if (attempt > 1) {
            NSString *extension = [actualFileName pathExtension];

            actualFileName = [actualFileName stringByDeletingPathExtension];
            actualFileName = [actualFileName stringByAppendingFormat:@" %lu", (unsigned long)attempt];

            if (extension.length) {
                actualFileName = [actualFileName stringByAppendingPathExtension:extension];
            }
        }

        NSString *filePath = [logsDirectory stringByAppendingPathComponent:actualFileName];

        if (![[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
            NSLogVerbose(@"DDLogFileManagerDefault: Creating new log file: %@", actualFileName);

            NSDictionary *attributes = nil;

        #if TARGET_OS_IPHONE
            // When creating log file on iOS we're setting NSFileProtectionKey attribute to NSFileProtectionCompleteUnlessOpen.
            //
            // But in case if app is able to launch from background we need to have an ability to open log file any time we
            // want (even if device is locked). Thats why that attribute have to be changed to
            // NSFileProtectionCompleteUntilFirstUserAuthentication.

            NSFileProtectionType key = _defaultFileProtectionLevel ? :
                (doesAppRunInBackground() ? NSFileProtectionCompleteUntilFirstUserAuthentication : NSFileProtectionCompleteUnlessOpen);

            attributes = @{
                NSFileProtectionKey: key
            };
        #endif

            [[NSFileManager defaultManager] createFileAtPath:filePath contents:nil attributes:attributes];

            // Since we just created a new log file, we may need to delete some old log files
            [self deleteOldLogFiles];

            return filePath;
        } else {
            attempt++;
        }
    } while (YES);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Utility
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (NSString *)applicationName {
    static NSString *_appName;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
        _appName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"];

        if (!_appName) {
            _appName = [[NSProcessInfo processInfo] processName];
        }

        if (!_appName) {
            _appName = @"";
        }
    });

    return _appName;
}

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface DDLogFileFormatterDefault () {
    NSDateFormatter *_dateFormatter;
}

@end

@implementation DDLogFileFormatterDefault

- (instancetype)init {
    return [self initWithDateFormatter:nil];
}

- (instancetype)initWithDateFormatter:(NSDateFormatter *)aDateFormatter {
    if ((self = [super init])) {
        if (aDateFormatter) {
            _dateFormatter = aDateFormatter;
        } else {
            _dateFormatter = [[NSDateFormatter alloc] init];
            [_dateFormatter setFormatterBehavior:NSDateFormatterBehavior10_4]; // 10.4+ style
            [_dateFormatter setDateFormat:@"yyyy/MM/dd HH:mm:ss:SSS"];
        }
    }

    return self;
}

- (NSString *)formatLogMessage:(DDLogMessage *)logMessage {
    NSString *dateAndTime = [_dateFormatter stringFromDate:(logMessage->_timestamp)];

    return [NSString stringWithFormat:@"%@  %@", dateAndTime, logMessage->_message];
}

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface DDFileLogger () {
    __strong id <DDLogFileManager> _logFileManager;
    
    NSFileHandle *_currentLogFileHandle;
    
    dispatch_source_t _currentLogFileVnode;
    dispatch_source_t _rollingTimer;
    
    unsigned long long _maximumFileSize;
    NSTimeInterval _rollingFrequency;
}

- (void)rollLogFileNow;
- (void)maybeRollLogFileDueToAge;
- (void)maybeRollLogFileDueToSize;

@end

@implementation DDFileLogger

- (instancetype)init {
    DDLogFileManagerDefault *defaultLogFileManager = [[DDLogFileManagerDefault alloc] init];

    return [self initWithLogFileManager:defaultLogFileManager];
}

- (instancetype)initWithLogFileManager:(id <DDLogFileManager>)aLogFileManager {
    if ((self = [super init])) {
        _maximumFileSize = kDDDefaultLogMaxFileSize;
        _rollingFrequency = kDDDefaultLogRollingFrequency;
        _automaticallyAppendNewlineForCustomFormatters = YES;

        logFileManager = aLogFileManager;

        self.logFormatter = [DDLogFileFormatterDefault new];
    }

    return self;
}

- (void)dealloc {
    [_currentLogFileHandle synchronizeFile];
    [_currentLogFileHandle closeFile];

    if (_currentLogFileVnode) {
        dispatch_source_cancel(_currentLogFileVnode);
        _currentLogFileVnode = NULL;
    }

    if (_rollingTimer) {
        dispatch_source_cancel(_rollingTimer);
        _rollingTimer = NULL;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Properties
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@synthesize logFileManager;

- (unsigned long long)maximumFileSize {
    __block unsigned long long result;

    dispatch_block_t block = ^{
        result = _maximumFileSize;
    };

    // The design of this method is taken from the DDAbstractLogger implementation.
    // For extensive documentation please refer to the DDAbstractLogger implementation.

    // Note: The internal implementation MUST access the maximumFileSize variable directly,
    // This method is designed explicitly for external access.
    //
    // Using "self." syntax to go through this method will cause immediate deadlock.
    // This is the intended result. Fix it by accessing the ivar directly.
    // Great strides have been take to ensure this is safe to do. Plus it's MUCH faster.

    NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");
    NSAssert(![self isOnInternalLoggerQueue], @"MUST access ivar directly, NOT via self.* syntax.");

    dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];

    dispatch_sync(globalLoggingQueue, ^{
        dispatch_sync(self.loggerQueue, block);
    });

    return result;
}

- (void)setMaximumFileSize:(unsigned long long)newMaximumFileSize {
    dispatch_block_t block = ^{
        @autoreleasepool {
            _maximumFileSize = newMaximumFileSize;
            [self maybeRollLogFileDueToSize];
        }
    };

    // The design of this method is taken from the DDAbstractLogger implementation.
    // For extensive documentation please refer to the DDAbstractLogger implementation.

    // Note: The internal implementation MUST access the maximumFileSize variable directly,
    // This method is designed explicitly for external access.
    //
    // Using "self." syntax to go through this method will cause immediate deadlock.
    // This is the intended result. Fix it by accessing the ivar directly.
    // Great strides have been take to ensure this is safe to do. Plus it's MUCH faster.

    NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");
    NSAssert(![self isOnInternalLoggerQueue], @"MUST access ivar directly, NOT via self.* syntax.");

    dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];

    dispatch_async(globalLoggingQueue, ^{
        dispatch_async(self.loggerQueue, block);
    });
}

- (NSTimeInterval)rollingFrequency {
    __block NSTimeInterval result;

    dispatch_block_t block = ^{
        result = _rollingFrequency;
    };

    // The design of this method is taken from the DDAbstractLogger implementation.
    // For extensive documentation please refer to the DDAbstractLogger implementation.

    // Note: The internal implementation should access the rollingFrequency variable directly,
    // This method is designed explicitly for external access.
    //
    // Using "self." syntax to go through this method will cause immediate deadlock.
    // This is the intended result. Fix it by accessing the ivar directly.
    // Great strides have been take to ensure this is safe to do. Plus it's MUCH faster.

    NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");
    NSAssert(![self isOnInternalLoggerQueue], @"MUST access ivar directly, NOT via self.* syntax.");

    dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];

    dispatch_sync(globalLoggingQueue, ^{
        dispatch_sync(self.loggerQueue, block);
    });

    return result;
}

- (void)setRollingFrequency:(NSTimeInterval)newRollingFrequency {
    dispatch_block_t block = ^{
        @autoreleasepool {
            _rollingFrequency = newRollingFrequency;
            [self maybeRollLogFileDueToAge];
        }
    };

    // The design of this method is taken from the DDAbstractLogger implementation.
    // For extensive documentation please refer to the DDAbstractLogger implementation.

    // Note: The internal implementation should access the rollingFrequency variable directly,
    // This method is designed explicitly for external access.
    //
    // Using "self." syntax to go through this method will cause immediate deadlock.
    // This is the intended result. Fix it by accessing the ivar directly.
    // Great strides have been take to ensure this is safe to do. Plus it's MUCH faster.

    NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");
    NSAssert(![self isOnInternalLoggerQueue], @"MUST access ivar directly, NOT via self.* syntax.");

    dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];

    dispatch_async(globalLoggingQueue, ^{
        dispatch_async(self.loggerQueue, block);
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark File Rolling
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (void)scheduleTimerToRollLogFileDueToAge {
    if (_rollingTimer) {
        dispatch_source_cancel(_rollingTimer);
        _rollingTimer = NULL;
    }

    if (_currentLogFileInfo == nil || _rollingFrequency <= 0.0) {
        return;
    }

    NSDate *logFileCreationDate = [_currentLogFileInfo creationDate];

    NSTimeInterval ti = [logFileCreationDate timeIntervalSinceReferenceDate];
    ti += _rollingFrequency;

    NSDate *logFileRollingDate = [NSDate dateWithTimeIntervalSinceReferenceDate:ti];

    NSLogVerbose(@"DDFileLogger: scheduleTimerToRollLogFileDueToAge");

    NSLogVerbose(@"DDFileLogger: logFileCreationDate: %@", logFileCreationDate);
    NSLogVerbose(@"DDFileLogger: logFileRollingDate : %@", logFileRollingDate);

    _rollingTimer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, self.loggerQueue);

    dispatch_source_set_event_handler(_rollingTimer, ^{ @autoreleasepool {
                                                           [self maybeRollLogFileDueToAge];
                                                       } });

    #if !OS_OBJECT_USE_OBJC
    dispatch_source_t theRollingTimer = _rollingTimer;
    dispatch_source_set_cancel_handler(_rollingTimer, ^{
        dispatch_release(theRollingTimer);
    });
    #endif

    uint64_t delay = (uint64_t)([logFileRollingDate timeIntervalSinceNow] * (NSTimeInterval) NSEC_PER_SEC);
    dispatch_time_t fireTime = dispatch_time(DISPATCH_TIME_NOW, delay);

    dispatch_source_set_timer(_rollingTimer, fireTime, DISPATCH_TIME_FOREVER, 1ull * NSEC_PER_SEC);
    dispatch_resume(_rollingTimer);
}

- (void)rollLogFile {
    [self rollLogFileWithCompletionBlock:nil];
}

- (void)rollLogFileWithCompletionBlock:(void (^)(void))completionBlock {
    // This method is public.
    // We need to execute the rolling on our logging thread/queue.

    dispatch_block_t block = ^{
        @autoreleasepool {
            [self rollLogFileNow];

            if (completionBlock) {
                dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                    completionBlock();
                });
            }
        }
    };

    // The design of this method is taken from the DDAbstractLogger implementation.
    // For extensive documentation please refer to the DDAbstractLogger implementation.

    if ([self isOnInternalLoggerQueue]) {
        block();
    } else {
        dispatch_queue_t globalLoggingQueue = [DDLog loggingQueue];
        NSAssert(![self isOnGlobalLoggingQueue], @"Core architecture requirement failure");

        dispatch_async(globalLoggingQueue, ^{
            dispatch_async(self.loggerQueue, block);
        });
    }
}

- (void)rollLogFileNow {
    NSLogVerbose(@"DDFileLogger: rollLogFileNow");

    if (_currentLogFileHandle == nil) {
        return;
    }

    [_currentLogFileHandle synchronizeFile];
    [_currentLogFileHandle closeFile];
    _currentLogFileHandle = nil;

    _currentLogFileInfo.isArchived = YES;

    if ([logFileManager respondsToSelector:@selector(didRollAndArchiveLogFile:)]) {
        [logFileManager didRollAndArchiveLogFile:(_currentLogFileInfo.filePath)];
    }

    _currentLogFileInfo = nil;

    if (_currentLogFileVnode) {
        dispatch_source_cancel(_currentLogFileVnode);
        _currentLogFileVnode = NULL;
    }

    if (_rollingTimer) {
        dispatch_source_cancel(_rollingTimer);
        _rollingTimer = NULL;
    }
}

- (void)maybeRollLogFileDueToAge {
    if (_rollingFrequency > 0.0 && _currentLogFileInfo.age >= _rollingFrequency) {
        NSLogVerbose(@"DDFileLogger: Rolling log file due to age...");

        [self rollLogFileNow];
    } else {
        [self scheduleTimerToRollLogFileDueToAge];
    }
}

- (void)maybeRollLogFileDueToSize {
    // This method is called from logMessage.
    // Keep it FAST.

    // Note: Use direct access to maximumFileSize variable.
    // We specifically wrote our own getter/setter method to allow us to do this (for performance reasons).

    if (_maximumFileSize > 0) {
        unsigned long long fileSize = [_currentLogFileHandle offsetInFile];

        if (fileSize >= _maximumFileSize) {
            NSLogVerbose(@"DDFileLogger: Rolling log file due to size (%qu)...", fileSize);

            [self rollLogFileNow];
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark File Logging
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the log file that should be used.
 * If there is an existing log file that is suitable,
 * within the constraints of maximumFileSize and rollingFrequency, then it is returned.
 *
 * Otherwise a new file is created and returned.
 **/
- (DDLogFileInfo *)currentLogFileInfo {
    if (_currentLogFileInfo == nil) {
        NSArray *sortedLogFileInfos = [logFileManager sortedLogFileInfos];

        if ([sortedLogFileInfos count] > 0) {
            DDLogFileInfo *mostRecentLogFileInfo = sortedLogFileInfos[0];

            BOOL shouldArchiveMostRecent = NO;

            if (mostRecentLogFileInfo.isArchived) {
                shouldArchiveMostRecent = NO;
			} else if ([self shouldArchiveRecentLogFileInfo:mostRecentLogFileInfo]) {
				shouldArchiveMostRecent = YES;
			} else if (_maximumFileSize > 0 && mostRecentLogFileInfo.fileSize >= _maximumFileSize) {
                shouldArchiveMostRecent = YES;
            } else if (_rollingFrequency > 0.0 && mostRecentLogFileInfo.age >= _rollingFrequency) {
                shouldArchiveMostRecent = YES;
            }

        #if TARGET_OS_IPHONE
            // When creating log file on iOS we're setting NSFileProtectionKey attribute to NSFileProtectionCompleteUnlessOpen.
            //
            // But in case if app is able to launch from background we need to have an ability to open log file any time we
            // want (even if device is locked). Thats why that attribute have to be changed to
            // NSFileProtectionCompleteUntilFirstUserAuthentication.
            //
            // If previous log was created when app wasn't running in background, but now it is - we archive it and create
            // a new one.
            //
            // If user has overwritten to NSFileProtectionNone there is no neeed to create a new one.

            if (!_doNotReuseLogFiles && doesAppRunInBackground()) {
                NSFileProtectionType key = mostRecentLogFileInfo.fileAttributes[NSFileProtectionKey];

                if ([key length] > 0 && !([key isEqualToString:NSFileProtectionCompleteUntilFirstUserAuthentication] || [key isEqualToString:NSFileProtectionNone])) {
                    shouldArchiveMostRecent = YES;
                }
            }

        #endif

            if (!_doNotReuseLogFiles && !mostRecentLogFileInfo.isArchived && !shouldArchiveMostRecent) {
                NSLogVerbose(@"DDFileLogger: Resuming logging with file %@", mostRecentLogFileInfo.fileName);

                _currentLogFileInfo = mostRecentLogFileInfo;
            } else {
                if (shouldArchiveMostRecent) {
                    mostRecentLogFileInfo.isArchived = YES;

                    if ([logFileManager respondsToSelector:@selector(didArchiveLogFile:)]) {
                        [logFileManager didArchiveLogFile:(mostRecentLogFileInfo.filePath)];
                    }
                }
            }
        }

        if (_currentLogFileInfo == nil) {
            NSString *currentLogFilePath = [logFileManager createNewLogFile];

            _currentLogFileInfo = [[DDLogFileInfo alloc] initWithFilePath:currentLogFilePath];
        }
    }

    return _currentLogFileInfo;
}

- (NSFileHandle *)currentLogFileHandle {
    if (_currentLogFileHandle == nil) {
        NSString *logFilePath = [[self currentLogFileInfo] filePath];

        _currentLogFileHandle = [NSFileHandle fileHandleForWritingAtPath:logFilePath];
        [_currentLogFileHandle seekToEndOfFile];

        if (_currentLogFileHandle) {
            [self scheduleTimerToRollLogFileDueToAge];

            // Here we are monitoring the log file. In case if it would be deleted ormoved
            // somewhere we want to roll it and use a new one.
            _currentLogFileVnode = dispatch_source_create(
                    DISPATCH_SOURCE_TYPE_VNODE,
                    [_currentLogFileHandle fileDescriptor],
                    DISPATCH_VNODE_DELETE | DISPATCH_VNODE_RENAME,
                    self.loggerQueue
                    );

            dispatch_source_set_event_handler(_currentLogFileVnode, ^{ @autoreleasepool {
                                                                          NSLogInfo(@"DDFileLogger: Current logfile was moved. Rolling it and creating a new one");
                                                                          [self rollLogFileNow];
                                                                      } });

            #if !OS_OBJECT_USE_OBJC
            dispatch_source_t vnode = _currentLogFileVnode;
            dispatch_source_set_cancel_handler(_currentLogFileVnode, ^{
                dispatch_release(vnode);
            });
            #endif

            dispatch_resume(_currentLogFileVnode);
        }
    }

    return _currentLogFileHandle;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark DDLogger Protocol
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

static int exception_count = 0;
- (void)logMessage:(DDLogMessage *)logMessage {
    NSString *message = logMessage->_message;
    BOOL isFormatted = NO;

    if (_logFormatter) {
        message = [_logFormatter formatLogMessage:logMessage];
        isFormatted = message != logMessage->_message;
    }

    if (message) {
        if ((!isFormatted || _automaticallyAppendNewlineForCustomFormatters) &&
            (![message hasSuffix:@"\n"])) {
            message = [message stringByAppendingString:@"\n"];
        }

        NSData *logData = [message dataUsingEncoding:NSUTF8StringEncoding];

        @try {
            [self willLogMessage];
			
            [[self currentLogFileHandle] writeData:logData];

            [self didLogMessage];
        } @catch (NSException *exception) {
            exception_count++;

            if (exception_count <= 10) {
                NSLogError(@"DDFileLogger.logMessage: %@", exception);

                if (exception_count == 10) {
                    NSLogError(@"DDFileLogger.logMessage: Too many exceptions -- will not log any more of them.");
                }
            }
        }
    }
}

- (void)willLogMessage {
	
}

- (void)didLogMessage {
    [self maybeRollLogFileDueToSize];
}

- (BOOL)shouldArchiveRecentLogFileInfo:(DDLogFileInfo *)recentLogFileInfo {
    return NO;
}

- (void)willRemoveLogger {
    // If you override me be sure to invoke [super willRemoveLogger];

    [self rollLogFileNow];
}

- (NSString *)loggerName {
    return @"cocoa.lumberjack.fileLogger";
}

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#if TARGET_IPHONE_SIMULATOR
    static NSString * const kDDXAttrArchivedName = @"archived";
#else
    static NSString * const kDDXAttrArchivedName = @"lumberjack.log.archived";
#endif

@interface DDLogFileInfo () {
    __strong NSString *_filePath;
    __strong NSString *_fileName;
    
    __strong NSDictionary *_fileAttributes;
    
    __strong NSDate *_creationDate;
    __strong NSDate *_modificationDate;
    
    unsigned long long _fileSize;
}

@end


@implementation DDLogFileInfo

@synthesize filePath;

@dynamic fileName;
@dynamic fileAttributes;
@dynamic creationDate;
@dynamic modificationDate;
@dynamic fileSize;
@dynamic age;

@dynamic isArchived;


#pragma mark Lifecycle

+ (instancetype)logFileWithPath:(NSString *)aFilePath {
    return [[self alloc] initWithFilePath:aFilePath];
}

- (instancetype)initWithFilePath:(NSString *)aFilePath {
    if ((self = [super init])) {
        filePath = [aFilePath copy];
    }

    return self;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Standard Info
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (NSDictionary *)fileAttributes {
    if (_fileAttributes == nil && filePath != nil) {
        _fileAttributes = [[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:nil];
    }

    return _fileAttributes;
}

- (NSString *)fileName {
    if (_fileName == nil) {
        _fileName = [filePath lastPathComponent];
    }

    return _fileName;
}

- (NSDate *)modificationDate {
    if (_modificationDate == nil) {
        _modificationDate = self.fileAttributes[NSFileModificationDate];
    }

    return _modificationDate;
}

- (NSDate *)creationDate {
    if (_creationDate == nil) {
        _creationDate = self.fileAttributes[NSFileCreationDate];
    }

    return _creationDate;
}

- (unsigned long long)fileSize {
    if (_fileSize == 0) {
        _fileSize = [self.fileAttributes[NSFileSize] unsignedLongLongValue];
    }

    return _fileSize;
}

- (NSTimeInterval)age {
    return [[self creationDate] timeIntervalSinceNow] * -1.0;
}

- (NSString *)description {
    return [@{ @"filePath": self.filePath ? : @"",
               @"fileName": self.fileName ? : @"",
               @"fileAttributes": self.fileAttributes ? : @"",
               @"creationDate": self.creationDate ? : @"",
               @"modificationDate": self.modificationDate ? : @"",
               @"fileSize": @(self.fileSize),
               @"age": @(self.age),
               @"isArchived": @(self.isArchived) } description];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Archiving
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)isArchived {
#if TARGET_IPHONE_SIMULATOR

    // Extended attributes don't work properly on the simulator.
    // So we have to use a less attractive alternative.
    // See full explanation in the header file.

    return [self hasExtensionAttributeWithName:kDDXAttrArchivedName];

#else

    return [self hasExtendedAttributeWithName:kDDXAttrArchivedName];

#endif
}

- (void)setIsArchived:(BOOL)flag {
#if TARGET_IPHONE_SIMULATOR

    // Extended attributes don't work properly on the simulator.
    // So we have to use a less attractive alternative.
    // See full explanation in the header file.

    if (flag) {
        [self addExtensionAttributeWithName:kDDXAttrArchivedName];
    } else {
        [self removeExtensionAttributeWithName:kDDXAttrArchivedName];
    }

#else

    if (flag) {
        [self addExtendedAttributeWithName:kDDXAttrArchivedName];
    } else {
        [self removeExtendedAttributeWithName:kDDXAttrArchivedName];
    }

#endif
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Changes
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (void)reset {
    _fileName = nil;
    _fileAttributes = nil;
    _creationDate = nil;
    _modificationDate = nil;
}

- (void)renameFile:(NSString *)newFileName {
    // This method is only used on the iPhone simulator, where normal extended attributes are broken.
    // See full explanation in the header file.

    if (![newFileName isEqualToString:[self fileName]]) {
        NSString *fileDir = [filePath stringByDeletingLastPathComponent];

        NSString *newFilePath = [fileDir stringByAppendingPathComponent:newFileName];

        NSLogVerbose(@"DDLogFileInfo: Renaming file: '%@' -> '%@'", self.fileName, newFileName);

        NSError *error = nil;

        if ([[NSFileManager defaultManager] fileExistsAtPath:newFilePath] &&
            ![[NSFileManager defaultManager] removeItemAtPath:newFilePath error:&error]) {
            NSLogError(@"DDLogFileInfo: Error deleting archive (%@): %@", self.fileName, error);
        }

        if (![[NSFileManager defaultManager] moveItemAtPath:filePath toPath:newFilePath error:&error]) {
            NSLogError(@"DDLogFileInfo: Error renaming file (%@): %@", self.fileName, error);
        }

        filePath = newFilePath;
        [self reset];
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Attribute Management
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#if TARGET_IPHONE_SIMULATOR

// Extended attributes don't work properly on the simulator.
// So we have to use a less attractive alternative.
// See full explanation in the header file.

- (BOOL)hasExtensionAttributeWithName:(NSString *)attrName {
    // This method is only used on the iPhone simulator, where normal extended attributes are broken.
    // See full explanation in the header file.

    // Split the file name into components. File name may have various format, but generally
    // structure is same:
    //
    // <name part>.<extension part> and <name part>.archived.<extension part>
    // or
    // <name part> and <name part>.archived
    //
    // So we want to search for the attrName in the components (ignoring the first array index).

    NSArray *components = [[self fileName] componentsSeparatedByString:@"."];

    // Watch out for file names without an extension

    for (NSUInteger i = 1; i < components.count; i++) {
        NSString *attr = components[i];

        if ([attrName isEqualToString:attr]) {
            return YES;
        }
    }

    return NO;
}

- (void)addExtensionAttributeWithName:(NSString *)attrName {
    // This method is only used on the iPhone simulator, where normal extended attributes are broken.
    // See full explanation in the header file.

    if ([attrName length] == 0) {
        return;
    }

    // Example:
    // attrName = "archived"
    //
    // "mylog.txt" -> "mylog.archived.txt"
    // "mylog"     -> "mylog.archived"

    NSArray *components = [[self fileName] componentsSeparatedByString:@"."];

    NSUInteger count = [components count];

    NSUInteger estimatedNewLength = [[self fileName] length] + [attrName length] + 1;
    NSMutableString *newFileName = [NSMutableString stringWithCapacity:estimatedNewLength];

    if (count > 0) {
        [newFileName appendString:components.firstObject];
    }

    NSString *lastExt = @"";

    NSUInteger i;

    for (i = 1; i < count; i++) {
        NSString *attr = components[i];

        if ([attr length] == 0) {
            continue;
        }

        if ([attrName isEqualToString:attr]) {
            // Extension attribute already exists in file name
            return;
        }

        if ([lastExt length] > 0) {
            [newFileName appendFormat:@".%@", lastExt];
        }

        lastExt = attr;
    }

    [newFileName appendFormat:@".%@", attrName];

    if ([lastExt length] > 0) {
        [newFileName appendFormat:@".%@", lastExt];
    }

    [self renameFile:newFileName];
}

- (void)removeExtensionAttributeWithName:(NSString *)attrName {
    // This method is only used on the iPhone simulator, where normal extended attributes are broken.
    // See full explanation in the header file.

    if ([attrName length] == 0) {
        return;
    }

    // Example:
    // attrName = "archived"
    //
    // "mylog.archived.txt" -> "mylog.txt"
    // "mylog.archived"     -> "mylog"

    NSArray *components = [[self fileName] componentsSeparatedByString:@"."];

    NSUInteger count = [components count];

    NSUInteger estimatedNewLength = [[self fileName] length];
    NSMutableString *newFileName = [NSMutableString stringWithCapacity:estimatedNewLength];

    if (count > 0) {
        [newFileName appendString:components.firstObject];
    }

    BOOL found = NO;

    NSUInteger i;

    for (i = 1; i < count; i++) {
        NSString *attr = components[i];

        if ([attrName isEqualToString:attr]) {
            found = YES;
        } else {
            [newFileName appendFormat:@".%@", attr];
        }
    }

    if (found) {
        [self renameFile:newFileName];
    }
}

#else /* if TARGET_IPHONE_SIMULATOR */

- (BOOL)hasExtendedAttributeWithName:(NSString *)attrName {
    const char *path = [filePath UTF8String];
    const char *name = [attrName UTF8String];

    ssize_t result = getxattr(path, name, NULL, 0, 0, 0);

    return (result >= 0);
}

- (void)addExtendedAttributeWithName:(NSString *)attrName {
    const char *path = [filePath UTF8String];
    const char *name = [attrName UTF8String];

    int result = setxattr(path, name, NULL, 0, 0, 0);

    if (result < 0) {
        NSLogError(@"DDLogFileInfo: setxattr(%@, %@): error = %s",
                   attrName,
                   filePath,
                   strerror(errno));
    }
}

- (void)removeExtendedAttributeWithName:(NSString *)attrName {
    const char *path = [filePath UTF8String];
    const char *name = [attrName UTF8String];

    int result = removexattr(path, name, 0);

    if (result < 0 && errno != ENOATTR) {
        NSLogError(@"DDLogFileInfo: removexattr(%@, %@): error = %s",
                   attrName,
                   self.fileName,
                   strerror(errno));
    }
}

#endif /* if TARGET_IPHONE_SIMULATOR */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Comparisons
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)isEqual:(id)object {
    if ([object isKindOfClass:[self class]]) {
        DDLogFileInfo *another = (DDLogFileInfo *)object;

        return [filePath isEqualToString:[another filePath]];
    }

    return NO;
}

-(NSUInteger)hash {
    return [filePath hash];
}

- (NSComparisonResult)reverseCompareByCreationDate:(DDLogFileInfo *)another {
    NSDate *us = [self creationDate];
    NSDate *them = [another creationDate];

    NSComparisonResult result = [us compare:them];

    if (result == NSOrderedAscending) {
        return NSOrderedDescending;
    }

    if (result == NSOrderedDescending) {
        return NSOrderedAscending;
    }

    return NSOrderedSame;
}

- (NSComparisonResult)reverseCompareByModificationDate:(DDLogFileInfo *)another {
    NSDate *us = [self modificationDate];
    NSDate *them = [another modificationDate];

    NSComparisonResult result = [us compare:them];

    if (result == NSOrderedAscending) {
        return NSOrderedDescending;
    }

    if (result == NSOrderedDescending) {
        return NSOrderedAscending;
    }

    return NSOrderedSame;
}

@end

#if TARGET_OS_IPHONE
/**
 * When creating log file on iOS we're setting NSFileProtectionKey attribute to NSFileProtectionCompleteUnlessOpen.
 *
 * But in case if app is able to launch from background we need to have an ability to open log file any time we
 * want (even if device is locked). Thats why that attribute have to be changed to
 * NSFileProtectionCompleteUntilFirstUserAuthentication.
 */
BOOL doesAppRunInBackground() {
    BOOL answer = NO;

    NSArray *backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];

    for (NSString *mode in backgroundModes) {
        if (mode.length > 0) {
            answer = YES;
            break;
        }
    }

    return answer;
}

#endif
