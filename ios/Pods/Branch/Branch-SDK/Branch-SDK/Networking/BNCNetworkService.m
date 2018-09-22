//
//  BNCNetworkService.m
//  Branch-SDK
//
//  Created by Edward Smith on 5/30/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "BNCNetworkService.h"
#import "BNCEncodingUtils.h"
#import "BNCLog.h"
#import "BNCDebug.h"
#import "BNCError.h"
#import "BNCConfig.h"

#pragma mark BNCNetworkOperation

@interface BNCNetworkOperation ()
@property (copy)   NSURLRequest       *request;
@property (copy)   NSHTTPURLResponse  *response;
@property (strong) NSData             *responseData;
@property (copy)   NSError            *error;
@property (copy)   NSDate             *startDate;
@property (copy)   NSDate             *timeoutDate;
@property (strong) BNCNetworkService  *networkService;
@property (strong) NSURLSessionTask   *sessionTask;
@property (copy) void (^completionBlock)(BNCNetworkOperation*operation);
@end

#pragma mark - BNCNetworkService

@interface BNCNetworkService () <NSURLSessionDelegate, NSURLSessionTaskDelegate> {
    NSURLSession    *_session;
    NSTimeInterval  _defaultTimeoutInterval;
    NSInteger       _maximumConcurrentOperations;
    NSMutableArray  *_pinnedPublicKeys;
}

- (void) startOperation:(BNCNetworkOperation*)operation;

@property (strong, atomic, readonly) NSURLSession *session;
@property (strong, atomic) NSOperationQueue *sessionQueue;
@end

#pragma mark - BNCNetworkOperation

@implementation BNCNetworkOperation

- (void) start {
    [self.networkService startOperation:self];
}

- (void) cancel {
    [self.sessionTask cancel];
}

- (NSString*) stringFromResponseData {
    NSString *string = nil;
    if ([self.responseData isKindOfClass:[NSData class]]) {
        string = [[NSString alloc] initWithData:(NSData*)self.responseData encoding:NSUTF8StringEncoding];
    }
    if (!string && [self.responseData isKindOfClass:[NSData class]]) {
        string = [NSString stringWithFormat:@"<NSData of length %ld.>",
            (long)[(NSData*)self.responseData length]];
    }
    if (!string) {
        string = self.responseData.description;
    }
    return string;
}

@end

#pragma mark - BNCNetworkService

@implementation BNCNetworkService

+ (instancetype) new {
    return [[self alloc] init];
}

- (instancetype) init {
    self = [super init];
    if (!self) return self;
    _defaultTimeoutInterval = 15.0;
    _maximumConcurrentOperations = 3;
    return self;
}

#pragma mark - Getters & Setters

- (NSError*) pinSessionToPublicSecKeyRefs:(NSArray/**<SecKeyRef>*/*)publicKeys {
    @synchronized (self) {
        _pinnedPublicKeys = [NSMutableArray array];
        for (id secKey in publicKeys) {
            if (CFGetTypeID((SecKeyRef)secKey) == SecKeyGetTypeID())
                [_pinnedPublicKeys addObject:secKey];
            else {
                return [NSError branchErrorWithCode:BNCInvalidNetworkPublicKeyError];
            }
        }
        return nil;
    }
}

- (NSArray*) pinnedPublicKeys {
    @synchronized (self) {
        return _pinnedPublicKeys;
    }
}

- (void) setDefaultTimeoutInterval:(NSTimeInterval)defaultTimeoutInterval {
    @synchronized (self) {
        _defaultTimeoutInterval = MAX(defaultTimeoutInterval, 0.0);
    }
}

- (NSTimeInterval) defaultTimeoutInterval {
    @synchronized (self) {
        return _defaultTimeoutInterval;
    }
}

- (void) setMaximumConcurrentOperations:(NSInteger)maximumConcurrentOperations {
    @synchronized (self) {
        _maximumConcurrentOperations = MAX(maximumConcurrentOperations, 0);
        self.sessionQueue.maxConcurrentOperationCount = _maximumConcurrentOperations;
    }
}

- (NSInteger) maximumConcurrentOperations {
    @synchronized (self) {
        return _maximumConcurrentOperations;
    }
}

- (NSURLSession*) session {
    @synchronized (self) {
        if (_session) return _session;

        NSURLSessionConfiguration *configuration =
            [NSURLSessionConfiguration defaultSessionConfiguration];
        configuration.timeoutIntervalForRequest = self.defaultTimeoutInterval;
        configuration.timeoutIntervalForResource = self.defaultTimeoutInterval;
        configuration.URLCache = nil;

        self.sessionQueue = [NSOperationQueue new];
        self.sessionQueue.name = @"io.branch.sdk.network.queue";
        self.sessionQueue.maxConcurrentOperationCount = self.maximumConcurrentOperations;
        if ([self.sessionQueue respondsToSelector:@selector(setQualityOfService:)]) {
            // qualityOfService is iOS 8 and above.
            self.sessionQueue.qualityOfService = NSQualityOfServiceUserInteractive;
        }

        _session =
            [NSURLSession sessionWithConfiguration:configuration
                delegate:self
                delegateQueue:self.sessionQueue];
        _session.sessionDescription = @"io.branch.sdk.network.session";

        return _session;
    }
}

