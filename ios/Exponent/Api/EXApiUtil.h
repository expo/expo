// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^EXVerifySignatureErrorBlock)(NSError *error);

@interface EXApiUtil : NSObject

/**
 * Verify data using a RSA+SHA256 base64 signature string and the public key at #{publicKeyUrl}.
 * The public key must be in `pem` format and will be downloaded and cached.
 *
 * @param publicKeyUrl Url of the public key
 * @param data         The data string to verify
 * @param signature    The signature string to verify with
 * @param successBlock Called when the verification is finished with the result
 * @param errorBlock   Called if an error occured, eg. a network error downloading the key
 */
+ (void)verifySignatureWithPublicKeyUrl:(NSURL *)publicKeyUrl
                                   data:(NSString *)data
                              signature:(NSString *)signature
                           successBlock:(EXVerifySignatureSuccessBlock)successBlock
                             errorBlock:(EXVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
