/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "UIKit/UIKit.h"

typedef NS_ENUM(NSInteger, FLEXNetworkTransactionState) {
  FLEXNetworkTransactionStateUnstarted,
  FLEXNetworkTransactionStateAwaitingResponse,
  FLEXNetworkTransactionStateReceivingData,
  FLEXNetworkTransactionStateFinished,
  FLEXNetworkTransactionStateFailed
};

@interface FLEXNetworkTransaction : NSObject

@property(nonatomic, copy) NSString* requestID;

@property(nonatomic, strong) NSURLRequest* request;
@property(nonatomic, strong) NSURLResponse* response;
@property(nonatomic, copy) NSString* requestMechanism;
@property(nonatomic, assign) FLEXNetworkTransactionState transactionState;
@property(nonatomic, strong) NSError* error;

@property(nonatomic, strong) NSDate* startTime;
@property(nonatomic, assign) NSTimeInterval latency;
@property(nonatomic, assign) NSTimeInterval duration;

@property(nonatomic, assign) int64_t receivedDataLength;

/// Only applicable for image downloads. A small thumbnail to preview the full
/// response.
@property(nonatomic, strong) UIImage* responseThumbnail;

/// Populated lazily. Handles both normal HTTPBody data and HTTPBodyStreams.
@property(nonatomic, strong, readonly) NSData* cachedRequestBody;

+ (NSString*)readableStringFromTransactionState:
    (FLEXNetworkTransactionState)state;

@end
