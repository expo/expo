//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncAsset.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>

@class ABI40_0_0EXSyncDatabase;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI40_0_0EXSyncManifestStatus) {
  ABI40_0_0EXSyncManifestStatusFailed = 0,
  ABI40_0_0EXSyncManifestStatusReady = 1,
  ABI40_0_0EXSyncManifestStatusLaunchable = 2,
  ABI40_0_0EXSyncManifestStatusPending = 3,
  ABI40_0_0EXSyncManifestStatusUnused = 4,
  ABI40_0_0EXSyncManifestStatusEmbedded = 5,
  ABI40_0_0EXSyncManifestStatusDevelopment = 6
};

@interface ABI40_0_0EXSyncManifest : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *scopeKey;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary * metadata;
@property (nonatomic, assign, readonly) BOOL keep;
@property (nonatomic, strong, readonly) NSArray<ABI40_0_0EXSyncAsset *> *assets;
@property (nonatomic, assign, readonly) BOOL isDevelopmentMode;

@property (nonatomic, strong, readonly) NSDictionary *rawManifest;

@property (nonatomic, assign) ABI40_0_0EXSyncManifestStatus status;

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    metadata:(nullable NSDictionary *)metadata
                      status:(ABI40_0_0EXSyncManifestStatus)status
                        keep:(BOOL)keep
                      config:(ABI40_0_0EXSyncConfig *)config
                    database:(ABI40_0_0EXSyncDatabase *)database;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                            config:(ABI40_0_0EXSyncConfig *)config
                          database:(ABI40_0_0EXSyncDatabase *)database;

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI40_0_0EXSyncConfig *)config
                                  database:(nullable ABI40_0_0EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
