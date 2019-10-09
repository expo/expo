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

// Disable legacy macros
#ifndef DD_LEGACY_MACROS
    #define DD_LEGACY_MACROS 0
#endif

#import <CocoaLumberjack/DDLog.h>

NS_ASSUME_NONNULL_BEGIN

@class DDLogFileInfo;

/**
 * This class provides a logger to write log statements to a file.
 **/


// Default configuration and safety/sanity values.
//
// maximumFileSize         -> kDDDefaultLogMaxFileSize
// rollingFrequency        -> kDDDefaultLogRollingFrequency
// maximumNumberOfLogFiles -> kDDDefaultLogMaxNumLogFiles
// logFilesDiskQuota       -> kDDDefaultLogFilesDiskQuota
//
// You should carefully consider the proper configuration values for your application.

extern unsigned long long const kDDDefaultLogMaxFileSize;
extern NSTimeInterval     const kDDDefaultLogRollingFrequency;
extern NSUInteger         const kDDDefaultLogMaxNumLogFiles;
extern unsigned long long const kDDDefaultLogFilesDiskQuota;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *  The LogFileManager protocol is designed to allow you to control all aspects of your log files.
 *
 *  The primary purpose of this is to allow you to do something with the log files after they have been rolled.
 *  Perhaps you want to compress them to save disk space.
 *  Perhaps you want to upload them to an FTP server.
 *  Perhaps you want to run some analytics on the file.
 *
 *  A default LogFileManager is, of course, provided.
 *  The default LogFileManager simply deletes old log files according to the maximumNumberOfLogFiles property.
 *
 *  This protocol provides various methods to fetch the list of log files.
 *
 *  There are two variants: sorted and unsorted.
 *  If sorting is not necessary, the unsorted variant is obviously faster.
 *  The sorted variant will return an array sorted by when the log files were created,
 *  with the most recently created log file at index 0, and the oldest log file at the end of the array.
 *
 *  You can fetch only the log file paths (full path including name), log file names (name only),
 *  or an array of `DDLogFileInfo` objects.
 *  The `DDLogFileInfo` class is documented below, and provides a handy wrapper that
 *  gives you easy access to various file attributes such as the creation date or the file size.
 */
@protocol DDLogFileManager <NSObject>
@required

// Public properties

/**
 * The maximum number of archived log files to keep on disk.
 * For example, if this property is set to 3,
 * then the LogFileManager will only keep 3 archived log files (plus the current active log file) on disk.
 * Once the active log file is rolled/archived, then the oldest of the existing 3 rolled/archived log files is deleted.
 *
 * You may optionally disable this option by setting it to zero.
 **/
@property (readwrite, assign, atomic) NSUInteger maximumNumberOfLogFiles;

/**
 * The maximum space that logs can take. On rolling logfile all old log files that exceed logFilesDiskQuota will
 * be deleted.
 *
 * You may optionally disable this option by setting it to zero.
 **/
@property (readwrite, assign, atomic) unsigned long long logFilesDiskQuota;

// Public methods

/**
 *  Returns the logs directory (path)
 */
@property (nonatomic, readonly, copy) NSString *logsDirectory;

/**
 * Returns an array of `NSString` objects,
 * each of which is the filePath to an existing log file on disk.
 **/
@property (nonatomic, readonly, strong) NSArray<NSString *> *unsortedLogFilePaths;

/**
 * Returns an array of `NSString` objects,
 * each of which is the fileName of an existing log file on disk.
 **/
@property (nonatomic, readonly, strong) NSArray<NSString *> *unsortedLogFileNames;

/**
 * Returns an array of `DDLogFileInfo` objects,
 * each representing an existing log file on disk,
 * and containing important information about the log file such as it's modification date and size.
 **/
@property (nonatomic, readonly, strong) NSArray<DDLogFileInfo *> *unsortedLogFileInfos;

