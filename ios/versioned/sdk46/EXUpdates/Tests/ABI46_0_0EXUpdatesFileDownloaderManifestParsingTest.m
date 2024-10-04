//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesConfig.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesFileDownloader.h>

#import "ABI46_0_0EXUpdates_Unit_Tests-Swift.h"

@interface ABI46_0_0EXUpdatesFileDownloaderManifestParsingTests : XCTestCase

@property (nonatomic, strong) NSString *classicJSON;
@property (nonatomic, strong) NSString *modernJSON;
@property (nonatomic, strong) NSString *modernJSONCertificate;
@property (nonatomic, strong) NSString *modernJSONSignature;

@property (nonatomic, strong) NSString *leafCertificate;
@property (nonatomic, strong) NSString *intermediateCertificate;
@property (nonatomic, strong) NSString *rootCertificate;
@property (nonatomic, strong) NSString *chainLeafSignature;

@property (nonatomic, strong) NSString *manifestBodyIncorrectProjectId;
@property (nonatomic, strong) NSString *validChainLeafSignatureIncorrectProjectId;

@end

@implementation ABI46_0_0EXUpdatesFileDownloaderManifestParsingTests

- (void)setUp {
  _classicJSON = TestHelper.testClassicBody;
  _modernJSON = TestHelper.testBody;
  _modernJSONCertificate = [TestHelper getTestCertificateObjc:@"test"];
  _modernJSONSignature = TestHelper.testSignature;
  _leafCertificate = [TestHelper getTestCertificateObjc:@"chainLeaf"];
  _intermediateCertificate = [TestHelper getTestCertificateObjc:@"chainIntermediate"];
  _rootCertificate = [TestHelper getTestCertificateObjc:@"chainRoot"];
  _chainLeafSignature = TestHelper.testValidChainLeafSignature;
  _manifestBodyIncorrectProjectId = TestHelper.testNewManifestBodyIncorrectProjectId;
  _validChainLeafSignatureIncorrectProjectId = TestHelper.testNewManifestBodyValidChainLeafSignatureIncorrectProjectId;
}

- (NSData *)multipartDataFromManifest:(NSString *)manifest
                         withBoundary:(NSString *)boundary
                 andManifestSignature:(nullable NSString *)signature
                  andCertificateChain:(nullable NSString *)certificateChain {
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
  
  if (certificateChain) {
    [body appendData:[[NSString stringWithFormat:@"--%@\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:[@"Content-Type: application/x-pem-file\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:[[NSString stringWithFormat:@"Content-Disposition: inline; name=\"%@\"\r\n\r\n", @"certificate_chain"] dataUsingEncoding:NSUTF8StringEncoding]];
    
    [body appendData:[certificateChain dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  }
  
  [body appendData:[[NSString stringWithFormat:@"--%@--\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];

  return body;
}

- (void)testManifestParsing_JSONBody
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *contentType = @"application/json";
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"content-type": contentType
  }];
  
  NSData *bodyData = [_classicJSON dataUsingEncoding:NSUTF8StringEncoding];
  
  __block BOOL errorOccurred;
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
}

- (void)testManifestParsing_MultipartBody
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
  NSString *boundary = @"blah";
  NSString *contentType = [NSString stringWithFormat:@"multipart/mixed; boundary=%@", boundary];
  
  NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]
                                                            statusCode:200
                                                           HTTPVersion:@"HTTP/1.1"
                                                          headerFields:@{
    @"content-type": contentType
  }];
  
  NSData *bodyData = [self multipartDataFromManifest:_classicJSON withBoundary:boundary andManifestSignature:nil andCertificateChain:nil];
  
  __block BOOL errorOccurred;
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
}

- (void)testManifestParsing_JSONBodySigned {
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI46_0_0EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    ABI46_0_0EXUpdatesConfigCodeSigningMetadataKey: @{},
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
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
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
}

- (void)testManifestParsing_MultipartBodySigned
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI46_0_0EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    ABI46_0_0EXUpdatesConfigCodeSigningMetadataKey: @{},
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
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
  
  NSData *bodyData = [self multipartDataFromManifest:_modernJSON withBoundary:boundary andManifestSignature:_modernJSONSignature andCertificateChain:nil];
  
  __block BOOL errorOccurred;
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
}

- (void)testManifestParsing_JSONBodyExpectsSigned_ReceivedUnsignedRequest {
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI46_0_0EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    ABI46_0_0EXUpdatesConfigCodeSigningMetadataKey: @{},
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
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
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = error;
  }];
  
  XCTAssertTrue([errorOccurred.localizedDescription isEqualToString:@"Downloaded manifest signature is invalid: No expo-signature header specified"]);
  XCTAssertNil(resultUpdateManifest);
}

- (void)testManifestParsing_JSONBodySigned_UnsignedRequest_ManifestSignatureOptional {
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI46_0_0EXUpdatesConfigCodeSigningCertificateKey: _modernJSONCertificate,
    ABI46_0_0EXUpdatesConfigCodeSigningMetadataKey: @{},
    ABI46_0_0EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey: @YES,
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
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
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
}

- (void)testManifestParsing_MultipartBodySignedCertificateParticularExperience {
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI46_0_0EXUpdatesConfigCodeSigningCertificateKey: _rootCertificate,
    ABI46_0_0EXUpdatesConfigCodeSigningMetadataKey: @{
      @"keyid": @"ca-root",
    },
    ABI46_0_0EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: @YES,
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
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
  
  NSData *bodyData = [self multipartDataFromManifest:_modernJSON withBoundary:boundary andManifestSignature:_chainLeafSignature andCertificateChain:[NSString stringWithFormat:@"%@%@", _leafCertificate, _intermediateCertificate]];
  
  __block BOOL errorOccurred;
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = true;
  }];
  
  XCTAssertFalse(errorOccurred);
  XCTAssertNotNil(resultUpdateManifest);
  // TODO(wschurman): add isVerified property
//  XCTAssertTrue(resultUpdateManifest.manifest.isVerified);
}

- (void)testManifestParsing_MultipartBodySignedCertificateParticularExperience_IncorrectExperienceInManifest {
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI46_0_0EXUpdatesConfigCodeSigningCertificateKey: _rootCertificate,
    ABI46_0_0EXUpdatesConfigCodeSigningMetadataKey: @{
      @"keyid": @"ca-root",
    },
    ABI46_0_0EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: @YES,
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];
  
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
  
  NSData *bodyData = [self multipartDataFromManifest:_manifestBodyIncorrectProjectId withBoundary:boundary andManifestSignature:_validChainLeafSignatureIncorrectProjectId andCertificateChain:[NSString stringWithFormat:@"%@%@", _leafCertificate, _intermediateCertificate]];
  
  __block NSError *errorOccurred;
  __block ABI46_0_0EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = error;
  }];
  
  XCTAssertTrue([errorOccurred.localizedDescription isEqualToString:@"Invalid certificate for manifest project ID or scope key"]);
  XCTAssertNil(resultUpdateManifest);
}

@end
