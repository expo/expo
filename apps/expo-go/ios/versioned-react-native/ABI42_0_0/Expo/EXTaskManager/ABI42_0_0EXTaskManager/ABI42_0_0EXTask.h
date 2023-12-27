// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMTaskManagerInterface/ABI42_0_0UMTaskManagerInterface.h>
#import <ABI42_0_0UMTaskManagerInterface/ABI42_0_0UMTaskInterface.h>
#import <ABI42_0_0UMTaskManagerInterface/ABI42_0_0UMTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXTaskDelegate <NSObject>

- (void)executeTask:(nonnull id<ABI42_0_0UMTaskInterface>)task
           withData:(nullable NSDictionary *)data
          withError:(nullable NSError *)error;

@end

@interface ABI42_0_0EXTask : NSObject <ABI42_0_0UMTaskInterface>

@property (nonatomic, strong, readonly) NSString *name;
@property (nonatomic, strong, readonly) NSString *appId;
@property (nonatomic, strong, readonly) NSString *appUrl;
@property (nonatomic, strong, readonly) id<ABI42_0_0UMTaskConsumerInterface> consumer;
@property (nonatomic, strong) NSDictionary *options;
@property (nonatomic, weak) id<ABI42_0_0EXTaskDelegate> delegate;

- (instancetype)initWithName:(nonnull NSString *)name
                       appId:(nonnull NSString *)appId
                      appUrl:(nonnull NSString *)appUrl
               consumerClass:(Class)consumerClass
                     options:(nullable NSDictionary *)options
                    delegate:(nullable id<ABI42_0_0EXTaskDelegate>)delegate;

- (void)executeWithData:(nullable NSDictionary *)data withError:(nullable NSError *)error;

@end

NS_ASSUME_NONNULL_END
