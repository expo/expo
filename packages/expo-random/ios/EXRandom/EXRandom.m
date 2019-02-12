// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXRandom/EXRandom.h>

@implementation EXRandom

EX_EXPORT_MODULE(ExpoRandom);

EX_EXPORT_METHOD_AS(getRandomIntegerAsync,
                    getRandomIntegerAsync:(NSNumber *)length
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  NSUInteger _length = [length unsignedIntegerValue];
  NSMutableData *bytes = [NSMutableData dataWithLength:_length];
  
  OSStatus result = SecRandomCopyBytes(kSecRandomDefault, _length, [bytes mutableBytes]);
  if (result == errSecSuccess) {
    resolve([bytes base64EncodedStringWithOptions:0]);
  } else {
    reject(@"ERR_RANDOM", @"Failed to create a secure random number", [NSError errorWithDomain:@"expo-random" code:result userInfo:nil]);
  }
}


@end
