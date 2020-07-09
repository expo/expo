//
//  BNCNetworkService.h
//  Branch-SDK
//
//  Created by Edward Smith on 5/30/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "BNCNetworkServiceProtocol.h"

/**
 BNCNetworkService and BNCNetworkOperation

 The BNCNetworkService and BNCNetworkOperation classes are concrete implementations of the
 BNCNetworkServiceProtocol and BNCNetworkOperationProtocol protocols.
*/

#pragma mark BNCNetworkOperation

@interface BNCNetworkOperation : NSObject <BNCNetworkOperationProtocol>
@property (readonly, copy)   NSURLRequest       *request;
@property (readonly, copy)   NSHTTPURLResponse  *response;
@property (readonly, strong) NSData             *responseData;
@property (readonly, copy)   NSError            *error;
@property (readonly, copy)   NSDate             *startDate;
@property (readonly, copy)   NSDate             *timeoutDate;
@property (strong)           NSDictionary       *userInfo;

- (void) start;
- (void) cancel;
@end

#pragma mark - BNCNetworkService

@interface BNCNetworkService : NSObject <BNCNetworkServiceProtocol>
+ (instancetype) new;

- (void) cancelAllOperations;

- (BNCNetworkOperation*) networkOperationWithURLRequest:(NSMutableURLRequest*)request
                completion:(void (^)(id<BNCNetworkOperationProtocol>operation))completion;

- (NSError*) pinSessionToPublicSecKeyRefs:(NSArray/**<SecKeyRef>*/*)publicKeys;

@property (strong) NSDictionary *userInfo;
@end