- (void) setSuspendOperations:(BOOL)suspendOperations {
    self.sessionQueue.suspended = suspendOperations;
}

- (BOOL) operationsAreSuspended {
    return self.sessionQueue.isSuspended;
}

#pragma mark - Operations

- (BNCNetworkOperation*) networkOperationWithURLRequest:(NSMutableURLRequest*)request
                completion:(void (^)(id<BNCNetworkOperationProtocol>operation))completion {

    BNCNetworkOperation *operation = [BNCNetworkOperation new];
    if (![request isKindOfClass:[NSMutableURLRequest class]]) {
        BNCLogError(@"A `NSMutableURLRequest` request parameter was expected.");
        return nil;
    }
    operation.request = request;
    operation.networkService = self;
    operation.completionBlock = completion;
    return operation;
}

- (void) startOperation:(BNCNetworkOperation*)operation {
    operation.networkService = self;
    if (!operation.startDate) {
        operation.startDate = [NSDate date];
    }
    if (!operation.timeoutDate) {
        NSTimeInterval timeoutInterval = operation.request.timeoutInterval;
        if (timeoutInterval < 0.0)
            timeoutInterval = self.defaultTimeoutInterval;
        operation.timeoutDate =
            [[operation startDate] dateByAddingTimeInterval:timeoutInterval];
    }
    if ([operation.request isKindOfClass:[NSMutableURLRequest class]]) {
        ((NSMutableURLRequest*)operation.request).timeoutInterval =
            [operation.timeoutDate timeIntervalSinceDate:[NSDate date]];
    } else {
        BNCLogError(@"SDK logic error. Expected mutable request in `start` method.");
    }
    operation.sessionTask =
        [self.session dataTaskWithRequest:operation.request
            completionHandler:
            ^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                operation.responseData = data;
                operation.response = (NSHTTPURLResponse*) response;
                operation.error = error;
                if (operation.response.statusCode == 404) {
                    /* Don't print 404 messages because they look like an error.
                    BNCLogDebugSDK(@"Network finish operation %@ %1.3fs. Status %ld.",
                        operation.request.URL.absoluteString,
                        [[NSDate date] timeIntervalSinceDate:operation.startDate],
                        (long)operation.response.statusCode);
                    */
                } else {
                    BNCLogDebug(@"Network finish operation %@ %1.3fs. Status %ld error %@.\n%@.",
                        operation.request.URL.absoluteString,
                        [[NSDate date] timeIntervalSinceDate:operation.startDate],
                        (long)operation.response.statusCode,
                        operation.error,
                        operation.stringFromResponseData);
                }
                if (operation.completionBlock)
                    operation.completionBlock(operation);
            }];
    BNCLogDebug(@"Network start operation %@.", operation.request.URL);
    [operation.sessionTask resume];
}

- (void) cancelAllOperations {
    @synchronized (self) {
        [self.session invalidateAndCancel];
        _session = nil;
    }
}

- (void) URLSession:(NSURLSession *)session
               task:(NSURLSessionTask *)task
didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler {

    BOOL trusted = NO;
    SecTrustResultType trustResult = 0;
    OSStatus err = 0;
    NSArray *localPinnedKeys = self.pinnedPublicKeys; // Keep a local copy in case it mutates.

    // Release these:
    SecKeyRef key = nil;
    SecPolicyRef hostPolicy = nil;

    // Get remote certificate
    SecTrustRef serverTrust = challenge.protectionSpace.serverTrust;
    @synchronized ((__bridge id<NSObject, OS_dispatch_semaphore>)serverTrust) {

        // Set SSL policies for domain name check
        hostPolicy = SecPolicyCreateSSL(true, (__bridge CFStringRef)challenge.protectionSpace.host);
        if (!hostPolicy) goto exit;
        SecTrustSetPolicies(serverTrust, (__bridge CFTypeRef _Nonnull)(@[ (__bridge id)hostPolicy ]));

        // Evaluate server certificate
        SecTrustEvaluate(serverTrust, &trustResult);
        if (! (trustResult == kSecTrustResultUnspecified || trustResult == kSecTrustResultProceed)) {
            goto exit;
        }

        if (localPinnedKeys.count == 0) {
            trusted = YES;
            goto exit;
        }

        key = SecTrustCopyPublicKey(serverTrust);
        if (!key) goto exit;
    }

    for (id<NSObject> pinnedKey in localPinnedKeys) {
        if ([pinnedKey isEqual:(__bridge id<NSObject>)key]) {
            trusted = YES;
            goto exit;
        }
    }

    if (!BNC_API_PINNED) {
        trusted = YES;
        goto exit;
    }

exit:
    if (err) {
        NSError *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:err userInfo:nil];
        BNCLogError(@"Error while validating cert: %@.", error);
    }
    if (key) CFRelease(key);
    if (hostPolicy) CFRelease(hostPolicy);

    if (trusted) {
        NSURLCredential *credential = [NSURLCredential credentialForTrust:serverTrust];
        completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
    } else {
        completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, NULL);
    }
}

@end
