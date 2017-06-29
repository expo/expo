// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXFileSystem.h"

#import <CommonCrypto/CommonDigest.h>

#import "EXVersionManager.h"
#import "EXScope.h"

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

@interface EXFileSystem ()

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

@end

@implementation EXFileSystem

+ (NSString *)moduleName { return @"ExponentFileSystem"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelService:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelService:kernelServiceInstance params:params]) {
    NSString *subdir = [EXVersionManager escapedResourceName:self.experienceId];
    _documentDirectory = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
                           stringByAppendingPathComponent:@"ExponentExperienceData"]
                          stringByAppendingPathComponent:subdir];
    _cachesDirectory = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
                         stringByAppendingPathComponent:@"ExponentExperienceData"]
                        stringByAppendingPathComponent:subdir];
  }
  return self;
}

RCT_REMAP_METHOD(getInfoAsync,
                 getInfoAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:filePath withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", filePath],
           nil);
    return;
  }

  BOOL isDirectory;
  if ([[NSFileManager defaultManager] fileExistsAtPath:scopedPath isDirectory:&isDirectory]) {
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"exists"] = @(true);
    result[@"isDirectory"] = @(isDirectory);
    result[@"uri"] = [NSURL fileURLWithPath:scopedPath].absoluteString;
    if (options[@"md5"]) {
      result[@"md5"] = [[NSData dataWithContentsOfFile:scopedPath] md5String];
    }
    resolve(result);
  } else {
    resolve(@{@"exists": @(false), @"isDirectory": @(false)});
  }
}

RCT_REMAP_METHOD(readAsStringAsync,
                 readAsStringAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:filePath withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", filePath],
           nil);
    return;
  }

  NSError *error;
  NSString *string = [NSString stringWithContentsOfFile:scopedPath encoding:NSUTF8StringEncoding error:&error];
  if (string) {
    resolve(string);
  } else {
    reject(@"E_FILE_NOT_READ",
           [NSString stringWithFormat:@"File '%@' could not be read.", filePath],
           error);
  }
}

RCT_REMAP_METHOD(writeAsStringAsync,
                 writeAsStringAsyncWithFilePath:(NSString *)filePath
                 withString:(NSString *)string
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:filePath withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", filePath],
           nil);
  }

  NSError *error;
  if ([string writeToFile:scopedPath atomically:YES encoding:NSUTF8StringEncoding error:&error]) {
    resolve(nil);
  } else {
    reject(@"E_FILE_NOT_WRITTEN",
           [NSString stringWithFormat:@"File '%@' could not be written.", filePath],
           error);
    return;
  }
}

RCT_REMAP_METHOD(deleteAsync,
                 deleteAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:filePath withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", filePath],
           nil);
    return;
  }
  if ([[NSFileManager defaultManager] fileExistsAtPath:scopedPath]) {
    NSError *error;
    if ([[NSFileManager defaultManager] removeItemAtPath:scopedPath error:&error]) {
      resolve(nil);
    } else {
      reject(@"E_FILE_NOT_DELETED",
             [NSString stringWithFormat:@"File '%@' could not be deleted.", filePath],
             error);
    }
  } else {
    if (options[@"idempotent"]) {
      resolve(nil);
    } else {
      reject(@"E_FILE_NOT_FOUND",
             [NSString stringWithFormat:@"File '%@' could not be deleted because it could not be found.", filePath],
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

  NSString *from = [self scopedPathWithPath:options[@"from"] withOptions:options];
  if (!from) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", from],
           nil);
    return;
  }

  NSString *to = [self scopedPathWithPath:options[@"to"] withOptions:options];
  if (!to) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", to],
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

  NSString *from = [self scopedPathWithPath:options[@"from"] withOptions:options];
  if (!from) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", from],
           nil);
    return;
  }

  NSString *to = [self scopedPathWithPath:options[@"to"] withOptions:options];
  if (!to) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", to],
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
                 makeDirectoryAsyncWithPath:(NSString *)path
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:path withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", path],
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
           [NSString stringWithFormat:@"Directory '%@' could not be created.", path],
           error);
  }
}

RCT_REMAP_METHOD(readDirectoryAsync,
                 readDirectoryAsync:(NSString *)path
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:path withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", path],
           nil);
    return;
  }

  NSError *error;
  NSArray<NSString *> *children = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:scopedPath error:&error];
  if (children) {
    resolve(children);
  } else {
    reject(@"E_DIRECTORY_NOT_READ",
           [NSString stringWithFormat:@"Directory '%@' could not be read.", path],
           error);
  }
}

RCT_REMAP_METHOD(downloadAsync,
                 downloadAsyncWithUrl:(NSURL *)url
                 withFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:filePath withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", filePath],
           nil);
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

- (NSString *)scopedPathWithPath:(NSString *)path withOptions:(NSDictionary *)options
{
  NSString *prefix = _documentDirectory;
  if ([options objectForKey:@"cache"] && [[options objectForKey:@"cache"] boolValue]) {
    prefix = _cachesDirectory;
  }
  
  if (![EXFileSystem ensureDirExistsWithPath:prefix]) {
    return nil;
  }
  
  NSString *scopedPath = [[NSString stringWithFormat:@"%@/%@", prefix, path] stringByStandardizingPath];
  if ([scopedPath hasPrefix:[prefix stringByStandardizingPath]]) {
    return scopedPath;
  } else {
    return nil;
  }
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

@end
