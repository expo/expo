//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI39_0_0EXUpdatesVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^ABI39_0_0EXUpdatesVerifySignatureErrorBlock)(NSError *error);

@interface ABI39_0_0EXUpdatesCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(ABI39_0_0EXUpdatesConfig *)config
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(ABI39_0_0EXUpdatesVerifySignatureSuccessBlock)successBlock
                     errorBlock:(ABI39_0_0EXUpdatesVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
