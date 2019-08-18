#import <Foundation/Foundation.h>
#import "SEGIntegrationFactory.h"
#import "SEGHTTPClient.h"
#import "SEGStorage.h"

NS_ASSUME_NONNULL_BEGIN


@interface SEGSegmentIntegrationFactory : NSObject <SEGIntegrationFactory>

@property (nonatomic, strong) SEGHTTPClient *client;
@property (nonatomic, strong) id<SEGStorage> storage;

- (instancetype)initWithHTTPClient:(SEGHTTPClient *)client storage:(id<SEGStorage>)storage;

@end

NS_ASSUME_NONNULL_END
