// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI15_0_0EXFileSystem.h"

#import <CommonCrypto/CommonDigest.h>

#import "ABI15_0_0EXVersionManager.h"
#import "ABI15_0_0EXScope.h"

@implementation NSData (ABI15_0_0EXFileSystem)

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

@implementation ABI15_0_0EXFileSystem

ABI15_0_0RCT_EXPORT_MODULE(ExponentFileSystem);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI15_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

ABI15_0_0RCT_REMAP_METHOD(downloadAsync,
                 downloadAsyncWithUrl:(NSURL *)url
                 withFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI15_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self.bridge.experienceScope scopedPathWithPath:filePath withOptions:options];
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

ABI15_0_0RCT_REMAP_METHOD(getInfoAsync,
                 getInfoAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI15_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self.bridge.experienceScope scopedPathWithPath:filePath withOptions:options];
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
      result[@"md5"] = [[NSData dataWithContentsOfFile:scopedPath] md5String];
    }
    resolve(result);
  } else {
    resolve(@{@"exists": @(false), @"isDirectory": @(false)});
  }
}

ABI15_0_0RCT_REMAP_METHOD(deleteAsync,
                 deleteAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI15_0_0RCTPromiseRejectBlock)reject)
{
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
