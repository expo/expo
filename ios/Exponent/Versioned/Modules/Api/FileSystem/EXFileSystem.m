// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXDownloadDelegate.h"
#import "EXFileSystem.h"
#import "EXUtil.h"

#import <CommonCrypto/CommonDigest.h>
#import <React/RCTConvert.h>

#import "EXFileSystemLocalFileHandler.h"
#import "EXFileSystemAssetLibraryHandler.h"

typedef NS_OPTIONS(unsigned int, EXFileSystemPermissionFlags) {
  EXFileSystemPermissionNone = 0,
  EXFileSystemPermissionRead = 1 << 1,
  EXFileSystemPermissionWrite = 1 << 2,
};

NSString * const EXDownloadProgressEventName = @"Exponent.downloadProgress";

@interface EXDownloadResumable : NSObject

@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) EXDownloadDelegate *delegate;

@end

@implementation EXDownloadResumable

- (instancetype)initWithId:(NSString *)uuid
               withSession:(NSURLSession *)session
              withDelegate:(EXDownloadDelegate *)delegate;
  {
    if ((self = [super init])) {
      _uuid = uuid;
      _session = session;
      _delegate = delegate;
    }
    return self;
  }

@end

@interface EXFileSystem ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, EXDownloadResumable*> *downloadObjects;

@end

EX_DEFINE_SCOPED_MODULE_GETTER(EXFileSystem, fileSystem)

@implementation NSData (EXFileSystem)

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

@implementation EXFileSystem

EX_EXPORT_SCOPED_MODULE(ExponentFileSystem, nil);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _documentDirectory = [[self class] documentDirectoryForExperienceId:self.experienceId];
    _cachesDirectory = [[self class] cachesDirectoryForExperienceId:self.experienceId];
    _downloadObjects = [NSMutableDictionary dictionary];
    [EXFileSystem ensureDirExistsWithPath:_documentDirectory];
    [EXFileSystem ensureDirExistsWithPath:_cachesDirectory];
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
  return @[EXDownloadProgressEventName];
}

RCT_REMAP_METHOD(getInfoAsync,
                 getInfoAsyncWithURI:(NSURL *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!([self _permissionsForURI:uri] & EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't readable.", uri],
           nil);
    return;
  }

  if ([uri.scheme isEqualToString:@"file"]) {
    [EXFileSystemLocalFileHandler getInfoForFile:uri withOptions:options resolver:resolve rejecter:reject];
  } else if ([uri.scheme isEqualToString:@"assets-library"]) {
    [EXFileSystemAssetLibraryHandler getInfoForFile:uri withOptions:options resolver:resolve rejecter:reject];
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", uri],
           nil);
  }
}

RCT_REMAP_METHOD(readAsStringAsync,
                 readAsStringAsyncWithURI:(NSURL *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!([self _permissionsForURI:uri] & EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't readable.", uri],
           nil);
    return;
  }

  if ([uri.scheme isEqualToString:@"file"]) {
    NSError *error;
    NSString *string = [NSString stringWithContentsOfFile:uri.path encoding:NSUTF8StringEncoding error:&error];
    if (string) {
      resolve(string);
    } else {
      reject(@"E_FILE_NOT_READ",
             [NSString stringWithFormat:@"File '%@' could not be read.", uri],
             error);
    }
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", uri],
           nil);
  }
}

RCT_REMAP_METHOD(writeAsStringAsync,
                 writeAsStringAsyncWithURI:(NSURL *)uri
                 withString:(NSString *)string
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!([self _permissionsForURI:uri] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't writable.", uri],
           nil);
    return;
  }

  if ([uri.scheme isEqualToString:@"file"]) {
    NSError *error;
    if ([string writeToFile:uri.path atomically:YES encoding:NSUTF8StringEncoding error:&error]) {
      resolve(nil);
    } else {
      reject(@"E_FILE_NOT_WRITTEN",
             [NSString stringWithFormat:@"File '%@' could not be written.", uri],
             error);
    }
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", uri],
           nil);
  }
}

RCT_REMAP_METHOD(deleteAsync,
                 deleteAsyncWithURI:(NSURL *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!([self _permissionsForURI:[uri URLByAppendingPathComponent:@".."]] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"Location '%@' isn't deletable.", uri],
           nil);
    return;
  }

  if ([uri.scheme isEqualToString:@"file"]) {
    NSString *path = uri.path;
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
      NSError *error;
      if ([[NSFileManager defaultManager] removeItemAtPath:path error:&error]) {
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
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", uri],
           nil);
  }
}

