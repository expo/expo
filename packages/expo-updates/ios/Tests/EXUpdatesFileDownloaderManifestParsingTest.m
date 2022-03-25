//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

@interface EXUpdatesFileDownloaderManifestParsingTests : XCTestCase

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

@implementation EXUpdatesFileDownloaderManifestParsingTests

- (void)setUp {
  _classicJSON = @"{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}";
  _modernJSON = @"{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"285dc9ca-a25d-4f60-93be-36dc312266d7\"}}}";
  _modernJSONCertificate = @"-----BEGIN CERTIFICATE-----\nMIICzTCCAbWgAwIBAgIJIOitOIH2bNqCMA0GCSqGSIb3DQEBCwUAMA8xDTALBgNV\nBAMTBHRlc3QwIBcNMjIwMzEyMTgwMTU2WhgPMjEyMjAzMTIxNzAxNTZaMA8xDTAL\nBgNVBAMTBHRlc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC915Fd\n39jg0XXrtafeWl5dyINazMn14CMskLuXGWNqsv3tqTcGHwkiDkWOBlTz9kPoPtHe\nT1HMGwgA9UcqFMtamugDx6BYIndNZsttfhVeJ1MQIvp2UJbkph3dJolIWQ8VYeNX\nanZx3rlAbjoGq4S/tBS6zszutpWZFNUSM+TyMG4JdFdVskKsqKcYpdIjZu3ZZZxy\n4iQvlSgQZIFDX3ZUnKH06RYs5SrGDigwjfOMolpvEj7bzR/86zBDCJ0EaZCrI/nz\ndYKTCknFWOP2Bb81HTNvkzFPcMWCA/AlBZp2WWzTuXhf2xiGf4X/qqh4siJn3A98\n8PI2JXRP1B8MACWfAgMBAAGjKjAoMA4GA1UdDwEB/wQEAwIHgDAWBgNVHSUBAf8E\nDDAKBggrBgEFBQcDAzANBgkqhkiG9w0BAQsFAAOCAQEAQC8/Vpk2PkyByra+IXVZ\nsbrCMcqu0vkQc1NXyrhi0ZrFq1+uYz6N+8M2U/oW7FIhSuVwZEqTRGqEC7l8/hFl\n630/lMAWnmIQZ1ojD5eBPykvfolX/dQOFm+vstRGa5pLeD8SxGxPoFpuQC633rs/\ne5O85vVK0Cdi5sjNHh3/+Xz0P9AqtskDNWni1tq+T+8hl+/DUG0zD9n4VczpswPY\n+p0khYAHPWa0L4WEfH9xzBXIQcUD67w6ICT1q1pXmfFGaZL9U8qKXIn1hPU8lxPI\nWlFFdh9HwWaoVIETqpJKjTe3k5+LrjkawOoMEnvJ2poKKG6lverU+vVu2zMG2Aix\n/w==\n-----END CERTIFICATE-----";
  
  _modernJSONSignature = @"sig=\"cpDit5vR18rz2ndUx/SX5GOZtynky8g15GqRKnaBqn2MN2a3jesYURcIoTgl0d+IQcKrNiSHzpg4IriTcNx4kv5Qw4qBiizDHBvyLvZU1O9d94w0iDU1kSAV7OhP4fgWJZJEdmLAlTQ2ilH9WlotQFU2SotC04yNBjR65NLiAbBpysX0+/VpWPuuHmJyS1HviNgq0ZtknH4DzjzDWPRi2LogzPnQKAmbMFlFGpenql9YIpxb4HQPcsdpAPPjESZegK4kiqbzQEx5E5OYAMFGl/pD9DrZhPDpFHu6f0UFngWepWqNsYA0bF9BaEP20ToK//LAlOcoE0lyUPEYfVCMMA==\"";
  
  _leafCertificate = @"-----BEGIN CERTIFICATE-----\nMIIDxzCCAq+gAwIBAgIJPwjUxmTw0yorMA0GCSqGSIb3DQEBCwUAMHkxHDAaBgNV\nBAMTE0V4cG8gR28gQ2VydGlmaWNhdGUxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpD\nYWxpZm9ybmlhMRIwEAYDVQQHEwlQYWxvIEFsdG8xDTALBgNVBAoTBEV4cG8xFDAS\nBgNVBAsTC0VuZ2luZWVyaW5nMB4XDTIyMDMxMjE3NTczOVoXDTIyMDQxMTE2NTcz\nOVowTzFNMEsGA1UEAxNERXhwbyBHbyBEZXZlbG9wbWVudCBDZXJ0aWZpY2F0ZSAy\nODVkYzljYS1hMjVkLTRmNjAtOTNiZS0zNmRjMzEyMjY2ZDcwggEiMA0GCSqGSIb3\nDQEBAQUAA4IBDwAwggEKAoIBAQC0OkXb4R5SRbPRnR/KQJx3T/D3XXT4FIFINcOf\nykRAtkKd/j1gIrlm4e62366ITJZ80tzYJ47AYENFIcviSPWhuOYHwoVT9h8PjKdf\naVOpqkacX9XJ9VAUF/QgB7mx3HZGNtbkDUSXrzEpyyLvlHuJvjiR1FO2hHuPcGBy\nnFkHK+4lwCsHrBltXOPDvprkmRs2pJ3TX6CBh3lPoUZ5vMU9nCLYmr0vSpVYd/Jz\npd9hdkDNLzUS8mldjcF9kgeNW87XdIj6TiPgrjPl5MltZJM4kpm8f0Cgx8Yr0m3x\nqHZGQAtOpBVzAO9SsudLDcX8srA2ZnuBPj9JqsCd3Z1bRjMxAgMBAAGjfDB6MA4G\nA1UdDwEB/wQEAwIHgDAWBgNVHSUBAf8EDDAKBggrBgEFBQcDAzBQBh4qhkiG9xQB\nvkCTeoLTLYF+gQBmgR2D4ep1gZ9XAgEELjI4NWRjOWNhLWEyNWQtNGY2MC05M2Jl\nLTM2ZGMzMTIyNjZkNyxAdGVzdC9hcHAwDQYJKoZIhvcNAQELBQADggEBAB0egBAv\nbkqvuLy5h2faz9XEkwTBtnmuY2maGDU4n3qgBKuoP06aOaqLNymqF5l3ymQjkoG/\nFJIy81l2PM8E0q3SSo9aagrYazD0RGqwvhll4B7l6qcaAvaPRl2WVN2Dd4UVC08v\niJLSY4ho7KsxmLejxOFSGa8gHokJoT1378Rws7ESuENBBVnRSDmxhIMhZg+dKdaN\n69F4DH/JE/zfiCWlO9Wwe2GICfJFY21wDEklbxl0oeirE6MhPWOwUmLRNttMX2PY\nncRkbVz/rQMFbb/8vyGGd/s7zBzgzSmErM+I3K2fUuHQQe+HhLQ539FLRE6iqx4p\nLGtk6qIqD0tvNfA=\n-----END CERTIFICATE-----";
  _intermediateCertificate = @"-----BEGIN CERTIFICATE-----\nMIIDtTCCAp2gAwIBAgIJOzyHLivOO4R2MA0GCSqGSIb3DQEBCwUAMHsxHjAcBgNV\nBAMTFUV4cG8gUm9vdCBDZXJ0aWZpY2F0ZTELMAkGA1UEBhMCVVMxEzARBgNVBAgT\nCkNhbGlmb3JuaWExEjAQBgNVBAcTCVBhbG8gQWx0bzENMAsGA1UEChMERXhwbzEU\nMBIGA1UECxMLRW5naW5lZXJpbmcwHhcNMjIwMzEyMTc1NzM5WhcNMjQwMzEyMTY1\nNzM5WjB5MRwwGgYDVQQDExNFeHBvIEdvIENlcnRpZmljYXRlMQswCQYDVQQGEwJV\nUzETMBEGA1UECBMKQ2FsaWZvcm5pYTESMBAGA1UEBxMJUGFsbyBBbHRvMQ0wCwYD\nVQQKEwRFeHBvMRQwEgYDVQQLEwtFbmdpbmVlcmluZzCCASIwDQYJKoZIhvcNAQEB\nBQADggEPADCCAQoCggEBAMk7quEu5Jgi9ogV4IVyWdfAxlu14fsbBTo04Nu02f+2\no9iyVi4pSo6QBog8UXetFiujRssBP04G7UAp4R7ZAczY9QwRRYbeC2caTvan6ibs\nD7QD59pDbvizeQXWg9SiQrjkCS16NcFm6m2WF3ZHyw+dQNAv691aBIIUrLRkykmr\nOYqTK2mAoVyGHPvvqcp4EpbOVzKfk0APSstbHbwQM5eU8nxPca7ExY+cWShUPqGF\ndmfz0VMrHAhwWBJh0+5mTfPAW4mKQXY4K0PCDrgWmNl4zq0z81uU4txemTBvRKei\nTxlqB3X7HfPKgv3XnrBDlsz/qyRQStNCzLg5/h9F6lMCAwEAAaM+MDwwEgYDVR0T\nAQH/BAgwBgEB/wIBADAOBgNVHQ8BAf8EBAMCAYYwFgYDVR0lAQH/BAwwCgYIKwYB\nBQUHAwMwDQYJKoZIhvcNAQELBQADggEBAI7VMf1Xi2onC7rJt7b8tgXcAEPX8EMe\nAa4xuBeT5vJKgVk6OCF12StjjLTzjGx9cnhegbgNfjOUQVBJYTn7UubhzDBB8kSm\ntTzZ8kTMmOEvzbm5+lRvd/9tJCoeBpwFGw2ArjYNLhDrElWdqZKcwoKvJ/X0TSGx\nQZuSXE5oWjKVUidovOiEXgCm5Fsrr7FjDPHyCqvYjbmTGK+0N8LVFuR6teWVs9dH\n5MOzNkeB93i2zcKa8Jk4q9wEjpX12luFe6UvTsKZQrBIrqlI0FdZ772G0IzTpaSV\nVGW3wyFSeIA3AuNLpSUxR6P2ks2H+R9Y08voHiUVxcBsmLFSKVOhrnc=\n-----END CERTIFICATE-----";
  _rootCertificate = @"-----BEGIN CERTIFICATE-----\nMIIDmTCCAoGgAwIBAgIJToBu2yFd0eyoMA0GCSqGSIb3DQEBCwUAMHsxHjAcBgNV\nBAMTFUV4cG8gUm9vdCBDZXJ0aWZpY2F0ZTELMAkGA1UEBhMCVVMxEzARBgNVBAgT\nCkNhbGlmb3JuaWExEjAQBgNVBAcTCVBhbG8gQWx0bzENMAsGA1UEChMERXhwbzEU\nMBIGA1UECxMLRW5naW5lZXJpbmcwHhcNMjIwMzEyMTc1NzM5WhcNNDIwMzEyMTY1\nNzM5WjB7MR4wHAYDVQQDExVFeHBvIFJvb3QgQ2VydGlmaWNhdGUxCzAJBgNVBAYT\nAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRIwEAYDVQQHEwlQYWxvIEFsdG8xDTAL\nBgNVBAoTBEV4cG8xFDASBgNVBAsTC0VuZ2luZWVyaW5nMIIBIjANBgkqhkiG9w0B\nAQEFAAOCAQ8AMIIBCgKCAQEA0AxYBhBrySITi/mqdI9JRkEkw0NegIDE/AnK/l/o\nvR5H/f1oOZ73amDN/691cUnsPjqQm2syQhtkcnBmw66/Y29M//S9ZMPQVU34Fd3c\nfGvmFtmC0OloLyP114VBLsMRtRrtZujfw6A19AreO1vfFfycAZH96XmKRU1uDY3h\nfJXHMnsYfYgcL56lWBsXwxBeQ2YquetzQND8k+ig/+OdKvqVV+qXkckJgTSq1uUM\n49MLiAlvTlmhEdcr4st8zSCcOYj4gOoScdLrC76A40k0SaKOIiKn6uUrXKS/OOKa\nK/mSfGv8LiO+Fr2o2+aOHHB0aG7KBdzu8eHw38GNouAxfwIDAQABoyAwHjAMBgNV\nHRMEBTADAQH/MA4GA1UdDwEB/wQEAwIBBjANBgkqhkiG9w0BAQsFAAOCAQEAMRqp\nHmCCxNDoGyaG/6e8HpKWmBhdxbOjEAcDyaUT0P/EtYJgwTftytV2T7Jf+nfWUVW4\nI2Tu/6Wqu/JEt8bjkbaat4Ry3Pvt3Qy67lHaE6iVghgz3rmUpz3iLOGfl52vZOyH\n/MsIKrO/T4xhwiBLyc9G2kWUOTgPMBIWJl8ETS17knS/BbjlFowAo0T0o3QAwA9E\nHGussfRnw+tRIrcVecN059SZDGuWrFA5zXQzKZAup+2DsY1ODqgDVjkLu90SdLN5\nGlQrg5RusNqL0u5Oi5eu7NiolxOEXTPiZSZFVCpHAB4GZUwHQvphIhr20NwReiSI\nfM3fWn9xTMjfIMbyqg==\n-----END CERTIFICATE-----";
  _chainLeafSignature = @"sig=\"XZ5i/hQTXL3zqXIvKiiNfOZMnE7neWjQoDTxiPbgrLqxj8axTGznwsC07pv2hiCYqlCLStebjY+F4uYESgduuhExG3XEajbsPANJn+vl1LWw18BRaqGFWrvgyA4+jquWCTRmJnMQoD0pFyV6uY7L2l8jV8+pJbB0QsoA3xfnIeTElTCTkQM60E3f0hBYrGV2s816HVl7dRz+3xOqUE139/I5xhdytEokkZfkhQcJ3Pgj1NbgvAUnAASSsGmkAkBisy8QEG9J0kzs3Kg8x79g19Ie4HBLXUBfgT0wH/7u9ngy9uDyZ2E43LVaLJpJbztxAi8FCW0XuQtTiedKKJHunw==\"";
  
  _manifestBodyIncorrectProjectId = @"{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"},\"extra\":{\"scopeKey\":\"@test/app\",\"eas\":{\"projectId\":\"485dc9ca-a25d-4f60-93be-36dc312266d8\"}}}";
  _validChainLeafSignatureIncorrectProjectId = @"sig=\"K5sqG7xzlpsiVEFi7fbZ9jBbRJ0dpVfgM7l4lzYUSxSxeX5ZqjyDQcMlucgzB3eiWS3xgzAHcr2sf5wyRjzzYF1HeVejuGtCClcZ85RfuXzFIngEli2w8/OhWv5VzOAyC8fJ+NxIUYd981pNWAiC6fX1ON4u9e6UTobSRiB+hDu91vKBMPftX1tToBLE53faV8bu0bmKdCG15I+AYIo0ux2337zaXqkkWSLlfLz2+Tw/v3qO1Ytp2sL1IPCH+Edqemy7wYuUMZGoMY0LzQfxePh3vnPCN8/R/rSvE5D/39qQoNa3McaS22eAuj93CFlhs1Pmj1wm9UTqyiV1XGaj9w==\"";
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
  
  NSData *bodyData = [self multipartDataFromManifest:_classicJSON withBoundary:boundary andManifestSignature:nil andCertificateChain:nil];
  
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
  
  NSData *bodyData = [self multipartDataFromManifest:_modernJSON withBoundary:boundary andManifestSignature:_modernJSONSignature andCertificateChain:nil];
  
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

