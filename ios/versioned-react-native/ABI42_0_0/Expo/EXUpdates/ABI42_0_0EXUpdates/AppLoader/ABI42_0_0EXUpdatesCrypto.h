//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI42_0_0EXUpdatesVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^ABI42_0_0EXUpdatesVerifySignatureErrorBlock)(NSError *error);

@interface ABI42_0_0EXUpdatesCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(ABI42_0_0EXUpdatesConfig *)config
                   successBlock:(ABI42_0_0EXUpdatesVerifySignatureSuccessBlock)successBlock
                     errorBlock:(ABI42_0_0EXUpdatesVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
