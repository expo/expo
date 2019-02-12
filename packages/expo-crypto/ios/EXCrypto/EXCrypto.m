// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXCrypto/EXCrypto.h>
#import <CommonCrypto/CommonDigest.h>

@implementation EXCrypto

EX_EXPORT_MODULE(ExpoCrypto);

EX_EXPORT_METHOD_AS(digestStringAsync,
                    digestStringAsync:(NSString *)algorithm
                    data:(NSString *)data
                    options:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  NSString *encoding = options[@"encoding"];

  int hashingAlgorithm = [self.class SHAJSONToNative:algorithm];
  if (hashingAlgorithm == -1) {
    reject(@"ERR_CRYPTO", [NSString stringWithFormat:@"Invalid hashing algorithm: %@", algorithm], nil);
    return;
  }
  
  NSData *_data = [data dataUsingEncoding:NSUTF8StringEncoding];
  uint8_t digest[hashingAlgorithm];
  
  if (hashingAlgorithm == CC_MD2_DIGEST_LENGTH) {
    CC_MD2(_data.bytes, (CC_LONG)_data.length, digest);
  } else if (hashingAlgorithm == CC_MD4_DIGEST_LENGTH) {
    CC_MD4(_data.bytes, (CC_LONG)_data.length, digest);
  } else if (hashingAlgorithm == CC_MD5_DIGEST_LENGTH) {
    CC_MD5(_data.bytes, (CC_LONG)_data.length, digest);
  } else if (hashingAlgorithm == CC_SHA1_DIGEST_LENGTH) {
    CC_SHA1(_data.bytes, (CC_LONG)_data.length, digest);
  } else if (hashingAlgorithm == CC_SHA224_DIGEST_LENGTH) {
    CC_SHA224(_data.bytes, (CC_LONG)_data.length, digest);
  } else if (hashingAlgorithm == CC_SHA256_DIGEST_LENGTH) {
    CC_SHA256(_data.bytes, (CC_LONG)_data.length, digest);
  } else if (hashingAlgorithm == CC_SHA384_DIGEST_LENGTH) {
    CC_SHA384(_data.bytes, (CC_LONG)_data.length, digest);
  } else if (hashingAlgorithm == CC_SHA512_DIGEST_LENGTH) {
    CC_SHA512(_data.bytes, (CC_LONG)_data.length, digest);
  }
  
  if ([encoding isEqualToString:@"hex"]) {
    NSMutableString *output = [NSMutableString stringWithCapacity:hashingAlgorithm * 2];
    for (int i = 0; i < hashingAlgorithm; i++) {
      [output appendFormat:@"%02x", digest[i]];
    }
    resolve(output);
    return;
  } else if ([encoding isEqualToString:@"base64"]) {
    NSData *originalData = [NSData dataWithBytes:digest length:hashingAlgorithm];
    NSString *output = [originalData base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed];
    resolve(output);
    return;
  } else {
    reject(@"ERR_CRYPTO", @"Invalid encoding type provided.", nil);
    return;
  }
}

+ (int)SHAJSONToNative:(NSString *)input {
  if ([input isEqualToString:@"MD2"]) {
    return CC_MD2_DIGEST_LENGTH;
  } else if ([input isEqualToString:@"MD4"]) {
    return CC_MD4_DIGEST_LENGTH;
  } else if ([input isEqualToString:@"MD5"]) {
    return CC_MD5_DIGEST_LENGTH;
  } else if ([input isEqualToString:@"SHA-1"]) {
    return CC_SHA1_DIGEST_LENGTH;
  } else if ([input isEqualToString:@"SHA-224"]) {
    return CC_SHA224_DIGEST_LENGTH;
  } else if ([input isEqualToString:@"SHA-256"]) {
    return CC_SHA256_DIGEST_LENGTH;
  } else if ([input isEqualToString:@"SHA-384"]) {
    return CC_SHA384_DIGEST_LENGTH;
  } else if ([input isEqualToString:@"SHA-512"]) {
    return CC_SHA512_DIGEST_LENGTH;
  }
  return -1;
}

@end
