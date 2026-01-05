// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRecord.h"

@class RCTBridge;
@class EXReactAppManager;
@class EXKernelAppRegistry;

NS_ASSUME_NONNULL_BEGIN

@interface EXKernelAppRegistry : NSObject

- (NSString *)registerAppWithManifestUrl:(NSURL *)manifestUrl initialProps:(NSDictionary *)initialProps;
- (void)unregisterAppWithRecordId:(NSString *)recordId;
- (void)unregisterAppWithRecord:(nullable EXKernelAppRecord *)appRecord;

- (EXKernelAppRecord *)recordForId:(NSString *)recordId;
- (EXKernelAppRecord * _Nullable)newestRecordWithScopeKey:(NSString *)scopeKey;
- (NSEnumerator<id> *)appEnumerator; // does not include home
- (BOOL)isScopeKeyUnique:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
