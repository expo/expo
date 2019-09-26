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

#import <sys/utsname.h>

#import <UIKit/UIKit.h>

#import "FBSDKLibAnalyzer.h"

#define FBSDK_MAX_CRASH_LOGS 5
#define FBSDK_CRASH_PATH_NAME @"instrument"

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

# pragma mark - Class Methods

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

+ (void)sendCrashLogs
{
  NSArray<id<FBSDKCrashObserving>> *observers = [_observers copy];
  for (id<FBSDKCrashObserving> observer in observers) {
    if (observer && [observer respondsToSelector:@selector(didReceiveCrashLogs:)]) {
      NSArray<NSDictionary<NSString *, id> *> *filteredCrashLogs = [self filterCrashLogs:observer.prefixes];
      [observer didReceiveCrashLogs:filteredCrashLogs];
    }
  }
}

+ (NSArray<NSDictionary<NSString *, id> *> *)filterCrashLogs:(NSArray<NSString *> *)prefixList
{
  NSMutableArray<NSDictionary<NSString *, id> *> *crashLogs = [NSMutableArray array];
  for (NSDictionary<NSString *, id> *crashLog in _processedCrashLogs) {
    NSArray<NSString *> *callstack = crashLog[kFBSDKCallstack];
    if ([self callstack:callstack containsPrefix:prefixList]) {
      [crashLogs addObject:crashLog];
    }
  }
  return crashLogs;
}

+ (BOOL)callstack:(NSArray<NSString *> *)callstack
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

+ (void)disable
{
  _isTurnedOff = YES;
  [FBSDKCrashHandler uninstallExceptionsHandler];
  _observers = nil;
}

+ (void)addObserver:(id<FBSDKCrashObserving>)observer
{
  if (_isTurnedOff || ![self isSafeToGenerateMapping]) {
    return;
  }
  static dispatch_once_t onceToken = 0;
  dispatch_once(&onceToken, ^{
    [FBSDKCrashHandler installExceptionsHandler];
    _processedCrashLogs = [self getProcessedCrashLogs];
  });
  if (![_observers containsObject:observer]) {
    [_observers addObject:observer];
    [self generateMethodMapping:observer];
    [self sendCrashLogs];
  }
}

+ (void)removeObserver:(id<FBSDKCrashObserving>)observer
{
  if ([_observers containsObject:observer]) {
    [_observers removeObject:observer];
    if (_observers.count == 0) {
      [FBSDKCrashHandler uninstallExceptionsHandler];
    }
  }
}

# pragma mark handler function

+ (void)installExceptionsHandler
{
  NSUncaughtExceptionHandler *currentHandler = NSGetUncaughtExceptionHandler();

  if (currentHandler != FBSDKExceptionHandler) {
    previousExceptionHandler = currentHandler;
    NSSetUncaughtExceptionHandler(&FBSDKExceptionHandler);
  }
}

+ (void)uninstallExceptionsHandler
{
  NSSetUncaughtExceptionHandler(previousExceptionHandler);
  previousExceptionHandler = nil;
}

static void FBSDKExceptionHandler(NSException *exception)
{
  [FBSDKCrashHandler saveException:exception];
  if (previousExceptionHandler) {
    previousExceptionHandler(exception);
  }
}

#pragma mark - Storage

+ (void)saveException:(NSException *)exception
{
  if (exception.callStackSymbols && exception.name) {
    NSArray<NSString *> *stackSymbols = [NSArray arrayWithArray:exception.callStackSymbols];
    [self saveCrashLog:@{
                         kFBSDKCallstack : stackSymbols,
                         kFBSDKCrashReason : exception.name,
                         }];
  }
}

+ (void)saveSignal:(int)signal withCallStack:(NSArray<NSString *> *)callStack
{
  if (callStack) {
    NSString *signalDescription = [NSString stringWithCString:strsignal(signal) encoding:NSUTF8StringEncoding] ?: [NSString stringWithFormat:@"SIGNUM(%i)", signal];
    [self saveCrashLog:@{
                         kFBSDKCallstack : callStack,
                         kFBSDKCrashReason : signalDescription,
                         }];
  }
}

+ (NSArray<NSDictionary<NSString *, id> *> *)getProcessedCrashLogs
{
  NSArray<NSDictionary<NSString *, id> *> *crashLogs = [self loadCrashLogs];
  if (0 == crashLogs.count) {
    [self clearCrashReportFiles];
    return nil;
  }
  NSMutableArray<NSDictionary<NSString *, id> *> *processedCrashLogs = [NSMutableArray array];

  for (NSDictionary<NSString *, id> *crashLog in crashLogs) {
    NSArray<NSString *> *callstack = crashLog[kFBSDKCallstack];
    NSDictionary<NSString *, id> *methodMapping = [self loadLibData:crashLog];
    NSArray<NSString *> *symbolicatedCallstack = [FBSDKLibAnalyzer symbolicateCallstack:callstack methodMapping:methodMapping];
    NSMutableDictionary<NSString *, id> *symbolicatedCrashLog = [NSMutableDictionary dictionaryWithDictionary:crashLog];
    if (symbolicatedCallstack) {
      [symbolicatedCrashLog setObject:symbolicatedCallstack forKey:kFBSDKCallstack];
      [symbolicatedCrashLog removeObjectForKey:kFBSDKMappingTableIdentifier];
      [processedCrashLogs addObject:symbolicatedCrashLog];
    }
  }
  return processedCrashLogs;
}

