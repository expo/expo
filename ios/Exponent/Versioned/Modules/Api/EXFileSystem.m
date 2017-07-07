// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXFileSystem.h"

#import <CommonCrypto/CommonDigest.h>

#import "EXVersionManager.h"

EX_DEFINE_SCOPED_MODULE(EXFileSystem, fileSystem)

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

RCT_REMAP_METHOD(getInfoAsync,
                 getInfoAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathFromURI:uri];
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

RCT_REMAP_METHOD(readAsStringAsync,
                 readAsStringAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathFromURI:uri];
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

RCT_REMAP_METHOD(writeAsStringAsync,
                 writeAsStringAsyncWithURI:(NSString *)uri
                 withString:(NSString *)string
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathFromURI:uri];
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

RCT_REMAP_METHOD(deleteAsync,
                 deleteAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathFromURI:uri];
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

RCT_REMAP_METHOD(moveAsync,
                 moveAsyncWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!options[@"from"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.moveAsync` needs a `from` path.", nil);
    return;
  }
  if (!options[@"to"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.moveAsync` needs a `to` path.", nil);
    return;
  }

  NSString *from = [self scopedPathFromURI:options[@"from"]];
  if (!from) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", from],
           nil);
    return;
  }

  NSString *to = [self scopedPathFromURI:options[@"to"]];
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

RCT_REMAP_METHOD(copyAsync,
                 copyAsyncWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!options[@"from"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.copyAsync` needs a `from` path.", nil);
    return;
  }
  if (!options[@"to"]) {
    reject(@"E_MISSING_PARAMETER", @"`FileSystem.copyAsync` needs a `to` path.", nil);
    return;
  }

  NSString *from = [self scopedPathFromURI:options[@"from"]];
  if (!from) {
    reject(@"E_INVALID_FILESYSTEM_URI",
           [NSString stringWithFormat:@"Invalid FileSystem URI '%@', make sure it's in the app's scope.", from],
           nil);
    return;
  }

  NSString *to = [self scopedPathFromURI:options[@"to"]];
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

RCT_REMAP_METHOD(makeDirectoryAsync,
                 makeDirectoryAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathFromURI:uri];
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

RCT_REMAP_METHOD(readDirectoryAsync,
                 readDirectoryAsyncWithURI:(NSString *)uri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathFromURI:uri];
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

RCT_REMAP_METHOD(downloadAsync,
                 downloadAsyncWithUrl:(NSURL *)url
                 withLocalURI:(NSString *)localUri
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathFromURI:localUri];
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

    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"uri"] = [NSURL fileURLWithPath:scopedPath].absoluteString;
    if (options[@"md5"]) {
      result[@"md5"] = [data md5String];
    }
    resolve(result);
  }];
  [task resume];
}

- (NSString *)scopedPathFromURI:(NSString *)uri
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
  NSString *subdir = [EXVersionManager escapedResourceName:experienceId];
  return [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
           stringByAppendingPathComponent:@"ExponentExperienceData"]
          stringByAppendingPathComponent:subdir];
}

+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  NSString *subdir = [EXVersionManager escapedResourceName:experienceId];
  return [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
           stringByAppendingPathComponent:@"ExponentExperienceData"]
          stringByAppendingPathComponent:subdir];
}

@end