RCT_REMAP_METHOD(moveAsync,
                 moveAsyncWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSURL *from = [NSURL URLWithString:options[@"from"]];
  if (!from) {
    reject(@"E_MISSING_PARAMETER", @"Need a `from` location.", nil);
    return;
  }
  if (!([self _permissionsForURI:[from URLByAppendingPathComponent:@".."]] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"Location '%@' isn't movable.", from],
           nil);
    return;
  }
  NSURL *to = [NSURL URLWithString:options[@"to"]];
  if (!to) {
    reject(@"E_MISSING_PARAMETER", @"Need a `to` location.", nil);
    return;
  }
  if (!([self _permissionsForURI:to] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't writable.", to],
           nil);
    return;
  }

  // NOTE: The destination-delete and the move should happen atomically, but we hope for the best for now
  if ([from.scheme isEqualToString:@"file"]) {
    NSString *fromPath = [from.path stringByStandardizingPath];
    NSString *toPath = [to.path stringByStandardizingPath];
    NSError *error;
    if ([[NSFileManager defaultManager] fileExistsAtPath:toPath]) {
      if (![[NSFileManager defaultManager] removeItemAtPath:toPath error:&error]) {
        reject(@"E_FILE_NOT_MOVED",
               [NSString stringWithFormat:@"File '%@' could not be moved to '%@' because a file already exists at "
                "the destination and could not be deleted.", from, to],
               error);
        return;
      }
    }
    if ([[NSFileManager defaultManager] moveItemAtPath:fromPath toPath:toPath error:&error]) {
      resolve(nil);
    } else {
      reject(@"E_FILE_NOT_MOVED",
             [NSString stringWithFormat:@"File '%@' could not be moved to '%@'.", from, to],
             error);
    }
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", from],
           nil);
  }
}

RCT_REMAP_METHOD(copyAsync,
                 copyAsyncWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSURL *from = [NSURL URLWithString:options[@"from"]];
  if (!from) {
    reject(@"E_MISSING_PARAMETER", @"Need a `from` location.", nil);
    return;
  }
  if (!([self _permissionsForURI:from] & EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't readable.", from],
           nil);
    return;
  }
  NSURL *to = [NSURL URLWithString:options[@"to"]];
  if (!to) {
    reject(@"E_MISSING_PARAMETER", @"Need a `to` location.", nil);
    return;
  }
  if (!([self _permissionsForURI:to] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't writable.", to],
           nil);
    return;
  }

  if ([from.scheme isEqualToString:@"file"]) {
    [EXFileSystemLocalFileHandler copyFrom:from to:to resolver:resolve rejecter:reject];
  } else if ([from.scheme isEqualToString:@"assets-library"]) {
    [EXFileSystemAssetLibraryHandler copyFrom:from to:to resolver:resolve rejecter:reject];
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", from],
           nil);
  }
}

RCT_REMAP_METHOD(makeDirectoryAsync,
                 makeDirectoryAsyncWithURI:(NSURL *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!([self _permissionsForURI:uri] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"Directory '%@' could not be created because the location isn't writable.", uri],
           nil);
    return;
  }

  if ([uri.scheme isEqualToString:@"file"]) {
    NSError *error;
    if ([[NSFileManager defaultManager] createDirectoryAtPath:uri.path
                                  withIntermediateDirectories:options[@"intermediates"]
                                                   attributes:nil
                                                        error:&error]) {
      resolve(nil);
    } else {
      reject(@"E_DIRECTORY_NOT_CREATED",
             [NSString stringWithFormat:@"Directory '%@' could not be created.", uri],
             error);
    }
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", uri],
           nil);
  }
}

RCT_REMAP_METHOD(readDirectoryAsync,
                 readDirectoryAsyncWithURI:(NSURL *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!([self _permissionsForURI:uri] & EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"Location '%@' isn't readable.", uri],
           nil);
    return;
  }

  if ([uri.scheme isEqualToString:@"file"]) {
    NSError *error;
    NSArray<NSString *> *children = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:uri.path error:&error];
    if (children) {
      resolve(children);
    } else {
      reject(@"E_DIRECTORY_NOT_READ",
             [NSString stringWithFormat:@"Directory '%@' could not be read.", uri],
             error);
    }
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", uri],
           nil);
  }
}

RCT_REMAP_METHOD(downloadAsync,
                 downloadAsyncWithUrl:(NSURL *)url
                 withLocalURI:(NSURL *)localUri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!([self _permissionsForURI:localUri] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't writable.", localUri],
           nil);
    return;
  }
  NSString *path = localUri.path;

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
    [data writeToFile:path atomically:YES];

    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"uri"] = [NSURL fileURLWithPath:path].absoluteString;
    if (options[@"md5"]) {
      result[@"md5"] = [data md5String];
    }
    result[@"status"] = @([httpResponse statusCode]);
    result[@"headers"] = [httpResponse allHeaderFields];
    resolve(result);
  }];
  [task resume];
}