+ (NSArray<NSDictionary<NSString *, id> *> *)loadCrashLogs
{
  NSArray<NSString *> *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:NULL];
  NSArray<NSString *> *fileNames = [[self getCrashLogFileNames:files] sortedArrayUsingComparator:^NSComparisonResult(id _Nonnull obj1, id _Nonnull obj2){
    return [obj2 compare:obj1];
  }];
  NSMutableArray<NSDictionary<NSString *, id> *> *crashLogArray = [NSMutableArray array];

  for (NSUInteger i = 0; i < MIN(fileNames.count, FBSDK_MAX_CRASH_LOGS); i++) {
    NSDictionary<NSString *, id> *crashLog = [self loadCrashLog:fileNames[i]];
    [crashLogArray addObject:crashLog];
  }
  return [crashLogArray copy];
}

+ (NSDictionary<NSString *,id> *)loadCrashLog:(NSString *)fileName
{
  return [NSDictionary dictionaryWithContentsOfFile:[directoryPath stringByAppendingPathComponent:fileName]];
}

+ (void)clearCrashReportFiles
{
  NSArray<NSString *> *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:nil];

  for (NSUInteger i = 0; i < files.count; i++) {
    // remove all crash related files except for the current mapping table
    if ([files[i] hasPrefix:@"crash_"] && ![files[i] containsString:mappingTableIdentifier]) {
      [[NSFileManager defaultManager] removeItemAtPath:[directoryPath stringByAppendingPathComponent:files[i]] error:nil];
    }
  }
}

+ (NSArray<NSString *> *)getCrashLogFileNames:(NSArray<NSString *> *)files
{
  NSMutableArray<NSString *> *fileNames = [NSMutableArray array];

  for (NSString *fileName in files) {
    if ([fileName hasPrefix:@"crash_log_"] && [fileName hasSuffix:@".json"]) {
      [fileNames addObject:fileName];
    }
  }

  return fileNames;
}

+ (void)saveCrashLog:(NSDictionary<NSString *, id> *)crashLog
{
  NSMutableDictionary<NSString *, id> *completeCrashLog = [NSMutableDictionary dictionaryWithDictionary:crashLog];
  NSString *currentTimestamp = [NSString stringWithFormat:@"%.0lf", [[NSDate date] timeIntervalSince1970]];

  [completeCrashLog setObject:currentTimestamp forKey:kFBSDKCrashTimestamp];
  [completeCrashLog setObject:mappingTableIdentifier forKey:kFBSDKMappingTableIdentifier];

  NSBundle *mainBundle = [NSBundle mainBundle];
  NSString *version = [mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  NSString *build = [mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"];
  [completeCrashLog setObject:[NSString stringWithFormat:@"%@(%@)", version, build] forKey:kFBSDKAppVersion];

  struct utsname systemInfo;
  uname(&systemInfo);
  [completeCrashLog setObject:@(systemInfo.machine) forKey:kFBSDKDeviceModel];

  [completeCrashLog setObject:[UIDevice currentDevice].systemVersion forKey:kFBSDKDeviceOSVersion];

  [completeCrashLog writeToFile:[self getPathToCrashFile:currentTimestamp]
                     atomically:YES];
}

+ (void)generateMethodMapping:(id<FBSDKCrashObserving>)observer
{
  if (observer.prefixes.count == 0) {
    return;
  }
  [[NSUserDefaults standardUserDefaults] setObject:mappingTableIdentifier forKey:kFBSDKMappingTableIdentifier];
  NSDictionary<NSString *, NSString *> *methodMapping = [FBSDKLibAnalyzer getMethodsTable:observer.prefixes
                                                                               frameworks:observer.frameworks];
  if (methodMapping.count > 0){
    [methodMapping writeToFile:[self getPathToLibDataFile:mappingTableIdentifier]
                    atomically:YES];
  }
}

+ (NSDictionary<NSString *, id> *)loadLibData:(NSDictionary<NSString *, id> *)crashLog
{
  NSString *identifier = [crashLog objectForKey:kFBSDKMappingTableIdentifier];
  return [NSDictionary dictionaryWithContentsOfFile:[self getPathToLibDataFile:identifier]];
}

+ (NSString *)getPathToCrashFile:(NSString *)timestamp
{
  return [directoryPath stringByAppendingPathComponent:
          [NSString stringWithFormat:@"crash_log_%@.json", timestamp]];
}

+ (NSString *)getPathToLibDataFile:(NSString *)identifier
{
  return [directoryPath stringByAppendingPathComponent:
          [NSString stringWithFormat:@"crash_lib_data_%@.json", identifier]];

}

+ (BOOL)isSafeToGenerateMapping
{
#if TARGET_OS_SIMULATOR
  return YES;
#else
  NSString *identifier = [[NSUserDefaults standardUserDefaults] objectForKey:kFBSDKMappingTableIdentifier];
  //first app start
  if (!identifier) {
    return YES;
  }

  return [[NSFileManager defaultManager] fileExistsAtPath:[self getPathToLibDataFile:identifier]];
#endif
}

@end
