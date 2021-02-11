// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKCrashHandler.h"

#import <UIKit/UIKit.h>

#import <sys/utsname.h>

#import "FBSDKLibAnalyzer.h"
#import "FBSDKTypeUtility.h"

#define FBSDK_MAX_CRASH_LOGS 5
#define FBSDK_CRASH_PATH_NAME @"instrument"
#ifndef FBSDK_VERSION_STRING
 #define FBSDK_VERSION_STRING @"9.0.1"
#endif

static NSUncaughtExceptionHandler *previousExceptionHandler = NULL;
static NSString *mappingTableIdentifier = NULL;
static NSString *directoryPath;

NSString *const kFBSDKAppVersion = @"app_version";
NSString *const kFBSDKCallstack = @"callstack";
NSString *const kFBSDKCrashReason = @"reason";
NSString *const kFBSDKCrashTimestamp = @"timestamp";
NSString *const kFBSDKDeviceModel = @"device_model";
NSString *const kFBSDKDeviceOSVersion = @"device_os_version";

NSString *const kFBSDKMapingTable = @"mapping_table";
NSString *const kFBSDKMappingTableIdentifier = @"mapping_table_identifier";

@implementation FBSDKCrashHandler

static NSHashTable<id<FBSDKCrashObserving>> *_observers;
static NSArray<NSDictionary<NSString *, id> *> *_processedCrashLogs;
static BOOL _isTurnedOff;

+ (void)initialize
{
  NSString *dirPath = [NSTemporaryDirectory() stringByAppendingPathComponent:FBSDK_CRASH_PATH_NAME];
  if (![[NSFileManager defaultManager] fileExistsAtPath:dirPath]) {
    [[NSFileManager defaultManager] createDirectoryAtPath:dirPath withIntermediateDirectories:NO attributes:NULL error:NULL];
  }
  directoryPath = dirPath;
  NSString *identifier = [[NSUUID UUID] UUIDString];
  mappingTableIdentifier = [identifier stringByReplacingOccurrencesOfString:@"-" withString:@""];
  _observers = [[NSHashTable alloc] init];
}

#pragma mark - Public API

+ (NSString *)getFBSDKVersion
{
  return FBSDK_VERSION_STRING;
}

+ (void)disable
{
  _isTurnedOff = YES;
  [FBSDKCrashHandler _uninstallExceptionsHandler];
  _observers = nil;
}

+ (void)addObserver:(id<FBSDKCrashObserving>)observer
{
  if (_isTurnedOff || ![self _isSafeToGenerateMapping]) {
    return;
  }
  static dispatch_once_t onceToken = 0;
  dispatch_once(&onceToken, ^{
    [FBSDKCrashHandler _installExceptionsHandler];
    _processedCrashLogs = [self _getProcessedCrashLogs];
  });
  @synchronized(_observers) {
    if (![_observers containsObject:observer]) {
      [_observers addObject:observer];
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0), ^(void) {
        [self _generateMethodMapping:observer];
      });
      [self _sendCrashLogs];
    }
  }
}

+ (void)removeObserver:(id<FBSDKCrashObserving>)observer
{
  @synchronized(_observers) {
    if ([_observers containsObject:observer]) {
      [_observers removeObject:observer];
      if (_observers.count == 0) {
        [FBSDKCrashHandler _uninstallExceptionsHandler];
      }
    }
  }
}

+ (void)clearCrashReportFiles
{
  NSArray<NSString *> *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:nil];

  for (NSUInteger i = 0; i < files.count; i++) {
    // remove all crash related files except for the current mapping table
    if ([[FBSDKTypeUtility array:files objectAtIndex:i] hasPrefix:@"crash_"] && ![[FBSDKTypeUtility array:files objectAtIndex:i] containsString:mappingTableIdentifier]) {
      [[NSFileManager defaultManager] removeItemAtPath:[directoryPath stringByAppendingPathComponent:[FBSDKTypeUtility array:files objectAtIndex:i]] error:nil];
    }
  }
}

# pragma mark - Handler

+ (void)_installExceptionsHandler
{
  NSUncaughtExceptionHandler *currentHandler = NSGetUncaughtExceptionHandler();

  if (currentHandler != FBSDKExceptionHandler) {
    previousExceptionHandler = currentHandler;
    NSSetUncaughtExceptionHandler(&FBSDKExceptionHandler);
  }
}

+ (void)_uninstallExceptionsHandler
{
  NSSetUncaughtExceptionHandler(previousExceptionHandler);
  previousExceptionHandler = nil;
}

