#if AMPLITUDE_SSL_PINNING
//
//  AMPURLSession.h
//  Amplitude
//
//  Created by Daniel Jih on 9/14/17.
//  Copyright (c) 2017 Amplitude. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ISPPinnedNSURLSessionDelegate.h"

@interface AMPURLSession : ISPPinnedNSURLSessionDelegate <NSURLSessionDelegate, NSURLSessionTaskDelegate, NSURLSessionDataDelegate>

+ (AMPURLSession *)sharedSession;
- (NSURLSessionDataTask *)dataTaskWithRequest:(NSURLRequest *)request completionHandler:(void (^)(NSData *data, NSURLResponse *response, NSError *error))completionHandler;

@end
#endif
