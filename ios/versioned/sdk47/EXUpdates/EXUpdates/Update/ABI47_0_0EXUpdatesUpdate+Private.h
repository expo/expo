//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAsset.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesUpdate ()

@property (nonatomic, strong, readwrite) NSUUID *updateId;
@property (nonatomic, strong, readwrite) NSString *scopeKey;
@property (nonatomic, strong, readwrite) NSDate *commitTime;
@property (nonatomic, strong, readwrite) NSString *runtimeVersion;
@property (nonatomic, strong, readwrite, nullable) NSDictionary *manifestJSON;
@property (nonatomic, assign, readwrite) BOOL keep;
@property (nonatomic, strong, readwrite) NSURL *bundleUrl;
@property (nonatomic, strong, readwrite) NSArray<ABI47_0_0EXUpdatesAsset *> *assets;
@property (nonatomic, assign, readwrite) BOOL isDevelopmentMode;

@property (nonatomic, strong, readwrite, nullable) NSDictionary *serverDefinedHeaders;
@property (nonatomic, strong, readwrite, nullable) NSDictionary *manifestFilters;

@property (nonatomic, strong) ABI47_0_0EXUpdatesConfig *config;
@property (nonatomic, strong, nullable) ABI47_0_0EXUpdatesDatabase *database;

- (instancetype)initWithManifest:(ABI47_0_0EXManifestsManifest *)manifest
                             config:(ABI47_0_0EXUpdatesConfig *)config
                           database:(nullable ABI47_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
