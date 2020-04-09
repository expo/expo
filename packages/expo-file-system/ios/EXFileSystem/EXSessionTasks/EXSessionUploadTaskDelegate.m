// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionUploadTaskDelegate.h>

@interface EXSessionUploadTaskDelegate ()

@property (strong, nonatomic) NSMutableData *responseData;

@end

@implementation EXSessionUploadTaskDelegate

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
                [NSString stringWithFormat:@"Unable to upload the file: '%@'", error.description],
                error);
    return;
  }
  
  // We only set EXSessionUploadTaskDelegates as delegates of upload tasks
  // so it should be safe to assume that this is what we will receive here.
  NSURLSessionUploadTask *uploadTask = (NSURLSessionUploadTask *)task;
  NSMutableDictionary *result = [[EXSessionTaskDelegate parseServerResponse:uploadTask.response] mutableCopy];
  // TODO: add support for others response types (different encodings, files)
  result[@"body"] = [[NSString alloc] initWithData:_responseData encoding:NSUTF8StringEncoding];
  self.resolve(result);
}

@end
