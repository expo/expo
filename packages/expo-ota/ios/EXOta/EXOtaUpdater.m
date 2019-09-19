//
//  EXOtaUpdater.m
//  EXOta
//
//  Created by Michał Czernek on 05/09/2019.
//

#import <Foundation/Foundation.h>
#import <EXOta/EXOtaUpdater.h>

@implementation EXOtaUpdater: NSObject

id<EXManifestRequestConfig> _config;

- (id)initWithConfig:(id<EXManifestRequestConfig>)config
{
    _config = config;
    return self;
}

- (void)downloadManifest:(nonnull EXManifestSuccessBlock)successBlock error:(nonnull EXManifestErrorBlock)errorBlock
{
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
    NSInteger timeout = 2 * 60 * 1000;
    
    NSURL *url = [NSURL URLWithString:_config.manifestUrl];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url cachePolicy:NSURLRequestUseProtocolCachePolicy timeoutInterval:timeout];
    
    [self setHTTPHeaderFields:request fromDictionary:_config.manifestRequestHeaders];
    
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
            NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil];
            successBlock(json);
        }
    }];
    [task resume];
    [session finishTasksAndInvalidate];
}

#pragma mark - Configuring Request

- (void)setHTTPHeaderFields:(NSMutableURLRequest *)request fromDictionary:(NSDictionary*) headers
{
    for(id key in headers)
    {
        [request setValue:headers[key] forHTTPHeaderField:key];
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
