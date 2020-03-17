// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

@implementation EXSessionTaskDelegate

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
{
  if (self = [super init]) {
    _resolve = resolve;
    _reject = reject;
  }
  
  return self;
}

- (NSMutableDictionary *)parseServerResponse:(NSURLResponse *)response
{
  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
  NSMutableDictionary *result = [NSMutableDictionary dictionary];
  result[@"status"] = @([httpResponse statusCode]);
  result[@"headers"] = [httpResponse allHeaderFields];
  result[@"MINEType"] = UMNullIfNil([httpResponse MIMEType]);
  return result;
}

@end
