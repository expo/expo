//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAsset.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI48_0_0EXUpdatesDatabaseHashType) {
  ABI48_0_0EXUpdatesDatabaseHashTypeSha1 = 0
};

/**
 * SQLite database that keeps track of updates currently loaded/loading to disk, including the
 * update manifest and metadata, status, and the individual assets (including bundles/bytecode) that
 * comprise the update. (Assets themselves are stored on the device's file system, and a relative
 * path is kept in SQLite.)
 *
 * SQLite allows a many-to-many relationship between updates and assets, which means we can keep
 * only one copy of each asset on disk at a time while also being able to clear unused assets with
 * relative ease (see ABI48_0_0EXUpdatesReaper).
 *
 * Occasionally it's necessary to add migrations when the data structures for updates or assets must
 * change. Extra care must be taken here, since these migrations will happen on users' devices for
 * apps we do not control. See
 * https://github.com/expo/expo/blob/main/packages/expo-updates/guides/migrations.md for step by
 * step instructions.
 *
 * ABI48_0_0EXUpdatesDatabase provides a serial queue on which all database operations must be run (methods
 * in this class will assert). This is primarily for control over what high-level operations
 * involving the database can occur simultaneously - e.g. we don't want to be trying to download a
 * new update at the same time ABI48_0_0EXUpdatesReaper is running.
 *
 * The `scopeKey` field in various methods here is only relevant in environments such as Expo Go in
 * which updates from multiple scopes can be launched.
 */
@interface ABI48_0_0EXUpdatesDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(ABI48_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<ABI48_0_0EXUpdatesAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
/**
 * This method may return NO if a matching entry for the existing asset cannot be found in the database.
 * In this case, the error pointer will not be set.
 */
- (BOOL)addExistingAsset:(ABI48_0_0EXUpdatesAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(ABI48_0_0EXUpdatesAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(ABI48_0_0EXUpdatesAsset *)asset withExistingEntry:(ABI48_0_0EXUpdatesAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(ABI48_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)markUpdateAccessed:(ABI48_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)incrementSuccessfulLaunchCountForUpdate:(ABI48_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)incrementFailedLaunchCountForUpdate:(ABI48_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)setScopeKey:(NSString *)scopeKey onUpdate:(ABI48_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)markMissingAssets:(NSArray<ABI48_0_0EXUpdatesAsset *> *)assets error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<ABI48_0_0EXUpdatesUpdate *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI48_0_0EXUpdatesAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

/**
 * This method ignores the scopeKey field in the config object and returns ALL updates in the database.
 * The config object is passed along to each update object, even if its scopeKey doesn't match.
 *
 * Updates returned from this method should not be used to launch.
 */
- (nullable NSArray<ABI48_0_0EXUpdatesUpdate *> *)allUpdatesWithConfig:(ABI48_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI48_0_0EXUpdatesUpdate *> *)allUpdatesWithStatus:(ABI48_0_0EXUpdatesUpdateStatus)status config:(ABI48_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<NSUUID *> *)allUpdateIdsWithStatus:(ABI48_0_0EXUpdatesUpdateStatus)status error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI48_0_0EXUpdatesUpdate *> *)launchableUpdatesWithConfig:(ABI48_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable ABI48_0_0EXUpdatesUpdate *)updateWithId:(NSUUID *)updateId config:(ABI48_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI48_0_0EXUpdatesAsset *> *)allAssetsWithError:(NSError ** _Nullable)error;
- (nullable NSArray<ABI48_0_0EXUpdatesAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable ABI48_0_0EXUpdatesAsset *)assetWithKey:(nullable NSString *)key error:(NSError ** _Nullable)error;

- (nullable NSDictionary *)serverDefinedHeadersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (nullable NSDictionary *)manifestFiltersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (nullable NSDictionary *)staticBuildDataWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setServerDefinedHeaders:(NSDictionary *)serverDefinedHeaders withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setManifestFilters:(NSDictionary *)manifestFilters withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setMetadataWithManifest:(ABI48_0_0EXUpdatesUpdate *)updateManifest error:(NSError ** _Nullable)error;
- (void)setStaticBuildData:(NSDictionary *)staticBuildData withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
