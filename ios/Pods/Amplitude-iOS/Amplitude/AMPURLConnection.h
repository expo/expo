#if AMPLITUDE_SSL_PINNING
//
//  AMPURLConnection.h
//  Amplitude
//
//  Created by Allan on 3/13/15.
//  Copyright (c) 2015 Amplitude. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ISPPinnedNSURLConnectionDelegate.h"

@interface AMPURLConnection : ISPPinnedNSURLConnectionDelegate <NSURLConnectionDelegate,NSURLConnectionDataDelegate>

+ (void)sendAsynchronousRequest:(NSURLRequest *)request queue:(NSOperationQueue *)queue completionHandler:(void (^)(NSURLResponse *response, NSData *data, NSError *connectionError))handler;

@end
#endif
