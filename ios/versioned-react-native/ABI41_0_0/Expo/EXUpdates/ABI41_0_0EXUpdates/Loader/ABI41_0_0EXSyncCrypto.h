//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI41_0_0EXSyncVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^ABI41_0_0EXSyncVerifySignatureErrorBlock)(NSError *error);

@interface ABI41_0_0EXSyncCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(ABI41_0_0EXSyncConfig *)config
                   successBlock:(ABI41_0_0EXSyncVerifySignatureSuccessBlock)successBlock
                     errorBlock:(ABI41_0_0EXSyncVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