RCT_REMAP_METHOD(downloadResumableStartAsync,
                 downloadResumableStartAsyncWithUrl:(NSURL *)url
                 withFileURI:(NSString *)fileUri
                 withUUID:(NSString *)uuid
                 withOptions:(NSDictionary *)options
                 withResumeData:(NSString * _Nullable)data
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSURL *localUrl = [NSURL URLWithString:fileUri];
  if (![localUrl.scheme isEqualToString:@"file"]) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"Cannot download to '%@': only 'file://' URI destinations are supported.", fileUri],
           nil);
    return;
  }

  NSString *path = localUrl.path;
  if (!([self _permissionsForPath:path] & EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't writable.", fileUri],
           nil);
    return;
  }

  NSData *resumeData = data ? [RCTConvert NSData:data]:nil;
  [self _downloadResumableCreateSessionWithUrl:url
                               withScopedPath:path
                                     withUUID:uuid
                                  withOptions:options
                               withResumeData:resumeData
                                 withResolver:resolve
                                 withRejecter:reject];
}

RCT_REMAP_METHOD(downloadResumablePauseAsync,
                 downloadResumablePauseAsyncWithUUID:(NSString *)uuid
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  EXDownloadResumable *downloadResumable = (EXDownloadResumable *)self.downloadObjects[uuid];
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

- (void)_downloadResumableCreateSessionWithUrl:(NSURL *)url withScopedPath:(NSString *)scopedPath withUUID:(NSString *)uuid withOptions:(NSDictionary *)options withResumeData:(NSData * _Nullable)resumeData withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject
{
  NSURLSessionConfiguration *sessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
  sessionConfiguration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
  sessionConfiguration.URLCache = nil;

  __weak typeof(self) weakSelf = self;
  EXDownloadDelegate *downloadDelegate = [[EXDownloadDelegate alloc] initWithId:uuid
                                                                        onWrite:^(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite) {
    if(bytesWritten > 0)
      [weakSelf sendEventWithName:EXDownloadProgressEventName
                             body:@{@"uuid":uuid,
                                    @"data":@{
                                        @"totalBytesWritten": @(totalBytesWritten),
                                        @"totalBytesExpectedToWrite": @(totalBytesExpectedToWrite),
                                        },
                                    }];
  } onDownload:^(NSURLSessionDownloadTask *task, NSURL *location) {
    NSURL *scopedLocation = [NSURL fileURLWithPath:scopedPath];
    NSData *locationData = [NSData dataWithContentsOfURL:location];
    [locationData writeToFile:scopedPath atomically:YES];
    NSData *data = [NSData dataWithContentsOfURL:scopedLocation];
    if (!data) {
      reject(@"E_UNABLE_TO_SAVE",
             nil,
             RCTErrorWithMessage(@"Unable to save file to local URI"));
      return;
    }
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

  EXDownloadResumable *downloadResumable = [[EXDownloadResumable alloc] initWithId:uuid
                                                                       withSession:session
                                                                      withDelegate:downloadDelegate];
  self.downloadObjects[downloadResumable.uuid] = downloadResumable;

  NSURLSessionDownloadTask *downloadTask;
  if (resumeData) {
    downloadTask = [session downloadTaskWithResumeData:resumeData];
  } else {
    NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];
    if (options[@"headers"]) {
      NSDictionary *headerDict = (NSDictionary *) [options objectForKey:@"headers"];
      for (NSString *key in headerDict) {
        NSString *value = (NSString *) [headerDict objectForKey:key];
        [request addValue:value forHTTPHeaderField:key];
      }
    }
    downloadTask = [session downloadTaskWithRequest:request];
  }
  [downloadTask resume];
}

- (EXFileSystemPermissionFlags)_permissionsForURI:(NSURL *)uri
{
  if ([uri.scheme isEqualToString:@"assets-library"]) {
    return EXFileSystemPermissionRead;
  }
  if ([uri.scheme isEqualToString:@"file"]) {
    return [self _permissionsForPath:uri.path];
  }
  return EXFileSystemPermissionNone;
}

- (EXFileSystemPermissionFlags)_permissionsForPath:(NSString *)path
{
  path = [path stringByStandardizingPath];
  if ([path hasPrefix:[_documentDirectory stringByAppendingString:@"/"]]) {
    return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
  }
  if ([path isEqualToString:_documentDirectory])  {
    return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
  }
  if ([path hasPrefix:[_cachesDirectory stringByAppendingString:@"/"]]) {
    return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
  }
  if ([path isEqualToString:_cachesDirectory])  {
    return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
  }
  return EXFileSystemPermissionNone;
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
  NSString *subdir = [EXUtil escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  NSString *subdir = [EXUtil escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

@end
