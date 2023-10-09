// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRecord.h"

@class RCTBridge;
@class EXReactAppManager;
@class EXKernelAppRegistry;

NS_ASSUME_NONNULL_BEGIN

@protocol EXKernelAppRegistryDelegate <NSObject>

- (void)appRegistry:(EXKernelAppRegistry *)registry didRegisterAppRecord:(EXKernelAppRecord *)appRecord;
- (void)appRegistry:(EXKernelAppRegistry *)registry willUnregisterAppRecord:(EXKernelAppRecord *)appRecord;

@end

@interface EXKernelAppRegistry : NSObject

- (void)registerHomeAppRecord:(EXKernelAppRecord *)homeRecord;
- (void)unregisterHomeAppRecord;

- (NSString *)registerAppWithManifestUrl:(NSURL *)manifestUrl initialProps:(NSDictionary *)initialProps;
- (void)unregisterAppWithRecordId:(NSString *)recordId;
- (void)unregisterAppWithRecord:(nullable EXKernelAppRecord *)appRecord;

@property (nonatomic, weak) id<EXKernelAppRegistryDelegate> delegate;

/**
 *  If Expo Home is available, return the record representing the Home app.
 */
@property (nonatomic, readonly, nullable) EXKernelAppRecord *homeAppRecord;

- (EXKernelAppRecord *)recordForId:(NSString *)recordId;
- (EXKernelAppRecord * _Nullable)newestRecordWithScopeKey:(NSString *)scopeKey;
- (NSEnumerator<id> *)appEnumerator; // does not include home
- (BOOL)isScopeKeyUnique:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