/**
 * Just like the `unsortedLogFilePaths` method, but sorts the array.
 * The items in the array are sorted by creation date.
 * The first item in the array will be the most recently created log file.
 **/
@property (nonatomic, readonly, strong) NSArray<NSString *> *sortedLogFilePaths;

/**
 * Just like the `unsortedLogFileNames` method, but sorts the array.
 * The items in the array are sorted by creation date.
 * The first item in the array will be the most recently created log file.
 **/
@property (nonatomic, readonly, strong) NSArray<NSString *> *sortedLogFileNames;

/**
 * Just like the `unsortedLogFileInfos` method, but sorts the array.
 * The items in the array are sorted by creation date.
 * The first item in the array will be the most recently created log file.
 **/
@property (nonatomic, readonly, strong) NSArray<DDLogFileInfo *> *sortedLogFileInfos;

// Private methods (only to be used by DDFileLogger)

/**
 * Generates a new unique log file path, and creates the corresponding log file.
 * This method is executed directly on the file logger's internal queue.
 * The file has to exist by the time the method returns.
 **/
- (NSString *)createNewLogFile;

@optional

// Notifications from DDFileLogger

/**
 *  Called when a log file was archived. Executed on global queue with default priority.
 */
- (void)didArchiveLogFile:(NSString *)logFilePath NS_SWIFT_NAME(didArchiveLogFile(atPath:));

/**
 *  Called when the roll action was executed and the log was archived.
 *  Executed on global queue with default priority.
 */
- (void)didRollAndArchiveLogFile:(NSString *)logFilePath NS_SWIFT_NAME(didRollAndArchiveLogFile(atPath:));

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Default log file manager.
 *
 * All log files are placed inside the logsDirectory.
 * If a specific logsDirectory isn't specified, the default directory is used.
 * On Mac, this is in `~/Library/Logs/<Application Name>`.
 * On iPhone, this is in `~/Library/Caches/Logs`.
 *
 * Log files are named `"<bundle identifier> <date> <time>.log"`
 * Example: `com.organization.myapp 2013-12-03 17-14.log`
 *
 * Archived log files are automatically deleted according to the `maximumNumberOfLogFiles` property.
 **/
@interface DDLogFileManagerDefault : NSObject <DDLogFileManager>

/**
 *  Default initializer
 */
- (instancetype)init;

/**
 *  If logDirectory is not specified, then a folder called "Logs" is created in the app's cache directory.
 *  While running on the simulator, the "Logs" folder is located in the library temporary directory.
 */
- (instancetype)initWithLogsDirectory:(NSString * __nullable)logsDirectory NS_DESIGNATED_INITIALIZER;

#if TARGET_OS_IPHONE
/*
 * Calling this constructor you can override the default "automagically" chosen NSFileProtection level.
 * Useful if you are writing a command line utility / CydiaSubstrate addon for iOS that has no NSBundle
 * or like SpringBoard no BackgroundModes key in the NSBundle:
 *    iPhone:~ root# cycript -p SpringBoard
 *    cy# [NSBundle mainBundle]
 *    #"NSBundle </System/Library/CoreServices/SpringBoard.app> (loaded)"
 *    cy# [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
 *    null
 *    cy#
 **/
- (instancetype)initWithLogsDirectory:(NSString * __nullable)logsDirectory
           defaultFileProtectionLevel:(NSFileProtectionType)fileProtectionLevel;
#endif

