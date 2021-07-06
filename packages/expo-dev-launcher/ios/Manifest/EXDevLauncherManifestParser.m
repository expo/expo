// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevLauncherManifestParser.h"
#import <EXDevLauncher-Swift.h>

typedef void (^CompletionHandler)(NSData *data, NSURLResponse *response);

@interface EXDevLauncherManifestParser ()

@property (weak, nonatomic) NSURLSession *session;
@property (strong, nonatomic) NSURL *url;

@end

@implementation EXDevLauncherManifestParser


- (instancetype)initWithURL:(NSURL *)url session:(NSURLSession *)session
{
  if (self = [super init]) {
    self.session = session;
    self.url = url;
  }
  return self;
}

- (void)isManifestURLWithCompletion:(IsManifestURL)completion
                            onError:(OnManifestError)onError
{
  [self _fetch:@"HEAD" onError:onError completionHandler:^(NSData *data, NSURLResponse *response) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;

    // published projects should respond unsuccessfully to HEAD requests sent with no headers
    if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
      completion(YES);
      return;
    }

    NSDictionary *headers = [httpResponse allHeaderFields];
    if (headers[@"Exponent-Server"]) {
      completion(YES);
      return;
    }

    completion(NO);
  }];
}

- (void)tryToParseManifest:(OnManifestParsed)onParsed
                   onError:(OnManifestError)onError
{
  [self _fetch:@"GET" onError:onError completionHandler:^(NSData *data, NSURLResponse *response) {
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
        NSString *message = @"Failed to open app.\n\nIf you are trying to load the app from a development server, check your network connectivity and make sure you can access the server from your device.\n\nIf you are trying to open a published project, install a compatible version of expo-updates and follow all setup and integration steps.";
        onError([NSError errorWithDomain:@"DevelopmentClient" code:1 userInfo:@{NSLocalizedDescriptionKey: message}]);
        return;
      }
    }
    EXDevLauncherManifest *manifest = [EXDevLauncherManifest fromJsonData:data];
    if (!manifest) {
      NSMutableDictionary* details = [NSMutableDictionary dictionary];
      [details setValue:@"Couldn't parse the manifest." forKey:NSLocalizedDescriptionKey];
      onError([[NSError alloc] initWithDomain:@"DevelopemntClient" code:1 userInfo:details]);
      return;
    }
    onParsed(manifest);
  }];
}


- (void)_fetch:(NSString *)method onError:(OnManifestError)onError completionHandler:(CompletionHandler)completionHandler
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:self.url];
  [request setHTTPMethod:method];
  NSURLSessionDataTask *dataTask = [self.session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
    if (error) {
      onError(error);
      return;
    }
    completionHandler(data, response);
  }];
  [dataTask resume];
}

@end
