// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>

#import <ABI30_0_0EXFileSystem/ABI30_0_0EXDownloadDelegate.h>
#import <ABI30_0_0EXFileSystem/ABI30_0_0EXFileSystem.h>
#import <ABI30_0_0EXFileSystem/ABI30_0_0EXFileSystemManagerService.h>

#import <CommonCrypto/CommonDigest.h>

#import <ABI30_0_0EXFileSystem/ABI30_0_0EXFileSystemLocalFileHandler.h>
#import <ABI30_0_0EXFileSystem/ABI30_0_0EXFileSystemAssetLibraryHandler.h>

#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemInterface.h>
#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemManagerInterface.h>

#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitterService.h>

NSString * const ABI30_0_0EXDownloadProgressEventName = @"Exponent.downloadProgress";

@interface ABI30_0_0EXDownloadResumable : NSObject

@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) ABI30_0_0EXDownloadDelegate *delegate;

@end

@implementation ABI30_0_0EXDownloadResumable

- (instancetype)initWithId:(NSString *)uuid
               withSession:(NSURLSession *)session
              withDelegate:(ABI30_0_0EXDownloadDelegate *)delegate;
{
  if ((self = [super init])) {
    _uuid = uuid;
    _session = session;
    _delegate = delegate;
  }
  return self;
}

@end

@interface ABI30_0_0EXFileSystem ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, ABI30_0_0EXDownloadResumable*> *downloadObjects;
@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI30_0_0EXEventEmitterService> eventEmitter;
@property (nonatomic, weak) id<ABI30_0_0EXFileSystemManager> fileSystemManager;

@end

@implementation NSData (ABI30_0_0EXFileSystem)

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

@implementation ABI30_0_0EXFileSystem

ABI30_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExponentFileSystem";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI30_0_0EXFileSystemInterface)];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _documentDirectory = [self documentDirectoryForExperienceId:experienceId];
    _cachesDirectory = [self cachesDirectoryForExperienceId:experienceId];
    _downloadObjects = [NSMutableDictionary dictionary];
    [ABI30_0_0EXFileSystem ensureDirExistsWithPath:_documentDirectory];
    [ABI30_0_0EXFileSystem ensureDirExistsWithPath:_cachesDirectory];
  }
  return self;
}

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXEventEmitterService)];
  _fileSystemManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXFileSystemManager)];
}

- (NSDictionary *)constantsToExport
{
  NSString *bundleDirectory = [_fileSystemManager bundleDirectoryForExperienceId:_moduleRegistry.experienceId];
  return @{
           @"documentDirectory": [NSURL fileURLWithPath:_documentDirectory].absoluteString,
           @"cacheDirectory": [NSURL fileURLWithPath:_cachesDirectory].absoluteString,
           @"bundleDirectory":  bundleDirectory != nil ? [NSURL fileURLWithPath:bundleDirectory].absoluteString : [NSNull null],
           @"bundledAssets": [_fileSystemManager bundledAssetsForExperienceId:_moduleRegistry.experienceId] ?: [NSNull null],
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI30_0_0EXDownloadProgressEventName];
}

- (void)startObserving {
  
}


- (void)stopObserving {
  
}


ABI30_0_0EX_EXPORT_METHOD_AS(getInfoAsync,
                    getInfoAsyncWithURI:(NSString *)uriString
                    withOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *uri = [NSURL URLWithString:uriString];
  if (!([self permissionsForURI:uri] & ABI30_0_0EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't readable.", uri],
           nil);
    return;
  }
  
  if ([uri.scheme isEqualToString:@"file"]) {
    [ABI30_0_0EXFileSystemLocalFileHandler getInfoForFile:uri withOptions:options resolver:resolve rejecter:reject];
  } else if ([uri.scheme isEqualToString:@"assets-library"]) {
    [ABI30_0_0EXFileSystemAssetLibraryHandler getInfoForFile:uri withOptions:options resolver:resolve rejecter:reject];
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", uri],
           nil);
  }
}

