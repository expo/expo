#import "RNAWSCognito.h"

static NSString* N_IN_HEX = @"FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF";

@implementation RNAWSCognito

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(computeModPow:(NSDictionary *)values
                  callback:(RCTResponseSenderBlock)callback) {
    JKBigInteger *target = [[JKBigInteger alloc] initWithString:values[@"target"] andRadix:16];
    JKBigInteger *value = [[JKBigInteger alloc] initWithString:values[@"value"] andRadix:16];
    JKBigInteger *modifier = [[JKBigInteger alloc] initWithString:values[@"modifier"] andRadix:16];
    JKBigInteger *result = [target pow:value andMod:modifier];
    if (result) {
        callback(@[[NSNull null], [result stringValueWithRadix:16]]);
    } else {
        callback(@[@[RCTMakeError(@"computeModPow error", nil, nil)], [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(computeS:(NSDictionary *)values
                  callback:(RCTResponseSenderBlock)callback) {
    JKBigInteger *N = [[JKBigInteger alloc] initWithString:N_IN_HEX andRadix:16];
    JKBigInteger *g = [[JKBigInteger alloc] initWithString:values[@"g"] andRadix:16];
    JKBigInteger *x = [[JKBigInteger alloc] initWithString:values[@"x"] andRadix:16];
    JKBigInteger *k = [[JKBigInteger alloc] initWithString:values[@"k"] andRadix:16];
    JKBigInteger *a = [[JKBigInteger alloc] initWithString:values[@"a"] andRadix:16];
    JKBigInteger *b = [[JKBigInteger alloc] initWithString:values[@"b"] andRadix:16];
    JKBigInteger *u = [[JKBigInteger alloc] initWithString:values[@"u"] andRadix:16];
    JKBigInteger *exp = [a add:[u multiply:x]];
    JKBigInteger *base = [b subtract:[k multiply:[g pow:x andMod:N]]];
    base = [self mod:base divisor:N];
    JKBigInteger *result = [base pow:exp andMod:N];
    result = [self mod:result divisor:N];
    if (result) {
        callback(@[[NSNull null], [result stringValueWithRadix:16]]);
    } else {
        callback(@[@[RCTMakeError(@"computeS error", nil, nil)], [NSNull null]]);
    }
}

- (JKBigInteger*) mod:(JKBigInteger*)dividend divisor:(JKBigInteger*) divisor {
    return [[divisor add:[dividend remainder:divisor]] remainder:divisor];
}

@end
