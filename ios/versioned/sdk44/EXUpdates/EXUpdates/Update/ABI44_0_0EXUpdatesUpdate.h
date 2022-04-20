//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAsset.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesManifestHeaders.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifest.h>

@class ABI44_0_0EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

/**
 * Download status that indicates whether or under what conditions an
 * update is able to be launched.
 *
 * It's important that the integer value of each status stays constant across
 * all versions of this library since they are stored in SQLite on user devices.
 */
typedef NS_ENUM(NSInteger, ABI44_0_0EXUpdatesUpdateStatus) {
  ABI44_0_0EXUpdatesUpdateStatus0_Unused = 0,
  /**
   * The update has been fully downloaded and is ready to launch.
   */
  ABI44_0_0EXUpdatesUpdateStatusReady = 1,
  ABI44_0_0EXUpdatesUpdateStatus2_Unused = 2,
  /**
   * The update manifest has been download from the server but not all
   * assets have finished downloading successfully.
   */
  ABI44_0_0EXUpdatesUpdateStatusPending = 3,
  ABI44_0_0EXUpdatesUpdateStatus4_Unused = 4,
  /**
   * The update has been partially loaded (copied) from its location
   * embedded in the app bundle, but not all assets have been copied
   * successfully. The update may be able to be launched directly from
   * its embedded location unless a new binary version with a new
   * embedded update has been installed.
   */
  ABI44_0_0EXUpdatesUpdateStatusEmbedded = 5,
  /**
   * The update manifest has been downloaded and indicates that the
   * update is being served from a developer tool. It can be launched by a
   * host application that can run a development bundle.
   */
  ABI44_0_0EXUpdatesUpdateStatusDevelopment = 6
};

@interface ABI44_0_0EXUpdatesUpdate : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *scopeKey;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary *manifestJSON;
@property (nonatomic, assign, readonly) BOOL keep;
@property (nonatomic, strong, readonly) NSArray<ABI44_0_0EXUpdatesAsset *> *assets;
@property (nonatomic, assign, readonly) BOOL isDevelopmentMode;

@property (nonatomic, strong, readonly, nullable) NSDictionary *serverDefinedHeaders;
@property (nonatomic, strong, readonly, nullable) NSDictionary *manifestFilters;

@property (nonatomic, strong, readonly) ABI44_0_0EXManifestsManifest *manifest;

@property (nonatomic, assign) ABI44_0_0EXUpdatesUpdateStatus status;
@property (nonatomic, strong) NSDate *lastAccessed;
@property (nonatomic, assign) NSInteger successfulLaunchCount;
@property (nonatomic, assign) NSInteger failedLaunchCount;

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    manifest:(nullable NSDictionary *)manifest
                      status:(ABI44_0_0EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(ABI44_0_0EXUpdatesConfig *)config
                    database:(ABI44_0_0EXUpdatesDatabase *)database;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                   manifestHeaders:(ABI44_0_0EXUpdatesManifestHeaders *)manifestHeaders
                        extensions:(NSDictionary *)extensions
                            config:(ABI44_0_0EXUpdatesConfig *)config
                          database:(ABI44_0_0EXUpdatesDatabase *)database
                             error:(NSError **)error;

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI44_0_0EXUpdatesConfig *)config
                                  database:(nullable ABI44_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
