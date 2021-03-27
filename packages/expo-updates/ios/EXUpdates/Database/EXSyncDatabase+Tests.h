// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncDatabase.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncDatabase (Tests)

- (nullable NSArray<NSDictionary *> *)_executeSql:(NSString *)sql withArgs:(nullable NSArray *)args error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
