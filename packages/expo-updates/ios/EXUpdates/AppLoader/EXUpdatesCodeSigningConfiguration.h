//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesCodeSigningAlgorithm.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesCodeSigningConfiguration : NSObject

@property (nonatomic, strong, readonly) NSString *certificateString;
@property (nonatomic, strong, readonly, nullable) NSDictionary<NSString *, NSString *> *metadata;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCertificateString:(NSString *)certificateString
                                 metadata:(nullable NSDictionary<NSString *, NSString *> *)metadata NS_DESIGNATED_INITIALIZER;

- (NSString *)privateKey;
- (NSString *)keyId;
- (EXUpdatesCodeSigningAlgorithm)algorithm;

@end

NS_ASSUME_NONNULL_END
