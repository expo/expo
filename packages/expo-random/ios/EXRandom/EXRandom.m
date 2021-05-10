// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXRandom/EXRandom.h>

@implementation EXRandom

static NSString * const EXRandomError = @"ERR_RANDOM";
static NSString * const EXRandomRandomBytesFailedError = @"Failed to create secure random number";

RCT_EXPORT_MODULE(ExpoRandom);

RCT_EXPORT_METHOD(getRandomBase64StringAsync:(NSUInteger)length
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error;
    NSString *value = [self _getRandomBase64String:length error:&error];
    if (value != nil) {
        resolve(value);
    } else {
        reject(EXRandomError, EXRandomRandomBytesFailedError, error);
    }
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString*, getRandomBase64String:(NSUInteger)length) {
    NSError *error;
    NSString *value = [self _getRandomBase64String:length error:&error];

    if (value != nil) {
        return value;
    } else {
        @throw [NSException exceptionWithName:EXRandomError reason:EXRandomRandomBytesFailedError userInfo:@{@"errorCode": @(error.code)}];
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
