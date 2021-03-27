//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI40_0_0EXSyncVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^ABI40_0_0EXSyncVerifySignatureErrorBlock)(NSError *error);

@interface ABI40_0_0EXSyncCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(ABI40_0_0EXSyncConfig *)config
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(ABI40_0_0EXSyncVerifySignatureSuccessBlock)successBlock
                     errorBlock:(ABI40_0_0EXSyncVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
