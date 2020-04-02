// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionUploadTaskDelegate.h>

@interface EXSessionUploadTaskDelegate ()

@property (strong, nonatomic) NSMutableData *responseData;

@end

@implementation EXSessionUploadTaskDelegate

- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)sessionRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject
{
  if (self = [super initWithSessionRegister:sessionRegister resolve:resolve reject:reject]) {
    _responseData = [[NSMutableData alloc] init];
  }
  
  return self;
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
  if (!data.length) {
    return;
  }
  [_responseData appendData:data];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (error) {
    self.reject(@"ERR_FILE_SYSTEM_UNABLE_TO_UPLOAD_FILE.",
          [NSString stringWithFormat:@"Unable to upload the file. '%@'", error.description],
          error);
    [self.sessionRegister unregister:session];
    return;
  }
  
  NSURLSessionUploadTask *uploadTask = (NSURLSessionUploadTask *)task;
  NSMutableDictionary *result = [self parseServerResponse:uploadTask.response];
  result[@"body"] = [[NSString alloc] initWithData:_responseData encoding:NSUTF8StringEncoding];
  self.resolve(result);
  
  [self.sessionRegister unregister:session];
}

@end
