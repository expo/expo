// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionUploadTaskDelegate.h>

@interface EXSessionUploadTaskDelegate ()

@property (strong, nonatomic) NSMutableData *responseData;

@end


@implementation EXSessionUploadTaskDelegate

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
        withSessionTaskRegister:(id<EXSessionTaskRegister>)taskRegister
{
  if (self = [super initWithResolve:resolve withReject:reject withSessionTaskRegister:taskRegister]) {
    _responseData = [[NSMutableData alloc] init];
  }
  
  return self;
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error
{
  [self _handleSessionUploadTask:(NSURLSessionUploadTask *)task withError:error];
  [self.taskRegister onSessionCompleted:session];
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data {
    if (!data.length) {
        return;
    }

    [_responseData appendData:data];
}

- (void)_handleSessionUploadTask:(NSURLSessionUploadTask *)uploadTask withError:(NSError *)error
{
  if (error) {
    self.reject(@"E_UNABLE_TO_UPLOAD_FILE.",
          [NSString stringWithFormat:@"Unable to upload the file. '%@'", error.description],
          error);
    return;
  }
  
  NSMutableDictionary *result = [self parseServerResponse:uploadTask.response];
  result[@"body"] = [[NSString alloc] initWithData:_responseData encoding:NSUTF8StringEncoding];
  
  self.resolve(result);
}
@end
