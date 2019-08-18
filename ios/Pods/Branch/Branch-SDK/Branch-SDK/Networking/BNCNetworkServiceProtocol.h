//
//  BNCNetworkServiceProtocol.h
//  Branch-SDK
//
//  Created by Edward Smith on 5/30/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

#pragma mark BNCNetworkOperationProtocol

///-----------------------------------------------------------------------------------
/// @name The `BNCNetworkServiceProtocol` and `BNCNetworkOperationProtocol` protocols.
///-----------------------------------------------------------------------------------

/**
 The protocols `BNCNetworkServiceProtocol` and `BNCNetworkOperationProtocol` describe the methods
 needed to create a drop in replacement for the standard Branch SDK networking.

 See `Branch-SDK/Network/BNCNetworkService.h` and `Branch-SDK/Network/BNCNetworkService.m` for a
 concrete example of how to implement the BNCNetworkServiceProtocol and BNCNetworkOperationProtocol
 protocols.

 Usage
 -----
 
 1. Create your own network service class that follows the `BNCNetworkServiceProtocol`.
    The `new` and `networkOperationWithURLRequest:completion:` methods are required. The
    others are optional.

 2. Create your own network operation class that follows the `BNCNetworkOperationProtocol`.
    The `start` method is required, as are all the getters for request, response, error, and date
    data items.

 3. In your app delegate, set your network class by calling `[Branch setNetworkServiceClass:]` with
    your network class as a parameter. This method must be called before initializing the Branch 
    shared object.

*/
@protocol BNCNetworkOperationProtocol <NSObject>

/// The initial NSMutableURLRequest.
@required
@property (readonly, copy) NSURLRequest *request;

/// The response from the server.
@required
@property (readonly, copy) NSHTTPURLResponse *response;

/// The data from the server.
@required
@property (readonly, strong) NSData *responseData;

/// Any errors that occurred during the request.
@required
@property (readonly, copy) NSError *error;

/// The original start date of the operation. This should be set by the network service provider
/// when the operation is started.
@required
@property (readonly, copy) NSDate *startDate;

/// The timeout date for the operation.  This is calculated and set by the underlying network service
/// provider by taking the original start date and adding the timeout interval of the URL request.
/// It should be set once (and not recalculated for each retry) by the network service.
@required
@property (readonly, copy) NSDate *timeoutDate;

/// A dictionary for the Branch SDK to store operation user info.
@required
@property (strong) NSDictionary *userInfo;

/// Starts the network operation.
@required
- (void) start;

/// Cancels a queued or in progress network operation.
@optional
- (void) cancel;

@end

#pragma mark - BNCNetworkServiceProtocol

/** 
    The `BNCNetworkServiceProtocol` defines a network service that handles a queue of network
    operations.
*/
@protocol BNCNetworkServiceProtocol <NSObject>

/// Creates and returns a new network service.
@required
+ (id<BNCNetworkServiceProtocol>) new;

/// Cancel all current and queued network operations.
@optional
- (void) cancelAllOperations;

/// Create and return a new network operation object. The network operation is not started until
/// `[operation start]` is called.
@required
- (id<BNCNetworkOperationProtocol>) networkOperationWithURLRequest:(NSMutableURLRequest*)request
                completion:(void (^)(id<BNCNetworkOperationProtocol>operation))completion;

/// A dictionary for the Branch SDK to store operation user info.
@required
@property (strong) NSDictionary *userInfo;

/// Pins the session to the array of public keys.
@optional
- (NSError*) pinSessionToPublicSecKeyRefs:(NSArray/**<SecKeyRef>*/*)publicKeys;

@end
