// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXFileSystem.h"

#import <CommonCrypto/CommonDigest.h>

#import "EXVersionManager.h"

@interface EXFileSystem ()

@property (nonatomic, strong) NSString *rootDir;
@property (nonatomic, strong) NSString *cacheDir;

@end

@implementation EXFileSystem

+ (NSString *)moduleName { return @"ExponentFileSystem"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    NSString *subdir = [EXVersionManager escapedResourceName:experienceId];
    _rootDir = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject stringByAppendingPathComponent:@"ExponentExperienceData"] stringByAppendingPathComponent:subdir];
    _cacheDir = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject stringByAppendingPathComponent:@"ExponentExperienceData"] stringByAppendingPathComponent:subdir];
  }
  return self;
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
      result[@"md5"] = [EXFileSystem md5WithPath:scopedPath];
    }
    resolve(result);
  }];
  [task resume];
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
  }

  BOOL isDirectory;
  if ([[NSFileManager defaultManager] fileExistsAtPath:scopedPath isDirectory:&isDirectory]) {
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"exists"] = @(true);
    result[@"isDirectory"] = @(isDirectory);
    result[@"uri"] = [NSURL fileURLWithPath:scopedPath].absoluteString;
    if (options[@"md5"]) {
      result[@"md5"] = [EXFileSystem md5WithPath:scopedPath];
    }
    resolve(result);
  } else {
    resolve(@{@"exists": @(false), @"isDirectory": @(false)});
  }
}

RCT_REMAP_METHOD(deleteAsync,
                 deleteAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
}

// Utility functions that take scoped paths

- (NSString *)scopedPathWithPath:(NSString *)path withOptions:(NSDictionary *)options
{
  NSString *prefix = _rootDir;
  if ([options objectForKey:@"cache"] && [[options objectForKey:@"cache"] boolValue]) {
    prefix = _cacheDir;
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

// Utility functions that take unscoped paths

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

+ (NSString *)md5WithPath:(NSString *)path
{
  NSData *data = [NSData dataWithContentsOfFile:path];
  unsigned char digest[CC_MD5_DIGEST_LENGTH];
  CC_MD5(data.bytes, (CC_LONG) data.length, digest);
  NSMutableString *md5 = [NSMutableString stringWithCapacity:2 * CC_MD5_DIGEST_LENGTH];
  for (unsigned int i = 0; i < CC_MD5_DIGEST_LENGTH; ++i) {
    [md5 appendFormat:@"%02x", digest[i]];
  }
  return md5;
}

@end
