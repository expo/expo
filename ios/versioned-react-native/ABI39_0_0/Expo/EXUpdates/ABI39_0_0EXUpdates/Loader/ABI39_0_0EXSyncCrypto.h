//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI39_0_0EXSyncVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^ABI39_0_0EXSyncVerifySignatureErrorBlock)(NSError *error);

@interface ABI39_0_0EXSyncCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(ABI39_0_0EXSyncConfig *)config
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(ABI39_0_0EXSyncVerifySignatureSuccessBlock)successBlock
                     errorBlock:(ABI39_0_0EXSyncVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