- (void)testManifestParsing_MultipartBodySignedCertificateParticularExperience {
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigCodeSigningCertificateKey: _rootCertificate,
    EXUpdatesConfigCodeSigningMetadataKey: @{
      @"keyid": @"ca-root",
    },
    EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: @YES,
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
  
  NSData *bodyData = [self multipartDataFromManifest:_modernJSON withBoundary:boundary andManifestSignature:_chainLeafSignature andCertificateChain:[NSString stringWithFormat:@"%@%@", _leafCertificate, _intermediateCertificate]];
  
  __block BOOL errorOccurred;
  __block EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(EXUpdatesUpdate * _Nonnull update) {
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
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigCodeSigningCertificateKey: _rootCertificate,
    EXUpdatesConfigCodeSigningMetadataKey: @{
      @"keyid": @"ca-root",
    },
    EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: @YES,
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
  
  NSData *bodyData = [self multipartDataFromManifest:_manifestBodyIncorrectProjectId withBoundary:boundary andManifestSignature:_validChainLeafSignatureIncorrectProjectId andCertificateChain:[NSString stringWithFormat:@"%@%@", _leafCertificate, _intermediateCertificate]];
  
  __block NSError *errorOccurred;
  __block EXUpdatesUpdate *resultUpdateManifest;
  
  [downloader parseManifestResponse:response withData:bodyData database:nil successBlock:^(EXUpdatesUpdate * _Nonnull update) {
    resultUpdateManifest = update;
  } errorBlock:^(NSError * _Nonnull error) {
    errorOccurred = error;
  }];
  
  XCTAssertTrue([errorOccurred.localizedDescription isEqualToString:@"Invalid certificate for manifest project ID or scope key"]);
  XCTAssertNil(resultUpdateManifest);
}

@end
