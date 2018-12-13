// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXTaskManagerInterface/EXTaskManagerInterface.h>
#import <EXTaskManagerInterface/EXTaskInterface.h>
#import <EXTaskManagerInterface/EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXTaskDelegate <NSObject>

- (void)executeTask:(nonnull id<EXTaskInterface>)task
           withData:(nullable NSDictionary *)data
          withError:(nullable NSError *)error;

@end

@interface EXTask : NSObject <EXTaskInterface>

@property (nonatomic, strong, readonly) NSString *name;
@property (nonatomic, strong, readonly) NSString *appId;
@property (nonatomic, strong, readonly) NSString *appUrl;
@property (nonatomic, strong, readonly) id<EXTaskConsumerInterface> consumer;
@property (nonatomic, strong) NSDictionary *options;
@property (nonatomic, weak) id<EXTaskDelegate> delegate;

- (instancetype)initWithName:(nonnull NSString *)name
                       appId:(nonnull NSString *)appId
                      appUrl:(nonnull NSString *)appUrl
               consumerClass:(Class)consumerClass
                     options:(nullable NSDictionary *)options
                    delegate:(nullable id<EXTaskDelegate>)delegate;

- (void)executeWithData:(nullable NSDictionary *)data withError:(nullable NSError *)error;

@end

NS_ASSUME_NONNULL_END