static void FBSDKExceptionHandler(NSException *exception)
{
  [FBSDKCrashHandler _saveException:exception];
  if (previousExceptionHandler) {
    previousExceptionHandler(exception);
  }
}

#pragma mark - Storage & Process

+ (void)_saveException:(NSException *)exception
{
  if (exception.callStackSymbols && exception.name) {
    NSArray<NSString *> *stackSymbols = [NSArray arrayWithArray:exception.callStackSymbols];
    [self _saveCrashLog:@{
       kFBSDKCallstack : stackSymbols,
       kFBSDKCrashReason : exception.name,
     }];
  }
}

+ (NSArray<NSDictionary<NSString *, id> *> *)_getProcessedCrashLogs
{
  NSArray<NSDictionary<NSString *, id> *> *crashLogs = [self _loadCrashLogs];
  if (0 == crashLogs.count) {
    [self clearCrashReportFiles];
    return nil;
  }
  NSMutableArray<NSDictionary<NSString *, id> *> *processedCrashLogs = [NSMutableArray array];

  for (NSDictionary<NSString *, id> *crashLog in crashLogs) {
    NSArray<NSString *> *callstack = crashLog[kFBSDKCallstack];
    NSData *data = [self _loadLibData:crashLog];
    if (!data) {
      continue;
    }
    NSDictionary<NSString *, id> *methodMapping = [FBSDKTypeUtility JSONObjectWithData:data
                                                                               options:kNilOptions
                                                                                 error:nil];
    NSArray<NSString *> *symbolicatedCallstack = [FBSDKLibAnalyzer symbolicateCallstack:callstack methodMapping:methodMapping];
    NSMutableDictionary<NSString *, id> *symbolicatedCrashLog = [NSMutableDictionary dictionaryWithDictionary:crashLog];
    if (symbolicatedCallstack) {
      [FBSDKTypeUtility dictionary:symbolicatedCrashLog setObject:symbolicatedCallstack forKey:kFBSDKCallstack];
      [symbolicatedCrashLog removeObjectForKey:kFBSDKMappingTableIdentifier];
      [FBSDKTypeUtility array:processedCrashLogs addObject:symbolicatedCrashLog];
    }
  }
  return processedCrashLogs;
}

+ (NSArray<NSDictionary<NSString *, id> *> *)_loadCrashLogs
{
  NSArray<NSString *> *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:NULL];
  NSArray<NSString *> *fileNames = [[self _getCrashLogFileNames:files] sortedArrayUsingComparator:^NSComparisonResult (id _Nonnull obj1, id _Nonnull obj2) {
    return [obj2 compare:obj1];
  }];
  NSMutableArray<NSDictionary<NSString *, id> *> *crashLogArray = [NSMutableArray array];

  for (NSUInteger i = 0; i < MIN(fileNames.count, FBSDK_MAX_CRASH_LOGS); i++) {
    NSData *data = [self _loadCrashLog:[FBSDKTypeUtility array:fileNames objectAtIndex:i]];
    if (!data) {
      continue;
    }
    NSDictionary<NSString *, id> *crashLog = [FBSDKTypeUtility JSONObjectWithData:data
                                                                          options:kNilOptions
                                                                            error:nil];
    if (crashLog) {
      [FBSDKTypeUtility array:crashLogArray addObject:crashLog];
    }
  }
  return [crashLogArray copy];
}

+ (nullable NSData *)_loadCrashLog:(NSString *)fileName
{
  return [NSData dataWithContentsOfFile:[directoryPath stringByAppendingPathComponent:fileName] options:NSDataReadingMappedIfSafe error:nil];
}

+ (NSArray<NSString *> *)_getCrashLogFileNames:(NSArray<NSString *> *)files
{
  NSMutableArray<NSString *> *fileNames = [NSMutableArray array];

  for (NSString *fileName in files) {
    if ([fileName hasPrefix:@"crash_log_"] && [fileName hasSuffix:@".json"]) {
      [FBSDKTypeUtility array:fileNames addObject:fileName];
    }
  }

  return fileNames;
}

