//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAsset.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>

@class ABI39_0_0EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI39_0_0EXUpdatesUpdateStatus) {
  ABI39_0_0EXUpdatesUpdateStatusFailed = 0,
  ABI39_0_0EXUpdatesUpdateStatusReady = 1,
  ABI39_0_0EXUpdatesUpdateStatusLaunchable = 2,
  ABI39_0_0EXUpdatesUpdateStatusPending = 3,
  ABI39_0_0EXUpdatesUpdateStatusUnused = 4,
  ABI39_0_0EXUpdatesUpdateStatusEmbedded = 5,
  ABI39_0_0EXUpdatesUpdateStatusDevelopment = 6
};

@interface ABI39_0_0EXUpdatesUpdate : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *scopeKey;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary * metadata;
@property (nonatomic, assign, readonly) BOOL keep;
@property (nonatomic, strong, readonly) NSArray<ABI39_0_0EXUpdatesAsset *> *assets;
@property (nonatomic, assign, readonly) BOOL isDevelopmentMode;

@property (nonatomic, strong, readonly) NSDictionary *rawManifest;

@property (nonatomic, assign) ABI39_0_0EXUpdatesUpdateStatus status;

+ (instancetype)updateWithId:(NSUUID *)updateId
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    metadata:(nullable NSDictionary *)metadata
                      status:(ABI39_0_0EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(ABI39_0_0EXUpdatesConfig *)config
                    database:(ABI39_0_0EXUpdatesDatabase *)database;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                            config:(ABI39_0_0EXUpdatesConfig *)config
                          database:(ABI39_0_0EXUpdatesDatabase *)database;

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI39_0_0EXUpdatesConfig *)config
                                  database:(nullable ABI39_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
