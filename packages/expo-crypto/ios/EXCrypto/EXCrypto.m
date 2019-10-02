// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXCrypto/EXCrypto.h>
#import <CommonCrypto/CommonDigest.h>

@implementation EXCrypto

UM_EXPORT_MODULE(ExpoCrypto);

UM_EXPORT_METHOD_AS(digestStringAsync,
                    digestStringAsync:(NSString *)algorithm
                    data:(NSString *)data
                    options:(NSDictionary *)options
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSString *encoding = options[@"encoding"];
  
  int digestLength = [EXCrypto digestLengthForJSAlgorithm:algorithm];
  if (digestLength == -1) {
    reject(@"ERR_CRYPTO_DIGEST", [NSString stringWithFormat:@"Invalid hashing algorithm: %@", algorithm], nil);
    return;
  }
  
  NSData *_data = [data dataUsingEncoding:NSUTF8StringEncoding];
  uint8_t digest[digestLength];
  if ([algorithm isEqualToString:@"MD2"]) {
    CC_MD2(_data.bytes, (CC_LONG)_data.length, digest);
  } else if ([algorithm isEqualToString:@"MD4"]) {
    CC_MD4(_data.bytes, (CC_LONG)_data.length, digest);
  } else if ([algorithm isEqualToString:@"MD5"]) {
    CC_MD5(_data.bytes, (CC_LONG)_data.length, digest);
  } else if ([algorithm isEqualToString:@"SHA-1"]) {
    CC_SHA1(_data.bytes, (CC_LONG)_data.length, digest);
  } else if ([algorithm isEqualToString:@"SHA-224"]) {
    CC_SHA224(_data.bytes, (CC_LONG)_data.length, digest);
  } else if ([algorithm isEqualToString:@"SHA-256"]) {
    CC_SHA256(_data.bytes, (CC_LONG)_data.length, digest);
  } else if ([algorithm isEqualToString:@"SHA-384"]) {
    CC_SHA384(_data.bytes, (CC_LONG)_data.length, digest);
  } else if ([algorithm isEqualToString:@"SHA-512"]) {
    CC_SHA512(_data.bytes, (CC_LONG)_data.length, digest);
  }
  
  if ([encoding isEqualToString:@"hex"]) {
    NSMutableString *output = [NSMutableString stringWithCapacity:digestLength * 2];
    for (int i = 0; i < digestLength; i++) {
      [output appendFormat:@"%02x", digest[i]];
    }
    resolve(output);
    return;
  } else if ([encoding isEqualToString:@"base64"]) {
    NSData *originalData = [NSData dataWithBytes:digest length:digestLength];
    NSString *output = [originalData base64EncodedStringWithOptions:0];
    resolve(output);
    return;
  } else {
    reject(@"ERR_CRYPTO_DIGEST", @"Invalid encoding type provided.", nil);
    return;
  }
}

+ (int)digestLengthForJSAlgorithm:(NSString *)input {
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
