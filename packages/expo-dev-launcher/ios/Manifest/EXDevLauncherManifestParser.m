// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherManifestParser.h>
#import <EXDevLauncher/EXDevLauncherController.h>

#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)
// For cocoapods framework, the generated swift header will be inside EXDevLauncher module
#import <EXDevLauncher/EXDevLauncher-Swift.h>
#else
#import <EXDevLauncher-Swift.h>
#endif

@import EXManifests;

typedef void (^CompletionHandler)(NSData *data, NSURLResponse *response);

@interface EXDevLauncherManifestParser ()

@property (strong, nonatomic) NSURL *url;
@property (nonatomic, strong) NSString *installationID;
@property (weak, nonatomic) NSURLSession *session;
@property (nonatomic, assign) NSTimeInterval requestTimeout;

@end

@implementation EXDevLauncherManifestParser


- (instancetype)initWithURL:(NSURL *)url
             installationID:(NSString *)installationID
                    session:(NSURLSession *)session
             requestTimeout:(NSTimeInterval)requestTimeout
{
  if (self = [super init]) {
    self.url = url;
    self.installationID = installationID;
    self.session = session;
    self.requestTimeout = requestTimeout;
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

    NSString *contentType = headers[@"Content-Type"];
    if (contentType && ![contentType hasPrefix:@"text/html"] && ![contentType containsString:@"/javascript"]) {
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
    NSError *error;
    NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&error];
    if (!jsonObject) {
      NSMutableDictionary *details = [NSMutableDictionary dictionary];
      details[NSLocalizedDescriptionKey] = [NSString stringWithFormat:@"Couldn't parse the manifest. %@", (error ? error.localizedDescription : @"")];
      if (error) {
        details[NSUnderlyingErrorKey] = error;
      }
      onError([[NSError alloc] initWithDomain:@"DevelopmentClient" code:1 userInfo:details]);
      return;
    }
    EXManifestsManifest *manifest = [EXManifestsManifestFactory manifestForManifestJSON:jsonObject];
    onParsed(manifest);
  }];
}


- (void)_fetch:(NSString *)method onError:(OnManifestError)onError completionHandler:(CompletionHandler)completionHandler
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:self.url];
  [request setHTTPMethod:method];
  [request setValue:@"ios" forHTTPHeaderField:@"expo-platform"];
  [request setValue:@"application/expo+json,application/json" forHTTPHeaderField:@"accept"];
  [request setTimeoutInterval:self.requestTimeout];
  if (self.installationID) {
    [request setValue:self.installationID forHTTPHeaderField:@"Expo-Dev-Client-ID"];
  }
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
