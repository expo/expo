// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevelopmentClientManifestParser.h"

typedef void (^CompletionHandler)(NSData *data, NSURLResponse *response);

@interface EXDevelopmentClientManifestParser ()

@property (weak, nonatomic) NSURLSession *session;
@property (strong, nonatomic) NSString *url;

@end

@implementation EXDevelopmentClientManifestParser


- (instancetype)initWithURL:(NSURL *)url session:(NSURLSession *)session
{
  if (self = [super init]) {
    self.session = session;
    self.url = url;
  }
  return self;
}


- (void)tryToParseManifest:(OnManifestParsed)onParsed onInalidURL:(OnInvalidManifestURL)onInalidURL onError:(OnManifestError)onError
{
  [self _fetch:@"HEAD" onError:onError completionHandler:^(NSData *data, NSURLResponse *response) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSDictionary *headers = [httpResponse allHeaderFields];
    
    if (!headers[@"Exponent-Server"]) {
      onInalidURL();
      return;
    }

    [self _fetch:@"GET" onError:onError completionHandler:^(NSData *data, NSURLResponse *response) {
      NSError *error;
      NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
      if (error) {
        onError(error);
        return;
      }
      
      onParsed(jsonDict);
    }];
  }];
}


- (void)_fetch:(NSString *)method onError:(OnManifestError)onError completionHandler:(CompletionHandler)completionHandler
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:self.url]];
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
