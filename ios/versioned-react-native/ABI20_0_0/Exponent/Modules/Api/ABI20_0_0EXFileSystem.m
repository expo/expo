// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXDownloadDelegate.h"
#import "ABI20_0_0EXFileSystem.h"
#import "ABI20_0_0EXUtil.h"

#import <CommonCrypto/CommonDigest.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>

NSString * const ABI20_0_0EXDownloadProgressEventName = @"Exponent.downloadProgress";

@interface ABI20_0_0EXDownloadResumable : NSObject
  
@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) ABI20_0_0EXDownloadDelegate *delegate;
  
@end

@implementation ABI20_0_0EXDownloadResumable
  
- (instancetype)initWithId:(NSString *)uuid
               withSession:(NSURLSession *)session
              withDelegate:(ABI20_0_0EXDownloadDelegate *)delegate;
  {
    if ((self = [super init])) {
      _uuid = uuid;
      _session = session;
      _delegate = delegate;
    }
    return self;
  }
  
@end

@interface ABI20_0_0EXFileSystem ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, ABI20_0_0EXDownloadResumable*> *downloadObjects;

@end

ABI20_0_0EX_DEFINE_SCOPED_MODULE_GETTER(ABI20_0_0EXFileSystem, fileSystem)

@implementation NSData (ABI20_0_0EXFileSystem)

- (NSString *)md5String
{
  unsigned char digest[CC_MD5_DIGEST_LENGTH];
  CC_MD5(self.bytes, (CC_LONG) self.length, digest);
  NSMutableString *md5 = [NSMutableString stringWithCapacity:2 * CC_MD5_DIGEST_LENGTH];
  for (unsigned int i = 0; i < CC_MD5_DIGEST_LENGTH; ++i) {
    [md5 appendFormat:@"%02x", digest[i]];
  }
  return md5;
}

@end

@implementation ABI20_0_0EXFileSystem

ABI20_0_0EX_EXPORT_SCOPED_MODULE(ExponentFileSystem, nil);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _documentDirectory = [[self class] documentDirectoryForExperienceId:self.experienceId];
    _cachesDirectory = [[self class] cachesDirectoryForExperienceId:self.experienceId];
    _downloadObjects = [NSMutableDictionary dictionary];
    [ABI20_0_0EXFileSystem ensureDirExistsWithPath:_documentDirectory];
    [ABI20_0_0EXFileSystem ensureDirExistsWithPath:_cachesDirectory];
  }
  return self;
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"documentDirectory": [NSURL fileURLWithPath:_documentDirectory].absoluteString,
    @"cacheDirectory": [NSURL fileURLWithPath:_cachesDirectory].absoluteString,
  };
}
  
- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI20_0_0EXDownloadProgressEventName];
}

ABI20_0_0RCT_REMAP_METHOD(getInfoAsync,
                 getInfoAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:uri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", uri],
           nil);
    return;
  }

  BOOL isDirectory;
  if ([[NSFileManager defaultManager] fileExistsAtPath:scopedPath isDirectory:&isDirectory]) {
    NSDictionary *attributes = [[NSFileManager defaultManager] attributesOfItemAtPath:scopedPath error:nil];
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"exists"] = @(true);
    result[@"isDirectory"] = @(isDirectory);
    result[@"uri"] = [NSURL fileURLWithPath:scopedPath].absoluteString;
    if (options[@"md5"]) {
      result[@"md5"] = [[NSData dataWithContentsOfFile:scopedPath] md5String];
    }
    result[@"size"] = attributes[NSFileSize];
    result[@"modificationTime"] = @(attributes.fileModificationDate.timeIntervalSince1970);
    resolve(result);
  } else {
    resolve(@{@"exists": @(false), @"isDirectory": @(false)});
  }
}

ABI20_0_0RCT_REMAP_METHOD(readAsStringAsync,
                 readAsStringAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:uri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", uri],
           nil);
    return;
  }

  NSError *error;
  NSString *string = [NSString stringWithContentsOfFile:scopedPath encoding:NSUTF8StringEncoding error:&error];
  if (string) {
    resolve(string);
  } else {
    reject(@"E_FILE_NOT_READ",
           [NSString stringWithFormat:@"File '%@' could not be read.", uri],
           error);
  }
}

