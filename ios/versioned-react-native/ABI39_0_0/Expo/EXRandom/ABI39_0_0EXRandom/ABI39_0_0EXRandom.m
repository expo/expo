// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXRandom/ABI39_0_0EXRandom.h>

@implementation ABI39_0_0EXRandom

static NSString * const ABI39_0_0EXRandomError = @"ERR_RANDOM";
static NSString * const ABI39_0_0EXRandomRandomBytesFailedError = @"Failed to create secure random number";

ABI39_0_0RCT_EXPORT_MODULE(ExpoRandom);

ABI39_0_0RCT_EXPORT_METHOD(getRandomBase64StringAsync:(NSUInteger)length
                  resolve:(ABI39_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI39_0_0RCTPromiseRejectBlock)reject) {
    NSError *error;
    NSString *value = [self _getRandomBase64String:length error:&error];
    if (value != nil) {
        resolve(value);
    } else {
        reject(ABI39_0_0EXRandomError, ABI39_0_0EXRandomRandomBytesFailedError, error);
    }
}

ABI39_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString*, getRandomBase64String:(NSUInteger)length) {
    NSError *error;
    NSString *value = [self _getRandomBase64String:length error:&error];

    if (value != nil) {
        return value;
    } else {
        @throw [NSException exceptionWithName:ABI39_0_0EXRandomError reason:ABI39_0_0EXRandomRandomBytesFailedError userInfo:@{@"errorCode": @(error.code)}];
    }
}

#pragma mark - Internal methods

- (NSString *)_getRandomBase64String:(NSUInteger)length
                              error:(NSError **)error {
    NSMutableData *bytes = [NSMutableData dataWithLength:length];

    OSStatus result = SecRandomCopyBytes(kSecRandomDefault, length, [bytes mutableBytes]);
    if (result == errSecSuccess) {
        return [bytes base64EncodedStringWithOptions:0];
    } else if (error) {
        *error = [NSError errorWithDomain:@"expo-random" code:result userInfo:nil];
    }
    return nil;
}

@end
