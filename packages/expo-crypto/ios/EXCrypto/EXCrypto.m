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
  // hex
  NSString *encoding = options[@"encoding"];

  return [self.class encodeWithInput:data andSHA:[self.class SHAJSONToNative:algorithm]];
}

+ (int)SHAJSONToNative:(NSString *)input {
  if ([input isEqualToString:"SHA-1"]) {
    return CC_SHA512_DIGEST_LENGTH;
  } else if ([input isEqualToString:"SHA-256"]) {
    return CC_SHA256_DIGEST_LENGTH;
  } else if ([input isEqualToString:"SHA-384"]) {
    return CC_SHA384_DIGEST_LENGTH;
  } else if ([input isEqualToString:"SHA-512"]) {
    return CC_SHA512_DIGEST_LENGTH;
  } 
}

+ (NSString *)encodeWithInput:(NSString *)input andSHA:(int)SHA {
    NSData *inputData = [input dataUsingEncoding:NSUTF8StringEncoding];
    unsigned char *buffer = malloc(SHA);
    CC_SHA512([inputData bytes], (CC_LONG)[inputData length], buffer);
    NSData *result = [NSData dataWithBytesNoCopy:buffer length:SHA freeWhenDone:YES];

    NSString *hex = [NSString stringWithFormat:@"%@", result];
    for (NSString *removable in [NSArray arrayWithObjects:@" ", @"<", @">", nil]) {
        hex = [hex stringByReplacingOccurrencesOfString:removable withString:@""];
    }
    return hex;
}


@end
