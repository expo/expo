//  Copyright © 2019 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^EXUpdatesVerifySignatureErrorBlock)(NSError *error);

@interface EXUpdatesCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                   successBlock:(EXUpdatesVerifySignatureSuccessBlock)successBlock
                     errorBlock:(EXUpdatesVerifySignatureErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
