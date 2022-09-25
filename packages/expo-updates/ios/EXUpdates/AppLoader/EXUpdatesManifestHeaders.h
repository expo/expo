//  Copyright © 2019 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesManifestHeaders : NSObject

@property (nonatomic, strong, readonly, nullable) NSString *protocolVersion;
@property (nonatomic, strong, readonly, nullable) NSString *serverDefinedHeaders;
@property (nonatomic, strong, readonly, nullable) NSString *manifestFilters;
/**
 * Classic updates Expo Go manifest signature
 */
@property (nonatomic, strong, readonly, nullable) NSString *manifestSignature;
/**
 * Code signing manifest signature
 */
@property (nonatomic, strong, readonly, nullable) NSString *signature;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithProtocolVersion:(nullable NSString *)protocolVersion
                   serverDefinedHeaders:(nullable NSString *)serverDefinedHeaders
                        manifestFilters:(nullable NSString *)manifestFilters
                      manifestSignature:(nullable NSString *)manifestSignature
                              signature:(nullable NSString *)signature NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
