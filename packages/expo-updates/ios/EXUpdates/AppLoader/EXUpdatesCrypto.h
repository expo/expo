//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesSignatureHeaderInfo.h>
#import <EXUpdates/EXUpdatesCodeSigningConfiguration.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^EXUpdatesVerifySignatureErrorBlock)(NSError *error);

@interface EXUpdatesCrypto : NSObject

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(EXUpdatesConfig *)config
                   successBlock:(EXUpdatesVerifySignatureSuccessBlock)successBlock
                     errorBlock:(EXUpdatesVerifySignatureErrorBlock)errorBlock;

+ (BOOL)isValidSignatureHeaderInfo:(EXUpdatesSignatureHeaderInfo *)signatureHeaderInfo
       forCodeSigningConfiguration:(EXUpdatesCodeSigningConfiguration *)codeSigningConfiguration
                          bodyData:(NSData *)bodyData;

@end

NS_ASSUME_NONNULL_END