ABI20_0_0RCT_REMAP_METHOD(writeAsStringAsync,
                 writeAsStringAsyncWithURI:(NSString *)uri
                 withString:(NSString *)string
                 withOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:uri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", uri],
           nil);
    return;
  }

  NSError *error;
  if ([string writeToFile:scopedPath atomically:YES encoding:NSUTF8StringEncoding error:&error]) {
    resolve(nil);
  } else {
    reject(@"E_FILE_NOT_WRITTEN",
           [NSString stringWithFormat:@"File '%@' could not be written.", uri],
           error);
  }
}

ABI20_0_0RCT_REMAP_METHOD(deleteAsync,
                 deleteAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:uri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", uri],
           nil);
    return;
  }

  if ([[NSFileManager defaultManager] fileExistsAtPath:scopedPath]) {
    NSError *error;
    if ([[NSFileManager defaultManager] removeItemAtPath:scopedPath error:&error]) {
      resolve(nil);
    } else {
      reject(@"E_FILE_NOT_DELETED",
             [NSString stringWithFormat:@"File '%@' could not be deleted.", uri],
             error);
    }
  } else {
    if (options[@"idempotent"]) {
      resolve(nil);
    } else {
      reject(@"E_FILE_NOT_FOUND",
             [NSString stringWithFormat:@"File '%@' could not be deleted because it could not be found.", uri],
             nil);
    }
  }
}

ABI20_0_0RCT_REMAP_METHOD(moveAsync,
                 moveAsyncWithOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  if (!options[@"from"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.moveAsync` needs a `from` path.", nil);
    return;
  }
  if (!options[@"to"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.moveAsync` needs a `to` path.", nil);
    return;
  }

  NSString *from = [self _scopedPathFromURI:options[@"from"]];
  if (!from) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", from],
           nil);
    return;
  }

  NSString *to = [self _scopedPathFromURI:options[@"to"]];
  if (!to) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", to],
           nil);
    return;
  }

  // NOTE: The destination-delete and the move should happen atomically, but we hope for the best for now
  NSError *error;
  if ([[NSFileManager defaultManager] fileExistsAtPath:to]) {
    if (![[NSFileManager defaultManager] removeItemAtPath:to error:&error]) {
      reject(@"E_FILE_NOT_MOVED",
             [NSString stringWithFormat:@"File '%@' could not be moved to '%@' because a file already exists at "
              "the destination and could not be deleted.", from, to],
             error);
      return;
    }
  }
  if ([[NSFileManager defaultManager] moveItemAtPath:from toPath:to error:&error]) {
    resolve(nil);
  } else {
    reject(@"E_FILE_NOT_MOVED",
           [NSString stringWithFormat:@"File '%@' could not be moved to '%@'.", from, to],
           error);
  }
}

ABI20_0_0RCT_REMAP_METHOD(copyAsync,
                 copyAsyncWithOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  if (!options[@"from"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.copyAsync` needs a `from` path.", nil);
    return;
  }
  if (!options[@"to"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.copyAsync` needs a `to` path.", nil);
    return;
  }

  NSString *from = [self _scopedPathFromURI:options[@"from"]];
  if (!from) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", from],
           nil);
    return;
  }

  NSString *to = [self _scopedPathFromURI:options[@"to"]];
  if (!to) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", to],
           nil);
    return;
  }

  // NOTE: The destination-delete and the copy should happen atomically, but we hope for the best for now
  NSError *error;
  if ([[NSFileManager defaultManager] fileExistsAtPath:to]) {
    if (![[NSFileManager defaultManager] removeItemAtPath:to error:&error]) {
      reject(@"E_FILE_NOT_MOVED",
             [NSString stringWithFormat:@"File '%@' could not be copied to '%@' because a file already exists at "
              "the destination and could not be deleted.", from, to],
             error);
      return;
    }
  }
  if ([[NSFileManager defaultManager] copyItemAtPath:from toPath:to error:&error]) {
    resolve(nil);
  } else {
    reject(@"E_FILE_NOT_MOVED",
           [NSString stringWithFormat:@"File '%@' could not be copied to '%@'.", from, to],
           error);
  }
}

ABI20_0_0RCT_REMAP_METHOD(makeDirectoryAsync,
                 makeDirectoryAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:uri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", uri],
           nil);
    return;
  }

  NSError *error;
  if ([[NSFileManager defaultManager] createDirectoryAtPath:scopedPath
                                withIntermediateDirectories:options[@"intermediates"]
                                                 attributes:nil
                                                      error:&error]) {
    resolve(nil);
  } else {
    reject(@"E_DIRECTORY_NOT_CREATED",
           [NSString stringWithFormat:@"Directory '%@' could not be created.", uri],
           error);
  }
}

