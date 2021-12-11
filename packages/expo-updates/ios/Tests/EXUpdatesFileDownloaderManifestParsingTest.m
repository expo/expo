//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

@interface EXUpdatesFileDownloaderManifestParsingTests : XCTestCase

@end

@implementation EXUpdatesFileDownloaderManifestParsingTests

- (NSData *)multipartDataFromManifest:(NSDictionary *)manifest withBoundary:(NSString *)boundary {
  NSError *err;
  NSData *manifestData = [NSJSONSerialization dataWithJSONObject:manifest options:kNilOptions error:&err];
  if (err) {
    @throw err;
  }
  
  NSMutableData *body = [NSMutableData data];
  [body appendData:[[NSString stringWithFormat:@"--%@\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];
  [body appendData:[@"Content-Type: application/json\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  [body appendData:[[NSString stringWithFormat:@"Content-Disposition: inline; name=\"%@\"\r\n\r\n", @"manifest"] dataUsingEncoding:NSUTF8StringEncoding]];
  
  [body appendData:manifestData];
  [body appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  
  [body appendData:[[NSString stringWithFormat:@"--%@--\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];

  return body;
}

- (void)testManifestParsing_JSONBody
{
  NSDictionary *manifestJSON = @{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  };
  
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": @"https://exp.host/@test/test",
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *contentType = @"application/json";
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"content-type": contentType
  }];
  
  NSError *err;
  NSData *bodyData = [NSJSONSerialization dataWithJSONObject:manifestJSON options:kNilOptions error:&err];
  if (err) {
    @throw err;
  }
  
  __block BOOL errorOccurred;
  __block EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
}

- (void)testManifestParsing_MultipartBody
{
  NSDictionary *manifestJSON = @{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  };
  
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": @"https://exp.host/@test/test",
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *boundary = @"blah";
  NSString *contentType = [NSString stringWithFormat:@"multipart/mixed; boundary=%@", boundary];
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"content-type": contentType
  }];
  
  NSData *bodyData = [self multipartDataFromManifest:manifestJSON withBoundary:boundary];
  
  __block BOOL errorOccurred;
  __block EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
}

@end
