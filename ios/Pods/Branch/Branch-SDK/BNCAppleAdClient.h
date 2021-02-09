//
//  BNCAppleAdClient.h
//  Branch
//
//  Created by Ernest Cho on 11/7/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// protocol for easier mocking of ADClient behavior in tests
@protocol BNCAppleAdClientProtocol <NSObject>

@required
- (void)requestAttributionDetailsWithBlock:(void (^)(NSDictionary<NSString *,NSObject *> *attributionDetails, NSError *error))completionHandler;

@end

@interface BNCAppleAdClient : NSObject <BNCAppleAdClientProtocol>

- (void)requestAttributionDetailsWithBlock:(void (^)(NSDictionary<NSString *,NSObject *> *attributionDetails, NSError *error))completionHandler;

@end

NS_ASSUME_NONNULL_END