ABI20_0_0RCT_REMAP_METHOD(readDirectoryAsync,
                 readDirectoryAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:uri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", uri],
           nil);
    return;
  }

  NSError *error;
  NSArray<NSString *> *children = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:scopedPath error:&error];
  if (children) {
    resolve(children);
  } else {
    reject(@"E_DIRECTORY_NOT_READ",
           [NSString stringWithFormat:@"Directory '%@' could not be read.", uri],
           error);
  }
}

ABI20_0_0RCT_REMAP_METHOD(downloadAsync,
                 downloadAsyncWithUrl:(NSURL *)url
                 withLocalURI:(NSString *)localUri
                 withOptions:(NSDictionary *)options
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:localUri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", localUri],
           nil);
    return;
  }

  NSURLSessionConfiguration *sessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
  sessionConfiguration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
  sessionConfiguration.URLCache = nil;
  NSURLSession *session = [NSURLSession sessionWithConfiguration:sessionConfiguration];
  NSURLSessionDataTask *task = [session dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (error) {
      reject(@"E_DOWNLOAD_FAILED",
             [NSString stringWithFormat:@"Could not download from '%@'", url],
             error);
      return;
    }
    [data writeToFile:scopedPath atomically:YES];

    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"uri"] = [NSURL fileURLWithPath:scopedPath].absoluteString;
    if (options[@"md5"]) {
      result[@"md5"] = [data md5String];
    }
    result[@"status"] = @([httpResponse statusCode]);
    result[@"headers"] = [httpResponse allHeaderFields];
    resolve(result);
  }];
  [task resume];
}

ABI20_0_0RCT_REMAP_METHOD(downloadResumableStartAsync,
                 downloadResumableStartAsyncWithUrl:(NSURL *)url
                 withFileURI:(NSString *)fileUri
                 withUUID:(NSString *)uuid
                 withOptions:(NSDictionary *)options
                 withResumeData:(NSString * _Nullable)data
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self _scopedPathFromURI:fileUri];
  if (!scopedPath) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", fileUri],
           nil);
    return;
  }
  
  NSData *resumeData = data ? [ABI20_0_0RCTConvert NSData:data]:nil;
  [self _downloadResumableCreateSessionWithUrl:url
                               withScopedPath:scopedPath
                                     withUUID:uuid
                                  withOptions:options
                               withResumeData:resumeData
                                 withResolver:resolve
                                 withRejecter:reject];
}

ABI20_0_0RCT_REMAP_METHOD(downloadResumablePauseAsync,
                 downloadResumablePauseAsyncWithUUID:(NSString *)uuid
                 resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  ABI20_0_0EXDownloadResumable *downloadResumable = (ABI20_0_0EXDownloadResumable *)self.downloadObjects[uuid];
  if (downloadResumable == nil) {
    reject(@"E_UNABLE_TO_PAUSE",
           [NSString stringWithFormat:@"There is no download object with UUID: %@", uuid],
           nil);
  } else {
    [downloadResumable.session getTasksWithCompletionHandler:^(NSArray<NSURLSessionDataTask *> * _Nonnull dataTasks, NSArray<NSURLSessionUploadTask *> * _Nonnull uploadTasks, NSArray<NSURLSessionDownloadTask *> * _Nonnull downloadTasks) {
      NSURLSessionDownloadTask *downloadTask = [downloadTasks firstObject];
      if (downloadTask) {
        [downloadTask cancelByProducingResumeData:^(NSData * _Nullable resumeData) {
          NSString *data = [[NSString alloc] initWithData:resumeData encoding:NSUTF8StringEncoding];
          resolve(@{@"resumeData":data});
        }];
      } else {
        reject(@"E_UNABLE_TO_PAUSE",
               @"There was an error producing resume data",
               nil);
      }
    }];
  }
}
  
#pragma mark - Internal methods

