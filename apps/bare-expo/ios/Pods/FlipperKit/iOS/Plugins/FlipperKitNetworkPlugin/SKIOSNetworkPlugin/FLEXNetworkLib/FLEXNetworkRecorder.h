/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <FlipperKitNetworkPlugin/SKNetworkReporter.h>

// Notifications posted when the record is updated
extern NSString* const kFLEXNetworkRecorderNewTransactionNotification;
extern NSString* const kFLEXNetworkRecorderTransactionUpdatedNotification;
extern NSString* const kFLEXNetworkRecorderUserInfoTransactionKey;
extern NSString* const kFLEXNetworkRecorderTransactionsClearedNotification;

@class FLEXNetworkTransaction;

@interface FLEXNetworkRecorder : NSObject

/// In general, it only makes sense to have one recorder for the entire
/// application.
+ (instancetype)defaultRecorder;

@property(nonatomic, weak) id<SKNetworkReporterDelegate> delegate;

/// Defaults to 25 MB if never set. Values set here are presisted across
/// launches of the app.
@property(nonatomic, assign) NSUInteger responseCacheByteLimit;

/// If NO, the recorder not cache will not cache response for content types with
/// an "image", "video", or "audio" prefix.
@property(nonatomic, assign) BOOL shouldCacheMediaResponses;

@property(nonatomic, copy) NSArray<NSString*>* hostBlacklist;

// Accessing recorded network activity

/// Array of FLEXNetworkTransaction objects ordered by start time with the
/// newest first.
- (NSArray<FLEXNetworkTransaction*>*)networkTransactions;

/// The full response data IFF it hasn't been purged due to memory pressure.
- (NSData*)cachedResponseBodyForTransaction:
    (FLEXNetworkTransaction*)transaction;

/// Dumps all network transactions and cached response bodies.
- (void)clearRecordedActivity;

// Recording network activity

/// Call when app is about to send HTTP request.
- (void)recordRequestWillBeSentWithRequestID:(NSString*)requestID
                                     request:(NSURLRequest*)request
                            redirectResponse:(NSURLResponse*)redirectResponse;

/// Call when HTTP response is available.
- (void)recordResponseReceivedWithRequestID:(NSString*)requestID
                                   response:(NSURLResponse*)response;

/// Call when data chunk is received over the network.
- (void)recordDataReceivedWithRequestID:(NSString*)requestID
                             dataLength:(int64_t)dataLength;

/// Call when HTTP request has finished loading.
- (void)recordLoadingFinishedWithRequestID:(NSString*)requestID
                              responseBody:(NSData*)responseBody;

/// Call when HTTP request has failed to load.
- (void)recordLoadingFailedWithRequestID:(NSString*)requestID
                                   error:(NSError*)error;

/// Call to set the request mechanism anytime after recordRequestWillBeSent...
/// has been called. This string can be set to anything useful about the API
/// used to make the request.
- (void)recordMechanism:(NSString*)mechanism forRequestID:(NSString*)requestID;

@end
