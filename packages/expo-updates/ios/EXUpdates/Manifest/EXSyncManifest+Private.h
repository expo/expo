//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncAsset.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncManifest ()

@property (nonatomic, strong, readwrite) NSUUID *updateId;
@property (nonatomic, strong, readwrite) NSString *scopeKey;
@property (nonatomic, strong, readwrite) NSDate *commitTime;
@property (nonatomic, strong, readwrite) NSString *runtimeVersion;
@property (nonatomic, strong, readwrite, nullable) NSDictionary *metadata;
@property (nonatomic, assign, readwrite) BOOL keep;
@property (nonatomic, strong, readwrite) NSURL *bundleUrl;
@property (nonatomic, strong, readwrite) NSArray<EXSyncAsset *> *assets;
@property (nonatomic, assign, readwrite) BOOL isDevelopmentMode;

@property (nonatomic, strong, readwrite, nullable) NSDictionary *serverDefinedHeaders;
@property (nonatomic, strong, readwrite, nullable) NSDictionary *manifestFilters;

@property (nonatomic, strong) EXSyncConfig *config;
@property (nonatomic, strong, nullable) EXSyncDatabase *database;

- (instancetype)initWithRawManifest:(NSDictionary *)manifest
                             config:(EXSyncConfig *)config
                           database:(nullable EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
