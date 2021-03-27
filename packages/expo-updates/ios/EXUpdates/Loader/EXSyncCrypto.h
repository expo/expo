//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXSyncVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^EXSyncVerifySignatureErrorBlock)(NSError *error);

@interface EXSyncCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(EXSyncConfig *)config
                   successBlock:(EXSyncVerifySignatureSuccessBlock)successBlock
                     errorBlock:(EXSyncVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
