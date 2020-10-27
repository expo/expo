/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FLEXNetworkRecorder.h"

#import "FLEXNetworkTransaction.h"
#import "FLEXUtility.h"

NSString* const kFLEXNetworkRecorderNewTransactionNotification =
    @"kFLEXNetworkRecorderNewTransactionNotification";
NSString* const kFLEXNetworkRecorderTransactionUpdatedNotification =
    @"kFLEXNetworkRecorderTransactionUpdatedNotification";
NSString* const kFLEXNetworkRecorderUserInfoTransactionKey = @"transaction";
NSString* const kFLEXNetworkRecorderTransactionsClearedNotification =
    @"kFLEXNetworkRecorderTransactionsClearedNotification";

NSString* const kFLEXNetworkRecorderResponseCacheLimitDefaultsKey =
    @"com.flex.responseCacheLimit";

@interface FLEXNetworkRecorder ()

@property(nonatomic, strong) NSCache* responseCache;
@property(nonatomic, strong)
    NSMutableArray<FLEXNetworkTransaction*>* orderedTransactions;
@property(nonatomic, strong)
    NSMutableDictionary<NSString*, FLEXNetworkTransaction*>*
        networkTransactionsForRequestIdentifiers;
@property(nonatomic, strong) dispatch_queue_t queue;
@property(nonatomic, strong)
    NSMutableDictionary<NSString*, NSNumber*>* identifierDict;
@end

@implementation FLEXNetworkRecorder

- (instancetype)init {
  self = [super init];
  if (self) {
    _responseCache = [NSCache new];
    NSUInteger responseCacheLimit = [[[NSUserDefaults standardUserDefaults]
        objectForKey:kFLEXNetworkRecorderResponseCacheLimitDefaultsKey]
        unsignedIntegerValue];
    if (responseCacheLimit) {
      [_responseCache setTotalCostLimit:responseCacheLimit];
    } else {
      // Default to 25 MB max. The cache will purge earlier if there is memory
      // pressure.
      [_responseCache setTotalCostLimit:25 * 1024 * 1024];
    }
    _orderedTransactions = [NSMutableArray array];
    _networkTransactionsForRequestIdentifiers =
        [NSMutableDictionary dictionary];

    // Serial queue used because we use mutable objects that are not thread safe
    _queue = dispatch_queue_create(
        "com.flex.FLEXNetworkRecorder", DISPATCH_QUEUE_SERIAL);
    _identifierDict = [NSMutableDictionary dictionary];
  }
  return self;
}

+ (instancetype)defaultRecorder {
  static FLEXNetworkRecorder* defaultRecorder = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    defaultRecorder = [[[self class] alloc] init];
  });
  return defaultRecorder;
}

#pragma mark - Public Data Access

- (void)setDelegate:(id<SKNetworkReporterDelegate>)delegate {
  _delegate = delegate;
}

- (NSUInteger)responseCacheByteLimit {
  return [self.responseCache totalCostLimit];
}

- (void)setResponseCacheByteLimit:(NSUInteger)responseCacheByteLimit {
  [self.responseCache setTotalCostLimit:responseCacheByteLimit];
  [[NSUserDefaults standardUserDefaults]
      setObject:@(responseCacheByteLimit)
         forKey:kFLEXNetworkRecorderResponseCacheLimitDefaultsKey];
}

- (NSArray<FLEXNetworkTransaction*>*)networkTransactions {
  __block NSArray<FLEXNetworkTransaction*>* transactions = nil;
  dispatch_sync(self.queue, ^{
    transactions = [self.orderedTransactions copy];
  });
  return transactions;
}

- (NSData*)cachedResponseBodyForTransaction:
    (FLEXNetworkTransaction*)transaction {
  return [self.responseCache objectForKey:transaction.requestID];
}

- (void)clearRecordedActivity {
  dispatch_async(self.queue, ^{
    [self.responseCache removeAllObjects];
    [self.orderedTransactions removeAllObjects];
    [self.networkTransactionsForRequestIdentifiers removeAllObjects];
  });
}

#pragma mark - Network Events