/*
 * Methods to override.
 *
 * Log files are named `"<bundle identifier> <date> <time>.log"`
 * Example: `com.organization.myapp 2013-12-03 17-14.log`
 *
 * If you wish to change default filename, you can override following two methods.
 * - `newLogFileName` method would be called on new logfile creation.
 * - `isLogFile:` method would be called to filter log files from all other files in logsDirectory.
 *   You have to parse given filename and return YES if it is logFile.
 *
 * **NOTE**
 * `newLogFileName` returns filename. If appropriate file already exists, number would be added
 * to filename before extension. You have to handle this case in isLogFile: method.
 *
 * Example:
 * - newLogFileName returns `"com.organization.myapp 2013-12-03.log"`,
 *   file `"com.organization.myapp 2013-12-03.log"` would be created.
 * - after some time `"com.organization.myapp 2013-12-03.log"` is archived
 * - newLogFileName again returns `"com.organization.myapp 2013-12-03.log"`,
 *   file `"com.organization.myapp 2013-12-03 2.log"` would be created.
 * - after some time `"com.organization.myapp 2013-12-03 1.log"` is archived
 * - newLogFileName again returns `"com.organization.myapp 2013-12-03.log"`,
 *   file `"com.organization.myapp 2013-12-03 3.log"` would be created.
 **/

/**
 * Generates log file name with default format `"<bundle identifier> <date> <time>.log"`
 * Example: `MobileSafari 2013-12-03 17-14.log`
 *
 * You can change it by overriding `newLogFileName` and `isLogFile:` methods.
 **/
@property (readonly, copy) NSString *newLogFileName;

/**
 * Default log file name is `"<bundle identifier> <date> <time>.log"`.
 * Example: `MobileSafari 2013-12-03 17-14.log`
 *
 * You can change it by overriding `newLogFileName` and `isLogFile:` methods.
 **/
- (BOOL)isLogFile:(NSString *)fileName NS_SWIFT_NAME(isLogFile(withName:));

/**
 * New log files are created empty by default in `createNewLogFile:` method
 *
 * If you wish to specify a common file header to use in your log files,
 * you can set the initial log file contents by overriding `logFileHeader`
 **/
@property (readonly, copy, nullable) NSString *logFileHeader;

/* Inherited from DDLogFileManager protocol:

   @property (readwrite, assign, atomic) NSUInteger maximumNumberOfLogFiles;
   @property (readwrite, assign, atomic) NSUInteger logFilesDiskQuota;

   - (NSString *)logsDirectory;

   - (NSArray *)unsortedLogFilePaths;
   - (NSArray *)unsortedLogFileNames;
   - (NSArray *)unsortedLogFileInfos;

   - (NSArray *)sortedLogFilePaths;
   - (NSArray *)sortedLogFileNames;
   - (NSArray *)sortedLogFileInfos;

 */

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Most users will want file log messages to be prepended with the date and time.
 * Rather than forcing the majority of users to write their own formatter,
 * we will supply a logical default formatter.
 * Users can easily replace this formatter with their own by invoking the `setLogFormatter:` method.
 * It can also be removed by calling `setLogFormatter:`, and passing a nil parameter.
 *
 * In addition to the convenience of having a logical default formatter,
 * it will also provide a template that makes it easy for developers to copy and change.
 **/
@interface DDLogFileFormatterDefault : NSObject <DDLogFormatter>

/**
 *  Default initializer
 */
- (instancetype)init;

/**
 *  Designated initializer, requires a date formatter
 */
- (instancetype)initWithDateFormatter:(NSDateFormatter * __nullable)dateFormatter NS_DESIGNATED_INITIALIZER;

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *  The standard implementation for a file logger
 */
@interface DDFileLogger : DDAbstractLogger <DDLogger>

/**
 *  Default initializer.
 */
- (instancetype)init;

/**
 *  Designated initializer, requires a `DDLogFileManager` instance.
 *  A global queue w/ default priority is used to run callbacks.
 *  If needed, specify queue using `initWithLogFileManager:completionQueue:`.
 */
- (instancetype)initWithLogFileManager:(id <DDLogFileManager> __nullable)logFileManager;

/**
 *  Designated initializer, requires a `DDLogFileManager` instance.
 *  The completionQueue is used to execute `didArchiveLogFile`, `didRollAndArchiveLogFile`,
 *  and the callback in `rollLog`. If nil, a global queue w/ default priority is used.
 */
