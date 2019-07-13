//  Copyright © 2019 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

@class EXUpdatesAppLoader;

@protocol EXUpdatesAppLoaderDelegate <NSObject>

- (void)appLoader:(EXUpdatesAppLoader *)appLoader didStartLoadingUpdateWithMetadata:(NSDictionary * _Nullable)metadata;
- (void)appLoader:(EXUpdatesAppLoader *)appLoader didFinishLoadingUpdateWithId:(NSUUID *)updateId;
- (void)appLoader:(EXUpdatesAppLoader *)appLoader didFailWithError:(NSError *)error;

@end

@interface EXUpdatesAppLoader : NSObject

@property (nonatomic, weak) id<EXUpdatesAppLoaderDelegate> delegate;

- (void)loadUpdateFromUrl:(NSURL *)url;

@end

NS_ASSUME_NONNULL_END
