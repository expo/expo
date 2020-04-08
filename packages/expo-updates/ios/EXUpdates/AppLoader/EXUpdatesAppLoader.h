//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppLoaderSuccessBlock)(EXUpdatesUpdate * _Nullable update);
typedef void (^EXUpdatesAppLoaderErrorBlock)(NSError *error);

@interface EXUpdatesAppLoader : NSObject

- (instancetype)initWithCompletionQueue:(dispatch_queue_t)completionQueue;
- (void)loadUpdateFromUrl:(NSURL *)url
                  success:(EXUpdatesAppLoaderSuccessBlock)success
                    error:(EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