- (instancetype)initWithLogFileManager:(id <DDLogFileManager> __nullable)logFileManager
                       completionQueue:(dispatch_queue_t __nullable)dispatchQueue NS_DESIGNATED_INITIALIZER;

/**
 *  Called when the logger is about to write message. Call super before your implementation.
 */
- (void)willLogMessage NS_REQUIRES_SUPER;

/**
 *  Called when the logger wrote message. Call super after your implementation.
 */
- (void)didLogMessage NS_REQUIRES_SUPER;

/**
 *  Writes all in-memory log data to the permanent storage. Call super before your implementation.
 *  Don't call this method directly, instead use the `[DDLog flushLog]` to ensure all log messages are included in flush.
 */
- (void)flush NS_REQUIRES_SUPER;

/**
 *  Called when the logger checks archive or not current log file.
 *  Override this method to extend standard behavior. By default returns NO.
 *  This is executed directly on the logger's internal queue, so keep processing light!
 */
- (BOOL)shouldArchiveRecentLogFileInfo:(DDLogFileInfo *)recentLogFileInfo;

/**
 * Log File Rolling:
 *
 * `maximumFileSize`:
 *   The approximate maximum size (in bytes) to allow log files to grow.
 *   If a log file is larger than this value after a log statement is appended,
 *   then the log file is rolled.
 *
 * `rollingFrequency`
 *   How often to roll the log file.
 *   The frequency is given as an `NSTimeInterval`, which is a double that specifies the interval in seconds.
 *   Once the log file gets to be this old, it is rolled.
 *
 * `doNotReuseLogFiles`
 *   When set, will always create a new log file at application launch.
 *
 * Both the `maximumFileSize` and the `rollingFrequency` are used to manage rolling.
 * Whichever occurs first will cause the log file to be rolled.
 *
 * For example:
 * The `rollingFrequency` is 24 hours,
 * but the log file surpasses the `maximumFileSize` after only 20 hours.
 * The log file will be rolled at that 20 hour mark.
 * A new log file will be created, and the 24 hour timer will be restarted.
 *
 * You may optionally disable rolling due to filesize by setting `maximumFileSize` to zero.
 * If you do so, rolling is based solely on `rollingFrequency`.
 *
 * You may optionally disable rolling due to time by setting `rollingFrequency` to zero (or any non-positive number).
 * If you do so, rolling is based solely on `maximumFileSize`.
 *
 * If you disable both `maximumFileSize` and `rollingFrequency`, then the log file won't ever be rolled.
 * This is strongly discouraged.
 **/
@property (readwrite, assign) unsigned long long maximumFileSize;

/**
 *  See description for `maximumFileSize`
 */
@property (readwrite, assign) NSTimeInterval rollingFrequency;

/**
 *  See description for `maximumFileSize`
 */
@property (readwrite, assign, atomic) BOOL doNotReuseLogFiles;

/**
 * The DDLogFileManager instance can be used to retrieve the list of log files,
 * and configure the maximum number of archived log files to keep.
 *
 * @see DDLogFileManager.maximumNumberOfLogFiles
 **/
@property (strong, nonatomic, readonly) id <DDLogFileManager> logFileManager;

/**
 * When using a custom formatter you can set the `logMessage` method not to append
 * `\n` character after each output. This allows for some greater flexibility with
 * custom formatters. Default value is YES.
 **/
@property (nonatomic, readwrite, assign) BOOL automaticallyAppendNewlineForCustomFormatters;

/**
 *  You can optionally force the current log file to be rolled with this method.
 *  CompletionBlock will be called on main queue.
 */
- (void)rollLogFileWithCompletionBlock:(void (^ __nullable)(void))completionBlock
    NS_SWIFT_NAME(rollLogFile(withCompletion:));

/**
 *  Method is deprecated.
 *  @deprecated Use `rollLogFileWithCompletionBlock:` method instead.
 */
- (void)rollLogFile __attribute((deprecated));

// Inherited from DDAbstractLogger

