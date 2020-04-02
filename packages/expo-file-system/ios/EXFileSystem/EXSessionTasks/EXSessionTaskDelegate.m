// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

@implementation EXSessionTaskDelegate

- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)sessionRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject
{
  if (self = [super init]) {
    _sessionRegister = sessionRegister;
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
  result[@"mimeType"] = UMNullIfNil([httpResponse MIMEType]);
  return result;
}

@end
