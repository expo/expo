//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

@interface EXUpdatesFileDownloaderManifestParsingTests : XCTestCase

@property (nonatomic, strong) NSString *classicJSON;
@property (nonatomic, strong) NSString *modernJSON;
@property (nonatomic, strong) NSString *modernJSONCertificate;
@property (nonatomic, strong) NSString *modernJSONSignature;

@end

@implementation EXUpdatesFileDownloaderManifestParsingTests

- (void)setUp {
  _classicJSON = @"{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}";
  _modernJSON = @"{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"}}";
  _modernJSONCertificate = @"-----BEGIN CERTIFICATE-----\nMIIDfzCCAmegAwIBAgIJLGiqnjmA9JmpMA0GCSqGSIb3DQEBCwUAMGkxFDASBgNV\nBAMTC2V4YW1wbGUub3JnMQswCQYDVQQGEwJVUzERMA8GA1UECBMIVmlyZ2luaWEx\nEzARBgNVBAcTCkJsYWNrc2J1cmcxDTALBgNVBAoTBFRlc3QxDTALBgNVBAsTBFRl\nc3QwHhcNMjExMTIyMTc0NzQzWhcNMjIxMTIyMTc0NzQzWjBpMRQwEgYDVQQDEwtl\neGFtcGxlLm9yZzELMAkGA1UEBhMCVVMxETAPBgNVBAgTCFZpcmdpbmlhMRMwEQYD\nVQQHEwpCbGFja3NidXJnMQ0wCwYDVQQKEwRUZXN0MQ0wCwYDVQQLEwRUZXN0MIIB\nIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAucg/fRwgYLxO4fDG1W/ew4Wu\nkqp2+j9mLyA18sd8noCT0eSJwxMTLJJq4biNx6kJEVSQdodN3e/qSJndz+ZHA7b1\n6Do3Ecg5oRvl3HEwaH4AkM2Lj87VjgfxPUsiSHtPd+RTbxnOy9lGupQa/j71WrAq\nzJpNmhP70vzkY4EVejn52kzRPZB3kTxkjggFrG/f18Bcf4VYxN3aLML32jih+UC0\n6fv57HNZZ3ewGSJrLcUdEgctBWiz1gzwF6YdXtEJ14eQbgHgsLsXaEQeg2ncGGxF\n/3rIhsnlWjeIIya7TS0nvqZHNKznZV9EWpZQBFVoLGGrvOdU3pTmP39qbmY0nwID\nAQABoyowKDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMw\nDQYJKoZIhvcNAQELBQADggEBAALcH9Jb3wq64YkNxUIa25T9umhr4uRe94ESHujM\nIRrBbbqu1p3Vs8N3whZNhcL6Djb4ob18m/aGKbF+UQBMvhn23qRCG6KKzIeDY6Os\n8tYyIwush2XeOFA7S5syPqVBI6PrRBDMCLmAJO4qTM2p0f+zyFXFuytCXOv2fA3M\n88aYVmU7NIfBTFdqNIgSt1yj7FKvd5zgoUyu7mTVdzY59xQzkzYTsnobY2XrTcvY\n6wyRqOAQ86wR8OvDjHB5y/YN2Pdg7d9jUFBCX6Ohr7W3GHrjAadKwq+kbH1aP0oB\nQTFLQQfl3gtJ3Dl/5iBQD38sCIkA54FPSsKTRw3mC4DImBQ=\n-----END CERTIFICATE-----";
  
  _modernJSONSignature = @"sig=\"VpuLfRlB0DizR+hRWmedPGHdx/nzNJ8OomMZNGHwqx64zrx1XezriBoItup/icOlXFrqs6FHaul4g5m41JfEWCUbhXC4x+iNk//bxozEYJHmjbcAtC6xhWbMMYQQaUjuYk7rEL987AbOWyUI2lMhrhK7LNzBaT8RGqBcpEyAqIOMuEKcK0faySnWJylc7IzxHmO8jlx5ufzio8301wej8mNW5dZd7PFOX8Dz015tIpF00VGi29ShDNFbpnalch7f92NFs08Z0g9LXndmrGjNL84Wqd4kq5awRGQObrCuDHU4uFdZjtr4ew0JaNlVuyUrrjyDloBdq0aR804vuDXacQ==\"";
}

