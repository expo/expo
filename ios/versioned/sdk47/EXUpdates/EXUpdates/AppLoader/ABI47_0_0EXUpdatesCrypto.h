//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI47_0_0EXUpdatesVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^ABI47_0_0EXUpdatesVerifySignatureErrorBlock)(NSError *error);

@interface ABI47_0_0EXUpdatesCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(ABI47_0_0EXUpdatesConfig *)config
                   successBlock:(ABI47_0_0EXUpdatesVerifySignatureSuccessBlock)successBlock
                     errorBlock:(ABI47_0_0EXUpdatesVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
