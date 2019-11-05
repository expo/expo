//
//  EXOtaApiClient.h
//  EXOta
//
//  Created by Michał Czernek on 09/10/2019.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXRequestSuccessBlock)(NSData* response);
typedef void (^EXRequestErrorBlock)(NSError* error);

@interface EXOtaApiClient : NSObject<NSURLSessionTaskDelegate>

- (void)performRequest:(nonnull NSString *)url withHeaders:(nullable NSDictionary *)headers withTimeout:(NSInteger)timeout success:(nonnull EXRequestSuccessBlock)successBlock error:(nonnull EXRequestErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
