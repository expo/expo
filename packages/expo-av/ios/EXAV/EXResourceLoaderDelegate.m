#import <EXAV/EXResourceLoaderDelegate.h>

@implementation EXResourceLoaderDelegate
NSString * const DRMErrorDomain = @"YourErrorDomain"; // Replace with your actual error domain
BOOL *_base64Cert;
NSURL *_certURL;
NSURL *_keyServerUrl;

- (instancetype)initWithCertificateData:(NSURL *)certURL keyServerURL:(NSURL *)keyServerURL base64Cert:(BOOL)base64Cert {
    self = [super init];
    if (self) {
        _base64Cert = base64Cert;
        _certURL = certURL;
        _keyServerUrl = keyServerURL;
    }
    return self;
}
- (BOOL)resourceLoader:(AVAssetResourceLoader *)resourceLoader
shouldWaitForLoadingOfRequestedResource:(AVAssetResourceLoadingRequest *)loadingRequest {
    NSData *_certificateData = [NSData dataWithContentsOfURL:_certURL];
    if(_base64Cert){
        _certificateData = [[NSData alloc] initWithBase64EncodedData:_certificateData options:NSDataBase64DecodingIgnoreUnknownCharacters];
    }
    // We first check if a URL is set in the manifest.
    NSURL *url = loadingRequest.request.URL;
    if (!url) {
        NSLog(@"unable to read url host");

        [loadingRequest finishLoadingWithError:[NSError errorWithDomain:@"YourErrorDomain" code:DRMErrorNoURLFound userInfo:nil]];
        return NO;
    }
    
    // Get the content id. Content id will be stored in the host of the request URL.
    NSString *contentId = url.host;
    NSData *contentIdData = [contentId dataUsingEncoding:NSUTF8StringEncoding];
    if (!contentId || !contentIdData) {
        NSLog(@"unable to read content id");
        [loadingRequest finishLoadingWithError:[NSError errorWithDomain:@"YourErrorDomain" code:DRMErrorNoContentIdFound userInfo:nil]];
        return NO;
    }
    
    // Request SPC data from OS.
    NSData *spcData = nil;
    NSError *spcError = nil;
    @try {
        spcData = [loadingRequest streamingContentKeyRequestDataForApp:_certificateData contentIdentifier:contentIdData options:nil error:&spcError];
    } @catch (NSException *exception) {
        spcError = [NSError errorWithDomain:@"YourErrorDomain" code:DRMErrorNoSPCFound userInfo:@{NSUnderlyingErrorKey: exception}];
    }
    
    if (!spcData || !loadingRequest.dataRequest) {
        [loadingRequest finishLoadingWithError:[NSError errorWithDomain:@"YourErrorDomain" code:DRMErrorNoSPCFound userInfo:@{NSUnderlyingErrorKey: spcError}]];
        NSLog(@"unable to read spc data");
        return NO;
    }
    
    NSString *stringBody = [NSString stringWithFormat:@"spc=%@&assetId=%@", [spcData base64EncodedStringWithOptions:0], contentId];
    NSMutableURLRequest *ckcRequest = [NSMutableURLRequest requestWithURL:_keyServerUrl];
    ckcRequest.HTTPMethod = @"POST";
    ckcRequest.HTTPBody = [stringBody dataUsingEncoding:NSUTF8StringEncoding];
    
    [[[NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]]
      dataTaskWithRequest:ckcRequest
      completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
          
          if (!data) {
              NSLog(@"Error in ckc data request");

              [loadingRequest finishLoadingWithError:[NSError errorWithDomain:@"YourErrorDomain" code:DRMErrorUnableToFetchKey userInfo:@{NSUnderlyingErrorKey: error}]];
              return;
          }
          
          // The CKC is correctly returned and is now sent to the `AVPlayer` instance
          // so we can continue to play the stream.
          NSData *ckcData = [[NSData alloc] initWithBase64EncodedData:data options:0];
          
          if (!ckcData) {
              NSLog(@"Can't create base4 encoded data");
              [loadingRequest finishLoadingWithError:[NSError errorWithDomain:@"YourErrorDomain" code:DRMErrorCannotEncodeCKCData userInfo:nil]];
              return;
          }
          
          [loadingRequest.dataRequest respondWithData:ckcData];
          [loadingRequest finishLoading];
          NSLog(@"At final call : Success");
          
      }] resume];
    
    return YES;
}

@end