// - (id <DDLogFormatter>)logFormatter;
// - (void)setLogFormatter:(id <DDLogFormatter>)formatter;

/**
 * Returns the log file that should be used.
 * If there is an existing log file that is suitable,
 * within the constraints of `maximumFileSize` and `rollingFrequency`, then it is returned.
 *
 * Otherwise a new file is created and returned.
 **/
@property (nonatomic, readonly, strong) DDLogFileInfo *currentLogFileInfo;

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * `DDLogFileInfo` is a simple class that provides access to various file attributes.
 * It provides good performance as it only fetches the information if requested,
 * and it caches the information to prevent duplicate fetches.
 *
 * It was designed to provide quick snapshots of the current state of log files,
 * and to help sort log files in an array.
 *
 * This class does not monitor the files, or update it's cached attribute values if the file changes on disk.
 * This is not what the class was designed for.
 *
 * If you absolutely must get updated values,
 * you can invoke the reset method which will clear the cache.
 **/
@interface DDLogFileInfo : NSObject

@property (strong, nonatomic, readonly) NSString *filePath;
@property (strong, nonatomic, readonly) NSString *fileName;

#if FOUNDATION_SWIFT_SDK_EPOCH_AT_LEAST(8)
@property (strong, nonatomic, readonly) NSDictionary<NSFileAttributeKey, id> *fileAttributes;
#else
@property (strong, nonatomic, readonly) NSDictionary<NSString *, id> *fileAttributes;
#endif

@property (strong, nonatomic, readonly) NSDate *creationDate;
@property (strong, nonatomic, readonly) NSDate *modificationDate;

@property (nonatomic, readonly) unsigned long long fileSize;

@property (nonatomic, readonly) NSTimeInterval age;

@property (nonatomic, readwrite) BOOL isArchived;

+ (instancetype)logFileWithPath:(NSString *)filePath NS_SWIFT_UNAVAILABLE("Use init(filePath:)");

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithFilePath:(NSString *)filePath NS_DESIGNATED_INITIALIZER;

- (void)reset;
- (void)renameFile:(NSString *)newFileName NS_SWIFT_NAME(renameFile(to:));

#if TARGET_IPHONE_SIMULATOR

// So here's the situation.
// Extended attributes are perfect for what we're trying to do here (marking files as archived).
// This is exactly what extended attributes were designed for.
//
// But Apple screws us over on the simulator.
// Everytime you build-and-go, they copy the application into a new folder on the hard drive,
// and as part of the process they strip extended attributes from our log files.
// Normally, a copy of a file preserves extended attributes.
// So obviously Apple has gone to great lengths to piss us off.
//
// Thus we use a slightly different tactic for marking log files as archived in the simulator.
// That way it "just works" and there's no confusion when testing.
//
// The difference in method names is indicative of the difference in functionality.
// On the simulator we add an attribute by appending a filename extension.
//
// For example:
// "mylog.txt" -> "mylog.archived.txt"
// "mylog"     -> "mylog.archived"

- (BOOL)hasExtensionAttributeWithName:(NSString *)attrName;

- (void)addExtensionAttributeWithName:(NSString *)attrName;
- (void)removeExtensionAttributeWithName:(NSString *)attrName;

#else /* if TARGET_IPHONE_SIMULATOR */

// Normal use of extended attributes used everywhere else,
// such as on Macs and on iPhone devices.

- (BOOL)hasExtendedAttributeWithName:(NSString *)attrName;

- (void)addExtendedAttributeWithName:(NSString *)attrName;
- (void)removeExtendedAttributeWithName:(NSString *)attrName;

#endif /* if TARGET_IPHONE_SIMULATOR */

- (NSComparisonResult)reverseCompareByCreationDate:(DDLogFileInfo *)another;
- (NSComparisonResult)reverseCompareByModificationDate:(DDLogFileInfo *)another;

@end

NS_ASSUME_NONNULL_END
