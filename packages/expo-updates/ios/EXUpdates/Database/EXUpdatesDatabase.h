//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesDatabaseHashType) {
  EXUpdatesDatabaseHashTypeSha1 = 0
};

@interface EXUpdatesDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<EXUpdatesAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
/**
 * This method may return NO if a matching entry for the existing asset cannot be found in the database.
 * In this case, the error pointer will not be set.
 */
- (BOOL)addExistingAsset:(EXUpdatesAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(EXUpdatesAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(EXUpdatesAsset *)asset withExistingEntry:(EXUpdatesAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)markUpdateAccessed:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)incrementSuccessfulLaunchCountForUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)incrementFailedLaunchCountForUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)setScopeKey:(NSString *)scopeKey onUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)markMissingAssets:(NSArray<EXUpdatesAsset *> *)assets error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<EXUpdatesUpdate *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

/**
 * This method ignores the scopeKey field in the config object and returns ALL updates in the database.
 * The config object is passed along to each update object, even if its scopeKey doesn't match.
 *
 * Updates returned from this method should not be used to launch.
 */
- (nullable NSArray<EXUpdatesUpdate *> *)allUpdatesWithConfig:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesUpdate *> *)allUpdatesWithStatus:(EXUpdatesUpdateStatus)status config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesUpdate *> *)launchableUpdatesWithConfig:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable EXUpdatesUpdate *)updateWithId:(NSUUID *)updateId config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesAsset *> *)allAssetsWithError:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable EXUpdatesAsset *)assetWithKey:(nullable NSString *)key error:(NSError ** _Nullable)error;

- (nullable NSDictionary *)serverDefinedHeadersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (nullable NSDictionary *)manifestFiltersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (nullable NSDictionary *)staticBuildDataWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setServerDefinedHeaders:(NSDictionary *)serverDefinedHeaders withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setManifestFilters:(NSDictionary *)manifestFilters withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setMetadataWithManifest:(EXUpdatesUpdate *)updateManifest error:(NSError ** _Nullable)error;
- (void)setStaticBuildData:(NSDictionary *)staticBuildData withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
