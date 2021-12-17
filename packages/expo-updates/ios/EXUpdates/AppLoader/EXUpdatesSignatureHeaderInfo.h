//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesCodeSigningAlgorithm.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesCodeSigningSignatureStructuredFieldKeySignature = @"sig";
static NSString * const EXUpdatesCodeSigningSignatureStructuredFieldKeyKeyId = @"keyid";
static NSString * const EXUpdatesCodeSigningSignatureStructuredFieldKeyAlgorithm = @"alg";

static NSString * const EXUpdatesCodeSigningMetadataDefaultKeyId = @"root";

@interface EXUpdatesSignatureHeaderInfo : NSObject

@property (nonatomic, strong, readonly) NSString *signature;
@property (nonatomic, strong, readonly) NSString *keyId;
@property (nonatomic, assign, readonly) EXUpdatesCodeSigningAlgorithm algorithm;

- (instancetype)init NS_UNAVAILABLE;

+ (instancetype)parseSignatureHeader:(nullable NSString *)signatureHeader;

+ (EXUpdatesCodeSigningAlgorithm)codeSigningAlgorithmFromRawString:(nullable NSString *)rawString;

@end

NS_ASSUME_NONNULL_END