+ (void)_saveCrashLog:(NSDictionary<NSString *, id> *)crashLog
{
  NSMutableDictionary<NSString *, id> *completeCrashLog = [NSMutableDictionary dictionaryWithDictionary:crashLog];
  NSString *currentTimestamp = [NSString stringWithFormat:@"%.0lf", [[NSDate date] timeIntervalSince1970]];

  [FBSDKTypeUtility dictionary:completeCrashLog setObject:currentTimestamp forKey:kFBSDKCrashTimestamp];
  [FBSDKTypeUtility dictionary:completeCrashLog setObject:mappingTableIdentifier forKey:kFBSDKMappingTableIdentifier];

  NSBundle *mainBundle = [NSBundle mainBundle];
  NSString *version = [mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  NSString *build = [mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"];
  [FBSDKTypeUtility dictionary:completeCrashLog setObject:[NSString stringWithFormat:@"%@(%@)", version, build] forKey:kFBSDKAppVersion];

  struct utsname systemInfo;
  uname(&systemInfo);
  [FBSDKTypeUtility dictionary:completeCrashLog setObject:@(systemInfo.machine) forKey:kFBSDKDeviceModel];

  [FBSDKTypeUtility dictionary:completeCrashLog setObject:[UIDevice currentDevice].systemVersion forKey:kFBSDKDeviceOSVersion];

  NSData *data = [FBSDKTypeUtility dataWithJSONObject:completeCrashLog options:0 error:nil];

  [data writeToFile:[self _getPathToCrashFile:currentTimestamp]
         atomically:YES];
}

+ (void)_sendCrashLogs
{
  for (id<FBSDKCrashObserving> observer in _observers) {
    if (observer && [observer respondsToSelector:@selector(didReceiveCrashLogs:)]) {
      NSArray<NSDictionary<NSString *, id> *> *filteredCrashLogs = [self _filterCrashLogs:observer.prefixes processedCrashLogs:_processedCrashLogs];
      [observer didReceiveCrashLogs:filteredCrashLogs];
    }
  }
}

+ (NSArray<NSDictionary<NSString *, id> *> *)_filterCrashLogs:(NSArray<NSString *> *)prefixList
                                           processedCrashLogs:(NSArray<NSDictionary<NSString *, id> *> *)processedCrashLogs
{
  NSMutableArray<NSDictionary<NSString *, id> *> *crashLogs = [NSMutableArray array];
  for (NSDictionary<NSString *, id> *crashLog in processedCrashLogs) {
    NSArray<NSString *> *callstack = crashLog[kFBSDKCallstack];
    if ([self _callstack:callstack containsPrefix:prefixList]) {
      [FBSDKTypeUtility array:crashLogs addObject:crashLog];
    }
  }
  return crashLogs;
}

+ (BOOL)_callstack:(NSArray<NSString *> *)callstack
    containsPrefix:(NSArray<NSString *> *)prefixList
{
  NSString *callStackString = [callstack componentsJoinedByString:@""];
  for (NSString *prefix in prefixList) {
    if ([callStackString containsString:prefix]) {
      return YES;
    }
  }
  return NO;
}

#pragma mark - Method Mapping

+ (void)_generateMethodMapping:(id<FBSDKCrashObserving>)observer
{
  if (observer.prefixes.count == 0) {
    return;
  }
  [[NSUserDefaults standardUserDefaults] setObject:mappingTableIdentifier forKey:kFBSDKMappingTableIdentifier];
  NSDictionary<NSString *, NSString *> *methodMapping = [FBSDKLibAnalyzer getMethodsTable:observer.prefixes
                                                                               frameworks:observer.frameworks];
  if (methodMapping.count > 0) {
    NSData *data = [FBSDKTypeUtility dataWithJSONObject:methodMapping options:0 error:nil];
    [data writeToFile:[self _getPathToLibDataFile:mappingTableIdentifier]
           atomically:YES];
  }
}

+ (nullable NSData *)_loadLibData:(NSDictionary<NSString *, id> *)crashLog
{
  NSString *identifier = [FBSDKTypeUtility dictionary:crashLog objectForKey:kFBSDKMappingTableIdentifier ofType:NSObject.class];
  return [NSData dataWithContentsOfFile:[self _getPathToLibDataFile:identifier] options:NSDataReadingMappedIfSafe error:nil];
}

+ (NSString *)_getPathToCrashFile:(NSString *)timestamp
{
  return [directoryPath stringByAppendingPathComponent:
          [NSString stringWithFormat:@"crash_log_%@.json", timestamp]];
}

+ (NSString *)_getPathToLibDataFile:(NSString *)identifier
{
  return [directoryPath stringByAppendingPathComponent:
          [NSString stringWithFormat:@"crash_lib_data_%@.json", identifier]];
}

+ (BOOL)_isSafeToGenerateMapping
{
#if TARGET_OS_SIMULATOR
  return YES;
#else
  NSString *identifier = [[NSUserDefaults standardUserDefaults] objectForKey:kFBSDKMappingTableIdentifier];
  // first app start
  if (!identifier) {
    return YES;
  }

  return [[NSFileManager defaultManager] fileExistsAtPath:[self _getPathToLibDataFile:identifier]];
#endif
}

@end
