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

#import "FBSDKErrorReport.h"

#import "FBSDKGraphRequest.h"
#import "FBSDKGraphRequestConnection.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"
#import "FBSDKSettings+Internal.h"

#define FBSDK_MAX_ERROR_REPORT_LOGS 1000

@implementation FBSDKErrorReport

static NSString *ErrorReportStorageDirName = @"instrument/";
static NSString *directoryPath;

NSString *const kFBSDKErrorCode = @"error_code";
NSString *const kFBSDKErrorDomain = @"domain";
NSString *const kFBSDKErrorTimestamp = @"timestamp";

# pragma mark - Public Methods

+ (void)enable
{
  NSString *dirPath = [NSTemporaryDirectory() stringByAppendingPathComponent:ErrorReportStorageDirName];
  if (![[NSFileManager defaultManager] fileExistsAtPath:dirPath]) {
    if (![[NSFileManager defaultManager] createDirectoryAtPath:dirPath withIntermediateDirectories:NO attributes:NULL error:NULL]) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational formatString:@"Failed to create library at %@", dirPath];
    }
  }
  directoryPath = dirPath;
  [self _uploadError];
  [FBSDKError enableErrorReport];
}

+ (void)saveError:(NSInteger)errorCode
      errorDomain:(NSErrorDomain)errorDomain
          message:(nullable NSString *)message
{
  NSString *timestamp = [NSString stringWithFormat:@"%.0lf", [[NSDate date] timeIntervalSince1970]];
  [self _saveErrorInfoToDisk:@{
     kFBSDKErrorCode : @(errorCode),
     kFBSDKErrorDomain : errorDomain,
     kFBSDKErrorTimestamp : timestamp,
   }];
}

#pragma mark - Private Methods

+ (void)_uploadError
{
  if ([FBSDKSettings isDataProcessingRestricted]) {
    return;
  }
  NSArray<NSDictionary<NSString *, id> *> *errorReports = [self _loadErrorReports];
  if ([errorReports count] == 0) {
    return [self _clearErrorInfo];
  }
  NSData *jsonData = [FBSDKTypeUtility dataWithJSONObject:errorReports options:0 error:nil];
  if (!jsonData) {
    return;
  }
  NSString *errorData = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@/instruments", [FBSDKSettings appID]]
                                                                 parameters:@{@"error_reports" : errorData ?: @""}
                                                                 HTTPMethod:FBSDKHTTPMethodPOST];

  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (!error && [result isKindOfClass:[NSDictionary class]] && result[@"success"]) {
      [self _clearErrorInfo];
    }
  }];
}

+ (NSArray<NSDictionary<NSString *, id> *> *)_loadErrorReports
{
  NSMutableArray<NSDictionary<NSString *, id> *> *errorReportArr = [NSMutableArray array];
  NSArray<NSString *> *fileNames = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:NULL];
  NSPredicate *predicate = [NSPredicate predicateWithBlock:^BOOL (id _Nullable evaluatedObject, NSDictionary<NSString *, id> *_Nullable bindings) {
    NSString *str = (NSString *)evaluatedObject;
    return [str hasPrefix:@"error_report_"] && [str hasSuffix:@".json"];
  }];
  fileNames = [fileNames filteredArrayUsingPredicate:predicate];
  fileNames = [fileNames sortedArrayUsingComparator:^NSComparisonResult (id _Nonnull obj1, id _Nonnull obj2) {
    return [obj2 compare:obj1];
  }];
  if (fileNames.count > 0) {
    fileNames = [fileNames subarrayWithRange:NSMakeRange(0, MIN(fileNames.count, FBSDK_MAX_ERROR_REPORT_LOGS))];
    for (NSUInteger i = 0; i < fileNames.count; i++) {
      NSData *data = [NSData dataWithContentsOfFile:[directoryPath stringByAppendingPathComponent:[FBSDKTypeUtility array:fileNames objectAtIndex:i]]
                                            options:NSDataReadingMappedIfSafe
                                              error:nil];
      if (data) {
        NSDictionary<NSString *, id> *errorReport = [FBSDKTypeUtility JSONObjectWithData:data
                                                                                 options:0
                                                                                   error:nil];
        if (errorReport) {
          [FBSDKTypeUtility array:errorReportArr addObject:errorReport];
        }
      }
    }
  }
  return [errorReportArr copy];
}

+ (void)_clearErrorInfo
{
  NSArray<NSString *> *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:nil];
  for (NSUInteger i = 0; i < files.count; i++) {
    if ([[FBSDKTypeUtility array:files objectAtIndex:i] hasPrefix:@"error_report"]) {
      [[NSFileManager defaultManager] removeItemAtPath:[directoryPath stringByAppendingPathComponent:[FBSDKTypeUtility array:files objectAtIndex:i]] error:nil];
    }
  }
}

+ (void)_saveErrorInfoToDisk:(NSDictionary<NSString *, id> *)errorInfo
{
  if (errorInfo.count > 0) {
    NSData *data = [FBSDKTypeUtility dataWithJSONObject:errorInfo options:0 error:nil];
    [data writeToFile:[self _pathToErrorInfoFile]
           atomically:YES];
  }
}

+ (NSString *)_pathToErrorInfoFile
{
  NSString *timestamp = [NSString stringWithFormat:@"%.0lf", [[NSDate date] timeIntervalSince1970]];
  return [directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"error_report_%@.json", timestamp]];
}

@end
