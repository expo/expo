//
//  EXOtaApiClient.m
//  EXOta
//
//  Created by Michał Czernek on 09/10/2019.
//

#import "EXOtaApiClient.h"

@implementation EXOtaApiClient

- (void)performRequest:(nonnull NSString*)url withHeaders:(nullable NSDictionary*)headers withTimeout:(NSInteger)timeout success:(nonnull EXRequestSuccessBlock)successBlock error:(nonnull EXRequestErrorBlock)errorBlock
{
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
    
    NSURL *requestUrl = [NSURL URLWithString:url];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:requestUrl cachePolicy:NSURLRequestUseProtocolCachePolicy timeoutInterval:timeout];
    
    [self setHTTPHeaderFields:request fromDictionary:headers];
    
    __weak typeof(self) weakSelf = self;
    NSURLSessionDataTask *task = [session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (!error && [response isKindOfClass:[NSHTTPURLResponse class]]) {
            NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
            if (httpResponse.statusCode != 200) {
                NSStringEncoding encoding = [weakSelf _encodingFromResponse:response];
                NSString *body = [[NSString alloc] initWithData:data encoding:encoding];
                errorBlock([NSError errorWithDomain:@"expo-ota" code:200 userInfo:@{body: body}]);
            }
        }
        
        if (error) {
            errorBlock(error);
        } else {
            successBlock(data);
        }
    }];
    [task resume];
    [session finishTasksAndInvalidate];
}

#pragma mark - Configuring Request

- (void)setHTTPHeaderFields:(NSMutableURLRequest *)request fromDictionary:(NSDictionary*) headers
{
    if(headers != nil) {
        for(id key in headers)
        {
            [request setValue:headers[key] forHTTPHeaderField:key];
        }
    }
}

#pragma mark - Parsing response

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

#pragma mark - NSURLSessionTaskDelegate

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task willPerformHTTPRedirection:(NSHTTPURLResponse *)response newRequest:(NSURLRequest *)request completionHandler:(void (^)(NSURLRequest *))completionHandler
{
    completionHandler(request);
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask willCacheResponse:(NSCachedURLResponse *)proposedResponse completionHandler:(void (^)(NSCachedURLResponse *cachedResponse))completionHandler
{
    completionHandler(proposedResponse);
}

@end
