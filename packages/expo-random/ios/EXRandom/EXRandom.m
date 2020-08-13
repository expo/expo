// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXRandom/EXRandom.h>

@implementation EXRandom

RCT_EXPORT_MODULE(ExpoRandom);

RCT_EXPORT_METHOD(getRandomBase64StringAsync:(NSUInteger)length
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        resolve([self _getRandomBase64String:length]);
    }
    @catch(NSException *e) {
        reject(e.name, e.reason, nil);
    }
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString*, getRandomBase64String:(NSUInteger)length) {
    return [self _getRandomBase64String:length];
}

#pragma mark - Internal methods

- (NSString *)_getRandomBase64String:(NSUInteger)length {
    NSMutableData *bytes = [NSMutableData dataWithLength:length];

    OSStatus result = SecRandomCopyBytes(kSecRandomDefault, length, [bytes mutableBytes]);
    if (result == errSecSuccess) {
      return [bytes base64EncodedStringWithOptions:0];
    } else {
      @throw([NSException exceptionWithName:@"expo-random" reason:@"Failed to create secure random string" userInfo:nil]);
    }
}

@end