ABI30_0_0EX_EXPORT_METHOD_AS(readAsStringAsync,
                    readAsStringAsyncWithURI:(NSString *)uriString
                    withOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *uri = [NSURL URLWithString:uriString];
  if (!([self permissionsForURI:uri] & ABI30_0_0EXFileSystemPermissionRead)) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(writeAsStringAsync,
                    writeAsStringAsyncWithURI:(NSString *)uriString
                    withString:(NSString *)string
                    withOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *uri = [NSURL URLWithString:uriString];
  if (!([self permissionsForURI:uri] & ABI30_0_0EXFileSystemPermissionWrite)) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(deleteAsync,
                    deleteAsyncWithURI:(NSString *)uriString
                    withOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *uri = [NSURL URLWithString:uriString];
  if (!([self permissionsForURI:[uri URLByAppendingPathComponent:@".."]] & ABI30_0_0EXFileSystemPermissionWrite)) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(moveAsync,
                    moveAsyncWithOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *from = [NSURL URLWithString:options[@"from"]];
  if (!from) {
    reject(@"E_MISSING_PARAMETER", @"Need a `from` location.", nil);
    return;
  }
  if (!([self permissionsForURI:[from URLByAppendingPathComponent:@".."]] & ABI30_0_0EXFileSystemPermissionWrite)) {
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
  if (!([self permissionsForURI:to] & ABI30_0_0EXFileSystemPermissionWrite)) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(copyAsync,
                    copyAsyncWithOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *from = [NSURL URLWithString:options[@"from"]];
  if (!from) {
    reject(@"E_MISSING_PARAMETER", @"Need a `from` location.", nil);
    return;
  }
  if (!([self permissionsForURI:from] & ABI30_0_0EXFileSystemPermissionRead)) {
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
  if (!([self permissionsForURI:to] & ABI30_0_0EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't writable.", to],
           nil);
    return;
  }
  
  if ([from.scheme isEqualToString:@"file"]) {
    [ABI30_0_0EXFileSystemLocalFileHandler copyFrom:from to:to resolver:resolve rejecter:reject];
  } else if ([from.scheme isEqualToString:@"assets-library"]) {
    [ABI30_0_0EXFileSystemAssetLibraryHandler copyFrom:from to:to resolver:resolve rejecter:reject];
  } else {
    reject(@"E_FILESYSTEM_INVALID_URI",
           [NSString stringWithFormat:@"Unsupported URI scheme for '%@'", from],
           nil);
  }
}

ABI30_0_0EX_EXPORT_METHOD_AS(makeDirectoryAsync,
                    makeDirectoryAsyncWithURI:(NSString *)uriString
                    withOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  
  NSURL *uri = [NSURL URLWithString:uriString];
  if (!([self permissionsForURI:uri] & ABI30_0_0EXFileSystemPermissionWrite)) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(readDirectoryAsync,
                    readDirectoryAsyncWithURI:(NSString *)uriString
                    withOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *uri = [NSURL URLWithString:uriString];
  if (!([self permissionsForURI:uri] & ABI30_0_0EXFileSystemPermissionRead)) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(downloadAsync,
                    downloadAsyncWithUrl:(NSString *)uriString
                    withLocalURI:(NSString *)localUriString
                    withOptions:(NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:uriString];
  NSURL *localUri = [NSURL URLWithString:localUriString];
  if (!([self permissionsForURI:localUri] & ABI30_0_0EXFileSystemPermissionWrite)) {
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

ABI30_0_0EX_EXPORT_METHOD_AS(downloadResumableStartAsync,
                    downloadResumableStartAsyncWithUrl:(NSString *)urlString
                    withFileURI:(NSString *)fileUri
                    withUUID:(NSString *)uuid
                    withOptions:(NSDictionary *)options
                    withResumeData:(NSString *)data
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:urlString];
  NSURL *localUrl = [NSURL URLWithString:fileUri];
  if (![localUrl.scheme isEqualToString:@"file"]) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"Cannot download to '%@': only 'file://' URI destinations are supported.", fileUri],
           nil);
    return;
  }
  
  NSString *path = localUrl.path;
  if (!([self _permissionsForPath:path] & ABI30_0_0EXFileSystemPermissionWrite)) {
    reject(@"E_FILESYSTEM_PERMISSIONS",
           [NSString stringWithFormat:@"File '%@' isn't writable.", fileUri],
           nil);
    return;
  }
  
  NSData *resumeData = data ? [data dataUsingEncoding:NSUTF8StringEncoding] : nil;
  [self _downloadResumableCreateSessionWithUrl:url
                                withScopedPath:path
                                      withUUID:uuid
                                   withOptions:options
                                withResumeData:resumeData
                                  withResolver:resolve
                                  withRejecter:reject];
}

ABI30_0_0EX_EXPORT_METHOD_AS(downloadResumablePauseAsync,
                    downloadResumablePauseAsyncWithUUID:(NSString *)uuid
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  ABI30_0_0EXDownloadResumable *downloadResumable = (ABI30_0_0EXDownloadResumable *)self.downloadObjects[uuid];
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

- (void)_downloadResumableCreateSessionWithUrl:(NSURL *)url withScopedPath:(NSString *)scopedPath withUUID:(NSString *)uuid withOptions:(NSDictionary *)options withResumeData:(NSData * _Nullable)resumeData withResolver:(ABI30_0_0EXPromiseResolveBlock)resolve withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  NSURLSessionConfiguration *sessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
  sessionConfiguration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
  sessionConfiguration.URLCache = nil;
  
  __weak typeof(self) weakSelf = self;
  ABI30_0_0EXDownloadDelegateOnWriteCallback onWrite = ^(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite) {
    __strong ABI30_0_0EXFileSystem *strongSelf = weakSelf;
    if (strongSelf && bytesWritten > 0) {
      [strongSelf sendEventWithName:ABI30_0_0EXDownloadProgressEventName
                               body:@{@"uuid":uuid,
                                      @"data":@{
                                          @"totalBytesWritten": @(totalBytesWritten),
                                          @"totalBytesExpectedToWrite": @(totalBytesExpectedToWrite),
                                          },
                                      }];
    }
  };
  
  ABI30_0_0EXDownloadDelegateOnDownloadCallback onDownload = ^(NSURLSessionDownloadTask *task, NSURL *location) {
    NSURL *scopedLocation = [NSURL fileURLWithPath:scopedPath];
    NSData *locationData = [NSData dataWithContentsOfURL:location];
    [locationData writeToFile:scopedPath atomically:YES];
    NSData *data = [NSData dataWithContentsOfURL:scopedLocation];
    if (!data) {
      reject(@"E_UNABLE_TO_SAVE",
             @"Unable to save file to local URI",
             nil);
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
    
    __strong ABI30_0_0EXFileSystem *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.downloadObjects removeObjectForKey:uuid];
    }
    
    resolve(result);
  };
  
  ABI30_0_0EXDownloadDelegateOnErrorCallback onError = ^(NSError *error) {
    //"cancelled" description when paused.  Don't throw.
    if ([error.localizedDescription isEqualToString:@"cancelled"]) {
      __strong ABI30_0_0EXFileSystem *strongSelf = weakSelf;
      if (strongSelf) {
        [strongSelf.downloadObjects removeObjectForKey:uuid];
      }
      resolve(nil);
    } else {
      reject(@"E_UNABLE_TO_DOWNLOAD",
             [NSString stringWithFormat:@"Unable to download from: %@", url.absoluteString],
             error);
    }
  };
  
  
  ABI30_0_0EXDownloadDelegate *downloadDelegate = [[ABI30_0_0EXDownloadDelegate alloc] initWithId:uuid
                                                                        onWrite:onWrite
                                                                     onDownload:onDownload
                                                                        onError:onError];
  
  NSURLSession *session = [NSURLSession sessionWithConfiguration:sessionConfiguration
                                                        delegate:downloadDelegate
                                                   delegateQueue:[NSOperationQueue mainQueue]];
  
  ABI30_0_0EXDownloadResumable *downloadResumable = [[ABI30_0_0EXDownloadResumable alloc] initWithId:uuid
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

- (ABI30_0_0EXFileSystemPermissionFlags)_permissionsForPath:(NSString *)path
{
  path = [path stringByStandardizingPath];
  if ([path hasPrefix:[_documentDirectory stringByAppendingString:@"/"]]) {
    return ABI30_0_0EXFileSystemPermissionRead | ABI30_0_0EXFileSystemPermissionWrite;
  }
  if ([path isEqualToString:_documentDirectory])  {
    return ABI30_0_0EXFileSystemPermissionRead | ABI30_0_0EXFileSystemPermissionWrite;
  }
  if ([path hasPrefix:[_cachesDirectory stringByAppendingString:@"/"]]) {
    return ABI30_0_0EXFileSystemPermissionRead | ABI30_0_0EXFileSystemPermissionWrite;
  }
  if ([path isEqualToString:_cachesDirectory])  {
    return ABI30_0_0EXFileSystemPermissionRead | ABI30_0_0EXFileSystemPermissionWrite;
  }
  NSString *bundleDirectory = [_fileSystemManager bundleDirectoryForExperienceId:_moduleRegistry.experienceId];
  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return ABI30_0_0EXFileSystemPermissionRead;
  }
  return ABI30_0_0EXFileSystemPermissionNone;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  if (_eventEmitter != nil) {
    [_eventEmitter sendEventWithName:eventName body:body];
  }
}

#pragma mark - Public utils

- (ABI30_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri
{
  if ([uri.scheme isEqualToString:@"assets-library"]) {
    return ABI30_0_0EXFileSystemPermissionRead;
  }
  if ([uri.scheme isEqualToString:@"file"]) {
    return [self _permissionsForPath:uri.path];
  }
  return ABI30_0_0EXFileSystemPermissionNone;
}

#pragma mark - Class methods

- (BOOL)ensureDirExistsWithPath:(NSString *)path
{
  return [ABI30_0_0EXFileSystem ensureDirExistsWithPath:path];
}

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

- (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId
{
  return [ABI30_0_0EXFileSystem documentDirectoryForExperienceId:experienceId];
}

+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId
{
  NSString *subdir = [self escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

- (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  return [ABI30_0_0EXFileSystem cachesDirectoryForExperienceId:experienceId];
}

+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  NSString *subdir = [self escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension
{
  return [ABI30_0_0EXFileSystem generatePathInDirectory:directory withExtension:extension];
}


+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension
{
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:extension];
  [ABI30_0_0EXFileSystem ensureDirExistsWithPath:directory];
  return [directory stringByAppendingPathComponent:fileName];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}


@end
