#import "RNGetRandomValues.h"

@implementation RNGetRandomValues

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString*, getRandomBase64:(NSUInteger)byteLength) {
    NSMutableData *data = [NSMutableData dataWithLength:byteLength];
    int result = SecRandomCopyBytes(kSecRandomDefault, byteLength, data.mutableBytes);
    if (result != errSecSuccess) {
        @throw([NSException exceptionWithName:@"NO_RANDOM_BYTES" reason:@"Failed to aquire secure random bytes" userInfo:nil]);
    }
    return [data base64EncodedStringWithOptions:0];
}

@end