- (NSData *)multipartDataFromManifest:(NSString *)manifest
                         withBoundary:(NSString *)boundary
                 andManifestSignature:(nullable NSString *)signature {
  NSData *manifestData = [manifest dataUsingEncoding:NSUTF8StringEncoding];
  
  NSMutableData *body = [NSMutableData data];
  [body appendData:[[NSString stringWithFormat:@"--%@\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];
  [body appendData:[@"Content-Type: application/json\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  if (signature) {
    [body appendData:[[NSString stringWithFormat:@"expo-signature: %@\r\n", signature] dataUsingEncoding:NSUTF8StringEncoding]];
  }
  [body appendData:[[NSString stringWithFormat:@"Content-Disposition: inline; name=\"%@\"\r\n\r\n", @"manifest"] dataUsingEncoding:NSUTF8StringEncoding]];
  
  [body appendData:manifestData];
  [body appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  
  [body appendData:[[NSString stringWithFormat:@"--%@--\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];

  return body;
}

- (void)testManifestParsing_JSONBody
{
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *contentType = @"application/json";
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"content-type": contentType
  }];
  
  NSData *bodyData = [_classicJSON dataUsingEncoding:NSUTF8StringEncoding];
  
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
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
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
  
  NSData *bodyData = [self multipartDataFromManifest:_classicJSON withBoundary:boundary andManifestSignature:nil];
  
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

- (void)testManifestParsing_JSONBodySigned {
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    EXUpdatesConfigCodeSigningMetadataKey: @{},
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *contentType = @"application/json";
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"expo-protocol-version": @"0",
    @"expo-sfv-version": @"0",
    @"content-type": contentType,
    @"expo-signature": _modernJSONSignature,
  }];
  
  NSData *bodyData = [_modernJSON dataUsingEncoding:NSUTF8StringEncoding];
  
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

- (void)testManifestParsing_MultipartBodySigned
{
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    EXUpdatesConfigCodeSigningMetadataKey: @{},
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *boundary = @"blah";
  NSString *contentType = [NSString stringWithFormat:@"multipart/mixed; boundary=%@", boundary];
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"expo-protocol-version": @"0",
    @"expo-sfv-version": @"0",
    @"content-type": contentType
  }];
  
  NSData *bodyData = [self multipartDataFromManifest:_modernJSON withBoundary:boundary andManifestSignature:_modernJSONSignature];
  
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

- (void)testManifestParsing_JSONBodyExpectsSigned_ReceivedUnsignedRequest {
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    EXUpdatesConfigCodeSigningMetadataKey: @{},
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *contentType = @"application/json";
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"expo-protocol-version": @"0",
    @"expo-sfv-version": @"0",
    @"content-type": contentType,
  }];
  
  NSData *bodyData = [_modernJSON dataUsingEncoding:NSUTF8StringEncoding];
  
  __block NSError *errorOccurred;
  __block EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = error;
  }];
  
  XCTAssertTrue([errorOccurred.localizedDescription isEqualToString:@"Downloaded manifest signature is invalid: No expo-signature header specified"]);
  XCTAssertNil(resultUpdateManifest);
}

- (void)testManifestParsing_JSONBodySigned_UnsignedRequest_ManifestSignatureOptional {
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    EXUpdatesConfigCodeSigningMetadataKey: @{},
    EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey: @YES,
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *contentType = @"application/json";
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"expo-protocol-version": @"0",
    @"expo-sfv-version": @"0",
    @"content-type": contentType,
  }];
  
  NSData *bodyData = [_modernJSON dataUsingEncoding:NSUTF8StringEncoding];
  
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