- (void)recordRequestWillBeSentWithRequestID:(NSString*)requestID
                                     request:(NSURLRequest*)request
                            redirectResponse:(NSURLResponse*)redirectResponse {
  if (![self.identifierDict objectForKey:requestID]) {
    self.identifierDict[requestID] = [NSNumber random];
  }
  NSDate* startDate = [NSDate date];

  if (redirectResponse) {
    [self recordResponseReceivedWithRequestID:requestID
                                     response:redirectResponse];
    [self recordLoadingFinishedWithRequestID:requestID responseBody:nil];
  }

  dispatch_async(self.queue, ^{
    SKRequestInfo* info = [[SKRequestInfo alloc]
        initWithIdentifier:self.identifierDict[requestID].longLongValue
                 timestamp:[NSDate timestamp]
                   request:request
                      data:request.HTTPBody];
    [self.delegate didObserveRequest:info];

    FLEXNetworkTransaction* transaction = [FLEXNetworkTransaction new];
    transaction.requestID = requestID;
    transaction.request = request;
    transaction.startTime = startDate;

    [self.orderedTransactions insertObject:transaction atIndex:0];
    [self.networkTransactionsForRequestIdentifiers setObject:transaction
                                                      forKey:requestID];
    transaction.transactionState = FLEXNetworkTransactionStateAwaitingResponse;
  });
}

/// Call when HTTP response is available.
- (void)recordResponseReceivedWithRequestID:(NSString*)requestID
                                   response:(NSURLResponse*)response {
  NSDate* responseDate = [NSDate date];

  dispatch_async(self.queue, ^{
    FLEXNetworkTransaction* transaction =
        self.networkTransactionsForRequestIdentifiers[requestID];
    if (!transaction) {
      return;
    }
    transaction.response = response;
    transaction.transactionState = FLEXNetworkTransactionStateReceivingData;
    transaction.latency =
        -[transaction.startTime timeIntervalSinceDate:responseDate];
  });
}

/// Call when data chunk is received over the network.
- (void)recordDataReceivedWithRequestID:(NSString*)requestID
                             dataLength:(int64_t)dataLength {
  dispatch_async(self.queue, ^{
    FLEXNetworkTransaction* transaction =
        self.networkTransactionsForRequestIdentifiers[requestID];
    if (!transaction) {
      return;
    }
    transaction.receivedDataLength += dataLength;
  });
}

/// Call when HTTP request has finished loading.
- (void)recordLoadingFinishedWithRequestID:(NSString*)requestID
                              responseBody:(NSData*)responseBody {
  NSDate* finishedDate = [NSDate date];
  dispatch_async(self.queue, ^{
    FLEXNetworkTransaction* transaction =
        self.networkTransactionsForRequestIdentifiers[requestID];
    if (!transaction) {
      return;
    }
    transaction.transactionState = FLEXNetworkTransactionStateFinished;
    transaction.duration =
        -[transaction.startTime timeIntervalSinceDate:finishedDate];
    SKResponseInfo* responseInfo = [[SKResponseInfo alloc]
        initWithIndentifier:self.identifierDict[requestID].longLongValue
                  timestamp:[NSDate timestamp]
                   response:transaction.response
                       data:responseBody];
    self.identifierDict[requestID] = nil; // Clear the entry
    [self.delegate didObserveResponse:responseInfo];

    BOOL shouldCache = [responseBody length] > 0;
    if (!self.shouldCacheMediaResponses) {
      NSArray<NSString*>* ignoredMIMETypePrefixes =
          @[ @"audio", @"image", @"video" ];
      for (NSString* ignoredPrefix in ignoredMIMETypePrefixes) {
        shouldCache = shouldCache &&
            ![transaction.response.MIMEType hasPrefix:ignoredPrefix];
      }
    }

    if (shouldCache) {
      [self.responseCache setObject:responseBody
                             forKey:requestID
                               cost:[responseBody length]];
    }
  });
}

- (void)recordLoadingFailedWithRequestID:(NSString*)requestID
                                   error:(NSError*)error {
  dispatch_async(self.queue, ^{
    FLEXNetworkTransaction* transaction =
        self.networkTransactionsForRequestIdentifiers[requestID];
    if (!transaction) {
      return;
    }

    SKResponseInfo* responseInfo = [[SKResponseInfo alloc]
        initWithIndentifier:self.identifierDict[requestID].longLongValue
                  timestamp:[NSDate timestamp]
                   response:transaction.response
                       data:nil];
    self.identifierDict[requestID] = nil; // Clear the entry
    [self.delegate didObserveResponse:responseInfo];
    transaction.transactionState = FLEXNetworkTransactionStateFailed;
    transaction.duration = -[transaction.startTime timeIntervalSinceNow];
    transaction.error = error;
  });
}

- (void)recordMechanism:(NSString*)mechanism forRequestID:(NSString*)requestID {
  dispatch_async(self.queue, ^{
    FLEXNetworkTransaction* transaction =
        self.networkTransactionsForRequestIdentifiers[requestID];
    if (!transaction) {
      return;
    }
    transaction.requestMechanism = mechanism;
  });
}

@end
