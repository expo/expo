// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFileDownloader.h"
#import "EXVersions.h"
#import "EXKernelUtil.h"

#import <React/RCTUtils.h>

@import UIKit;

#import <sys/utsname.h>

NSString * const EXNetworkErrorDomain = @"EXNetwork";
NSTimeInterval const EXFileDownloaderDefaultTimeoutInterval = 60;

@interface EXFileDownloader () <NSURLSessionDataDelegate>
@end

@implementation EXFileDownloader

- (instancetype)init
{
  if (self = [super init]) {
    _timeoutInterval = EXFileDownloaderDefaultTimeoutInterval;
  }
  return self;
}

- (void)downloadFileFromURL:(NSURL *)url
                     successBlock:(EXFileDownloaderSuccessBlock)successBlock
                       errorBlock:(EXFileDownloaderErrorBlock)errorBlock
{
  NSURLSessionConfiguration *configuration = _urlSessionConfiguration ?: [NSURLSessionConfiguration defaultSessionConfiguration];
  
  // also pass any custom cache policy onto this specific request
  NSURLRequestCachePolicy cachePolicy = _urlSessionConfiguration ? _urlSessionConfiguration.requestCachePolicy : NSURLRequestUseProtocolCachePolicy;
  
  NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url cachePolicy:cachePolicy timeoutInterval:_timeoutInterval];
  [self setHTTPHeaderFields:request];
  
  __weak typeof(self) weakSelf = self;
  NSURLSessionDataTask *task = [session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (!error && [response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      if (httpResponse.statusCode != 200) {
        NSStringEncoding encoding = [weakSelf _encodingFromResponse:response];
        NSString *body = [[NSString alloc] initWithData:data encoding:encoding];
        error = [weakSelf _errorFromResponse:httpResponse body:body];
      }
    }

    if (error) {
      errorBlock(error, response);
    } else {
      successBlock(data, response);
    }
  }];
  [task resume];
  [session finishTasksAndInvalidate];
}

#pragma mark - Configuring the request

- (void)setHTTPHeaderFields:(NSMutableURLRequest *)request
{
  [request setValue:[self _userAgentString] forHTTPHeaderField:@"User-Agent"];
  
  NSString *version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  [request setValue:version forHTTPHeaderField:@"Exponent-Version"];
  NSString *requestAbiVersion;
  if (_abiVersion) {
    requestAbiVersion = _abiVersion;
  } else {
    NSArray *versionsAvailable = [EXVersions sharedInstance].versions[@"sdkVersions"];
    if (versionsAvailable) {
      requestAbiVersion = [versionsAvailable componentsJoinedByString:@","];
    } else {
      requestAbiVersion = [EXVersions sharedInstance].temporarySdkVersion;
    }
  }
  NSString *releaseChannel;
  if (_releaseChannel) {
    releaseChannel = _releaseChannel;
  } else {
    releaseChannel = @"default";
  }
  [request setValue:releaseChannel forHTTPHeaderField:@"Expo-Release-Channel"];
  [request setValue:requestAbiVersion forHTTPHeaderField:@"Exponent-SDK-Version"];
  [request setValue:@"ios" forHTTPHeaderField:@"Exponent-Platform"];
  [request setValue:@"true" forHTTPHeaderField:@"Exponent-Accept-Signature"];
}

- (NSString *)_userAgentString
{
  struct utsname systemInfo;
  uname(&systemInfo);
  NSString *deviceModel = [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];
  return [NSString stringWithFormat:@"Exponent/%@ (%@; %@ %@; Scale/%.2f; %@)",
          [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"],
          deviceModel,
          [UIDevice currentDevice].systemName,
          [UIDevice currentDevice].systemVersion,
          [UIScreen mainScreen].scale,
          [NSLocale autoupdatingCurrentLocale].localeIdentifier];
}

#pragma mark - NSURLSessionTaskDelegate

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task willPerformHTTPRedirection:(NSHTTPURLResponse *)response newRequest:(NSURLRequest *)request completionHandler:(void (^)(NSURLRequest *))completionHandler
{
  completionHandler(request);
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask willCacheResponse:(NSCachedURLResponse *)proposedResponse completionHandler:(void (^)(NSCachedURLResponse *cachedResponse))completionHandler
{
  completionHandler(proposedResponse);
}

#pragma mark - Parsing the response

- (NSStringEncoding)_encodingFromResponse:(NSURLResponse *)response
{
  if (response.textEncodingName) {
    CFStringRef cfEncodingName = (__bridge CFStringRef)response.textEncodingName;
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding(cfEncodingName);
    if (cfEncoding != kCFStringEncodingInvalidId) {
      return CFStringConvertEncodingToNSStringEncoding(cfEncoding);
    }
  }
  // Default to UTF-8
  return NSUTF8StringEncoding;
}

- (NSError *)_errorFromResponse:(NSHTTPURLResponse *)response body:(NSString *)body
{
  NSDictionary *userInfo;
  id errorInfo = RCTJSONParse(body, nil);
  if ([errorInfo isKindOfClass:[NSDictionary class]]) {
    userInfo = [self _formattedErrorInfo:(NSDictionary *)errorInfo];
  } else {
    userInfo = @{
                 NSLocalizedDescriptionKey: body,
                 };
  }
  return [NSError errorWithDomain:EXNetworkErrorDomain code:response.statusCode userInfo:userInfo];
}

- (NSDictionary *)_formattedErrorInfo:(NSDictionary *)errorInfo
{
  NSString *message = errorInfo[@"message"] ?: errorInfo[@"error"] ?: @"There was a server error";
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionaryWithDictionary:@{ NSLocalizedDescriptionKey: message }];
  
  if ([errorInfo[@"errors"] isKindOfClass:[NSArray class]]) {
    NSMutableArray *formattedErrorItems = [NSMutableArray array];
    for (NSDictionary *errorItem in errorInfo[@"errors"]) {
      if ([errorItem isKindOfClass:[NSDictionary class]]) {
        NSMutableDictionary *formattedErrorItem = [NSMutableDictionary dictionary];
        if (errorItem[@"description"]) {
          formattedErrorItem[@"methodName"] = errorItem[@"description"];
        }
        if (errorItem[@"filename"]) {
          formattedErrorItem[@"file"] = errorItem[@"filename"];
        }
        if (errorItem[@"lineNumber"]) {
          formattedErrorItem[@"lineNumber"] = errorItem[@"lineNumber"];
        }
        [formattedErrorItems addObject:formattedErrorItem];
      }
    }
    userInfo[@"stack"] = formattedErrorItems;
  }
  
  return userInfo;
}

@end
