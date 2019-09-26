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
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"

#define FBSDK_MAX_ERROR_REPORT_LOGS 1000

@implementation FBSDKErrorReport

static NSString *ErrorReportStorageDirName = @"instrument/";
static NSString *directoryPath;

NSString *const kFBSDKErrorCode = @"error_code";
NSString *const kFBSDKErrorDomain = @"domain";
NSString *const kFBSDKErrorTimestamp = @"timestamp";

# pragma mark - Class Methods

+ (void)initialize
{
  NSString *dirPath = [NSTemporaryDirectory() stringByAppendingPathComponent:ErrorReportStorageDirName];
  if (![[NSFileManager defaultManager] fileExistsAtPath:dirPath]) {
    if (![[NSFileManager defaultManager] createDirectoryAtPath:dirPath withIntermediateDirectories:NO attributes:NULL error:NULL]) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational formatString:@"Failed to create library at %@", dirPath];
    }
  }
  directoryPath = dirPath;
}

+ (void)enable
{
  [self uploadError];
  [FBSDKError enableErrorReport];
}

+ (void)uploadError
{
  NSArray<NSDictionary<NSString *, id> *> *errorReports = [self loadErrorReports];
  if ([errorReports count] == 0) {
    return [self clearErrorInfo];
  }
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:errorReports options:0 error:nil];
  if (!jsonData){
    return;
  }
  NSString *errorData = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@/instruments", [FBSDKSettings appID]]
                                                                 parameters:@{@"error_reports" : errorData ?: @""}
                                                                 HTTPMethod:FBSDKHTTPMethodPOST];

  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (!error && [result isKindOfClass:[NSDictionary class]] && result[@"success"]) {
      [self clearErrorInfo];
    }
  }];
}

+ (void)saveError:(NSInteger)errorCode
      errorDomain:(NSErrorDomain)errorDomain
          message:(nullable NSString *)message
{
  NSString *timestamp = [NSString stringWithFormat:@"%.0lf", [[NSDate date] timeIntervalSince1970]];
  [self saveErrorInfoToDisk: @{
                               kFBSDKErrorCode:@(errorCode),
                               kFBSDKErrorDomain:errorDomain,
                               kFBSDKErrorTimestamp:timestamp,
                               }];
}

+ (NSArray<NSDictionary<NSString *, id> *> *)loadErrorReports
{
  NSMutableArray<NSDictionary<NSString *, id> *> *errorReportArr = [NSMutableArray array];
  NSArray<NSString *> *fileNames = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:NULL];
  NSPredicate *predicate = [NSPredicate predicateWithBlock:^BOOL(id  _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
    NSString *str = (NSString *)evaluatedObject;
    return [str hasPrefix:@"error_report_"] && [str hasSuffix:@".plist"];
  }];
  fileNames = [fileNames filteredArrayUsingPredicate:predicate];
  fileNames = [fileNames sortedArrayUsingComparator:^NSComparisonResult(id _Nonnull obj1, id _Nonnull obj2){
    return [obj2 compare:obj1];
  }];
  if (fileNames.count > 0){
    fileNames = [fileNames subarrayWithRange:NSMakeRange(0, MIN(fileNames.count, FBSDK_MAX_ERROR_REPORT_LOGS))];
    for (NSUInteger i = 0; i < fileNames.count; i++) {
      NSDictionary<NSString *, id> *errorReport =  [NSDictionary dictionaryWithContentsOfFile:[directoryPath stringByAppendingPathComponent:fileNames[i]]];
      if (errorReport) {
        [errorReportArr addObject:errorReport];
      }
    }
  }
  return [errorReportArr copy];
}

+ (void)clearErrorInfo
{
  NSArray<NSString *> *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directoryPath error:nil];
  for (NSUInteger i = 0; i < files.count; i++) {
    if ([files[i] hasPrefix:@"error_report"]) {
      [[NSFileManager defaultManager] removeItemAtPath:[directoryPath stringByAppendingPathComponent:files[i]] error:nil];
    }
  }
}

#pragma mark - disk operations

+ (void)saveErrorInfoToDisk:(NSDictionary<NSString *, id> *)errorInfo
{
  [errorInfo writeToFile:[self pathToErrorInfoFile]
              atomically:YES];
}

+ (NSString *)pathToErrorInfoFile
{
  NSString *timestamp = [NSString stringWithFormat:@"%.0lf", [[NSDate date] timeIntervalSince1970]];
  return [directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"error_report_%@.plist",timestamp]];
}
@end
