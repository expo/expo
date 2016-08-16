// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI8_0_0EXFileSystem.h"

@interface ABI8_0_0EXFileSystem ()

@property (nonatomic, strong) NSString *rootDir;
@property (nonatomic, strong) NSString *cacheDir;

@end

@implementation ABI8_0_0EXFileSystem

+ (NSString *)moduleName { return @"ExponentFileSystem"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  NSString *subdir = [experienceId stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
  if (self = [super init]) {
    _rootDir = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject stringByAppendingPathComponent:@"ExponentExperienceData"] stringByAppendingPathComponent:subdir];
    _cacheDir = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject stringByAppendingPathComponent:@"ExponentExperienceData"] stringByAppendingPathComponent:subdir];
  }
  return self;
}

ABI8_0_0RCT_REMAP_METHOD(downloadAsync,
                 downloadAsyncWithUrl:(NSURL *)url
                 withFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(ABI8_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI8_0_0RCTPromiseRejectBlock)reject)
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
    resolve(@{@"uri": [NSURL fileURLWithPath:scopedPath].absoluteString});
  }];
  [task resume];
}

ABI8_0_0RCT_REMAP_METHOD(getInfoAsync,
                 getInfoAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(ABI8_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI8_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedPath = [self scopedPathWithPath:filePath withOptions:options];
  if (!scopedPath) {
    reject(@"E_INVALID_PATH",
           [NSString stringWithFormat:@"Invalid path '%@', make sure it doesn't doesn't lead outside root.", filePath],
           nil);
  }

  BOOL isDirectory;
  if ([[NSFileManager defaultManager] fileExistsAtPath:scopedPath isDirectory:&isDirectory]) {
    resolve(@{@"exists": @(true), @"isDirectory": @(isDirectory), @"uri": [NSURL fileURLWithPath:scopedPath].absoluteString});
  } else {
    resolve(@{@"exists": @(false), @"isDirectory": @(false)});
  }
}

ABI8_0_0RCT_REMAP_METHOD(deleteAsync,
                 deleteAsyncWithFilePath:(NSString *)filePath
                 withOptions:(NSDictionary *)options
                 resolver:(ABI8_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI8_0_0RCTPromiseRejectBlock)reject)
{
}

- (NSString *)scopedPathWithPath:(NSString *)path withOptions:(NSDictionary *)options
{
  NSString *prefix = _rootDir;
  if ([options objectForKey:@"cache"] && [[options objectForKey:@"cache"] boolValue]) {
    prefix = _cacheDir;
  }

  if (![ABI8_0_0EXFileSystem ensureDirExistsWithPath:prefix]) {
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