- (void)_downloadResumableCreateSessionWithUrl:(NSURL *)url withScopedPath:(NSString *)scopedPath withUUID:(NSString *)uuid withOptions:(NSDictionary *)options withResumeData:(NSData * _Nullable)resumeData withResolver:(ABI20_0_0RCTPromiseResolveBlock)resolve withRejecter:(ABI20_0_0RCTPromiseRejectBlock)reject
{
  NSURLSessionConfiguration *sessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
  sessionConfiguration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
  sessionConfiguration.URLCache = nil;
  
  __weak typeof(self) weakSelf = self;
  ABI20_0_0EXDownloadDelegate *downloadDelegate = [[ABI20_0_0EXDownloadDelegate alloc] initWithId:uuid
                                                                        onWrite:^(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite) {
    if(bytesWritten > 0)
      [weakSelf sendEventWithName:ABI20_0_0EXDownloadProgressEventName
                             body:@{@"UUID":uuid,
                                    @"data":@{
                                        @"totalBytesWritten": @(totalBytesWritten),
                                        @"totalBytesExpectedToWrite": @(totalBytesExpectedToWrite),
                                        },
                                    }];
  } onDownload:^(NSURLSessionDownloadTask *task, NSURL *location) {
    NSURL *scopedLocation = [NSURL fileURLWithPath:scopedPath];
    NSError *error;
    [[NSFileManager defaultManager] moveItemAtURL:location
                                            toURL:scopedLocation
                                            error:&error];
    if (error != nil) {
        reject(@"E_UNABLE_TO_SAVE",
               @"Unable to save file to local uri",
               error);
    } else {
      NSData *data = [NSData dataWithContentsOfURL:scopedLocation];
      NSMutableDictionary *result = [NSMutableDictionary dictionary];
      result[@"uri"] = scopedLocation.absoluteString;
      result[@"complete"] = @(YES);
            if (options[@"md5"]) {
        result[@"md5"] = [data md5String];
      }
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)task.response;
      result[@"status"] = @([httpResponse statusCode]);
      result[@"headers"] = [httpResponse allHeaderFields];
      
      [self.downloadObjects removeObjectForKey:uuid];
      
      resolve(result);
    }
  } onError:^(NSError *error) {
    //"cancelled" description when paused.  Don't throw.
    if ([error.localizedDescription isEqualToString:@"cancelled"]) {
      [self.downloadObjects removeObjectForKey:uuid];
      resolve(nil);
    } else {
      reject(@"E_UNABLE_TO_DOWNLOAD",
             [NSString stringWithFormat:@"Unable to download from: %@", url.absoluteString],
             error);
    }
  }];
  
  NSURLSession *session = [NSURLSession sessionWithConfiguration:sessionConfiguration
                                                        delegate:downloadDelegate
                                                   delegateQueue:[NSOperationQueue mainQueue]];
  
  ABI20_0_0EXDownloadResumable *downloadResumable = [[ABI20_0_0EXDownloadResumable alloc] initWithId:uuid
                                                                       withSession:session
                                                                      withDelegate:downloadDelegate];
  self.downloadObjects[downloadResumable.uuid] = downloadResumable;
  
  NSURLSessionDownloadTask *downloadTask;
  if (resumeData) {
    downloadTask = [session downloadTaskWithResumeData:resumeData];
  } else {
    downloadTask = [session downloadTaskWithURL:url];
  }
  [downloadTask resume];
}

- (NSString *)_scopedPathFromURI:(NSString *)uri
{
  NSString *path = [[NSURL URLWithString:uri].path stringByStandardizingPath];
  if (!path) {
    return nil;
  }
  if ([path hasPrefix:[_documentDirectory stringByStandardizingPath]] ||
      [path hasPrefix:[_cachesDirectory stringByStandardizingPath]]) {
    return path;
  }
  return nil;
}
  
#pragma mark - Class methods

+ (BOOL)ensureDirExistsWithPath:(NSString *)path
{
  BOOL isDir = NO;
  NSError *error;
  BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:path isDirectory:&isDir];
  if (!(exists && isDir)) {
    [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:&error];
    if (error) {
      return NO;
    }
  }
  return YES;
}

+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId
{
  NSString *subdir = [ABI20_0_0EXUtil escapedResourceName:experienceId];
  return [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
           stringByAppendingPathComponent:@"ExponentExperienceData"]
          stringByAppendingPathComponent:subdir];
}

+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  NSString *subdir = [ABI20_0_0EXUtil escapedResourceName:experienceId];
  return [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
           stringByAppendingPathComponent:@"ExponentExperienceData"]
          stringByAppendingPathComponent:subdir];
}

@end
