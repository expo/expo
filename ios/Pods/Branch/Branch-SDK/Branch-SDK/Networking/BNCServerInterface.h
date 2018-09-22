//
//  BNCServerInterface.h
//  Branch-SDK
//
//  Created by Alex Austin on 6/4/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "BNCServerResponse.h"
#import "BNCPreferenceHelper.h"
#import "BNCNetworkServiceProtocol.h"

typedef void (^BNCServerCallback)(BNCServerResponse *response, NSError *error);

@interface BNCServerInterface : NSObject

- (void)getRequest:(NSDictionary *)params
               url:(NSString *)url
               key:(NSString *)key
          callback:(BNCServerCallback)callback;

- (BNCServerResponse *)postRequestSynchronous:(NSDictionary *)post
                                          url:(NSString *)url
                                          key:(NSString *)key;

- (void)postRequest:(NSDictionary *)post
                url:(NSString *)url
                key:(NSString *)key
           callback:(BNCServerCallback)callback;

- (void)genericHTTPRequest:(NSURLRequest *)request
               retryNumber:(NSInteger)retryNumber
                  callback:(BNCServerCallback)callback
              retryHandler:(NSURLRequest *(^)(NSInteger))retryHandler;

@property (strong, nonatomic) BNCPreferenceHelper *preferenceHelper;
@end
