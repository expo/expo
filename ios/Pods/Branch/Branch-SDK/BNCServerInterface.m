//
//  BNCServerInterface.m
//  Branch-SDK
//
//  Created by Alex Austin on 6/6/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "BNCServerInterface.h"
#import "BNCConfig.h"
#import "BNCEncodingUtils.h"
#import "NSError+Branch.h"
#import "BranchConstants.h"
#import "BNCDeviceInfo.h"
#import "NSMutableDictionary+Branch.h"
#import "BNCLog.h"
#import "Branch.h"
#import "BNCLocalization.h"
#import "NSString+Branch.h"

@interface BNCServerInterface ()
@property (strong) NSString *requestEndpoint;
@property (strong) id<BNCNetworkServiceProtocol> networkService;
@end

@implementation BNCServerInterface

- (instancetype) init {
    self = [super init];
    if (self) {
        self.networkService = [[Branch networkServiceClass] new];
    }
    return self;
}

- (void) dealloc {
    [self.networkService cancelAllOperations];
    self.networkService = nil;
}

#pragma mark - GET methods

- (void)getRequest:(NSDictionary *)params
               url:(NSString *)url
               key:(NSString *)key
          callback:(BNCServerCallback)callback {
    [self getRequest:params url:url key:key retryNumber:0 callback:callback];
}

- (void)getRequest:(NSDictionary *)params
               url:(NSString *)url
               key:(NSString *)key
       retryNumber:(NSInteger)retryNumber
          callback:(BNCServerCallback)callback {
    NSURLRequest *request = [self prepareGetRequest:params url:url key:key retryNumber:retryNumber];

    [self genericHTTPRequest:request retryNumber:retryNumber callback:callback
        retryHandler:^NSURLRequest *(NSInteger lastRetryNumber) {
            return [self prepareGetRequest:params url:url key:key retryNumber:lastRetryNumber+1];
    }];
}

#pragma mark - POST methods

- (void)postRequest:(NSDictionary *)post
                url:(NSString *)url
                key:(NSString *)key
           callback:(BNCServerCallback)callback {
    [self postRequest:post url:url retryNumber:0 key:key callback:callback];
}

- (BOOL)isV2APIURL:(NSString *)urlstring {
    return [self isV2APIURL:urlstring baseURL:[self.preferenceHelper branchAPIURL]];
}

- (BOOL)isV2APIURL:(NSString *)urlstring baseURL:(NSString *)baseURL {
    BOOL found = NO;
    if (urlstring && baseURL) {
        NSString *matchString = [NSString stringWithFormat:@"%@/v2/", baseURL];
        NSRange range = [urlstring rangeOfString:matchString];
        found = (range.location != NSNotFound);
    }
    return found;
}

// workaround for new V1 APIs that expects different format
- (BOOL)isNewV1API:(NSString *)urlstring {
    NSArray<NSString *> *newV1Apis = @[ BRANCH_REQUEST_ENDPOINT_CPID, BRANCH_REQUEST_ENDPOINT_LATD ];
    for (NSString *tmp in newV1Apis) {
        NSRange range = [urlstring rangeOfString:tmp];
        BOOL found = (range.location != NSNotFound);
        if (found) {
            return YES;
        }
    }
    return NO;
}

// SDK-635  Follow up ticket to redesign this.  The payload format should be the responsibility of the network request class.
- (NSMutableDictionary *)buildExtendedParametersForURL:(NSString *)url withPostDictionary:(NSDictionary *)post {
    NSMutableDictionary *extendedParams = nil;
    
    // v2 endpoints expect a user data section
    if ([self isV2APIURL:url]) {
        extendedParams = [NSMutableDictionary new];
        if (post) {
            [extendedParams addEntriesFromDictionary:post];
        }
        NSDictionary *d = [[BNCDeviceInfo getInstance] v2dictionary];
        if (d.count) {
            extendedParams[@"user_data"] = d;
        }
    
    // cpid and latd endpoints expect a v2 format, except with possible customization
    } else if ([self isNewV1API:url]) {
        extendedParams = [NSMutableDictionary new];
        
        NSMutableDictionary *tmp = [NSMutableDictionary dictionaryWithDictionary: [[BNCDeviceInfo getInstance] v2dictionary]];
        if (tmp.count) {
            extendedParams[@"user_data"] = tmp;
            [tmp addEntriesFromDictionary:post];
        }
    
    } else {
        extendedParams = [self updateDeviceInfoToParams:post];
    }
    return extendedParams;
}

- (void)postRequest:(NSDictionary *)post
                url:(NSString *)url
        retryNumber:(NSInteger)retryNumber
                key:(NSString *)key
           callback:(BNCServerCallback)callback {

    NSMutableDictionary *extendedParams = [self buildExtendedParametersForURL:url withPostDictionary:post];
    NSURLRequest *request = [self preparePostRequest:extendedParams url:url key:key retryNumber:retryNumber];
    
    // Instrumentation metrics
    self.requestEndpoint = [self.preferenceHelper getEndpointFromURL:url];

    [self genericHTTPRequest:request
                 retryNumber:retryNumber
                    callback:callback
                retryHandler:^ NSURLRequest *(NSInteger lastRetryNumber) {
        return [self preparePostRequest:extendedParams url:url key:key retryNumber:lastRetryNumber+1];
    }];
}

- (BNCServerResponse *)postRequestSynchronous:(NSDictionary *)post
                                          url:(NSString *)url
                                          key:(NSString *)key {
    NSDictionary *extendedParams = [self updateDeviceInfoToParams:post];
    NSURLRequest *request = [self preparePostRequest:extendedParams url:url key:key retryNumber:0];
    return [self genericHTTPRequestSynchronous:request];
}

#pragma mark - Generic requests

- (void)genericHTTPRequest:(NSURLRequest *)request callback:(BNCServerCallback)callback {
    [self genericHTTPRequest:request retryNumber:0 callback:callback
        retryHandler:^NSURLRequest *(NSInteger lastRetryNumber) {
            return request;
    }];
}

- (void)genericHTTPRequest:(NSURLRequest *)request
               retryNumber:(NSInteger)retryNumber
                  callback:(BNCServerCallback)callback
              retryHandler:(NSURLRequest *(^)(NSInteger))retryHandler {

    void (^completionHandler)(id<BNCNetworkOperationProtocol>operation) =
        ^void (id<BNCNetworkOperationProtocol>operation) {

            BNCServerResponse *serverResponse =
                [self processServerResponse:operation.response data:operation.responseData error:operation.error];
            [self collectInstrumentationMetricsWithOperation:operation];

            NSError *underlyingError = operation.error;
            NSInteger status = [serverResponse.statusCode integerValue];

            // If the phone is in a poor network condition,
            // iOS will return statuses such as -1001, -1003, -1200, -9806
            // indicating various parts of the HTTP post failed.
            // We should retry in those conditions in addition to the case where the server returns a 500

            // Status 53 means the request was killed by the OS because we're still in the background.
            // This started happening in iOS 12 / Xcode 10 production when we're called from continueUserActivity:
            // but we're not fully out of the background yet.

            BOOL isRetryableStatusCode = status >= 500 || status < 0 || status == 53;
            
            // Retry the request if appropriate
            if (retryNumber < self.preferenceHelper.retryCount && isRetryableStatusCode) {
                dispatch_time_t dispatchTime =
                    dispatch_time(DISPATCH_TIME_NOW, self.preferenceHelper.retryInterval * NSEC_PER_SEC);
                dispatch_after(dispatchTime, dispatch_get_main_queue(), ^{
                    if (retryHandler) {
                        BNCLogDebug(@"Retrying request with url %@", request.URL.relativePath);
                        // Create the next request
                        NSURLRequest *retryRequest = retryHandler(retryNumber);
                        [self genericHTTPRequest:retryRequest
                                     retryNumber:(retryNumber + 1)
                                        callback:callback retryHandler:retryHandler];
                    }
                });
                
                // Do not continue on if retrying, else the callback will be called incorrectly
                return;
            }

            NSError *branchError = nil;

            // Wrap up bad statuses w/ specific error messages
            if (status >= 500) {
                branchError = [NSError branchErrorWithCode:BNCServerProblemError error:underlyingError];
            }
            else if (status == 409) {
                branchError = [NSError branchErrorWithCode:BNCDuplicateResourceError error:underlyingError];
            }
            else if (status >= 400) {
                NSString *errorString = [serverResponse.data objectForKey:@"error"];
                if (![errorString isKindOfClass:[NSString class]])
                    errorString = nil;
                if (!errorString)
                    errorString = underlyingError.localizedDescription;
                if (!errorString)
                    errorString = BNCLocalizedString(@"The request was invalid.");
                branchError = [NSError branchErrorWithCode:BNCBadRequestError localizedMessage:errorString];
            }
            else if (underlyingError) {
                branchError = [NSError branchErrorWithCode:BNCServerProblemError error:underlyingError];
            }

            if (branchError) {
                BNCLogError(@"An error prevented request to %@ from completing: %@",
                    request.URL.absoluteString, branchError);
            }
            
            //	Don't call on the main queue since it might be blocked.
            if (callback)
                callback(serverResponse, branchError);
        };

    if (Branch.trackingDisabled) {
        NSString *endpoint = request.URL.absoluteString;
        
        // if endpoint is not on the whitelist, fail it.
        if (![self whiteListContainsEndpoint:endpoint]) {
            [[BNCPreferenceHelper preferenceHelper] clearTrackingInformation];
            NSError *error = [NSError branchErrorWithCode:BNCTrackingDisabledError];
            BNCLogError(@"Network service error: %@.", error);
            if (callback) {
                callback(nil, error);
            }
            return;
        }
    }
    
    id<BNCNetworkOperationProtocol> operation =
        [self.networkService networkOperationWithURLRequest:request.copy completion:completionHandler];
    [operation start];
    NSError *error = [self verifyNetworkOperation:operation];
    if (error) {
        BNCLogError(@"Network service error: %@.", error);
        if (callback) {
            callback(nil, error);
        }
        return;
    }
}

- (BOOL)whiteListContainsEndpoint:(NSString *)endpoint {
    BNCPreferenceHelper *prefs = [BNCPreferenceHelper preferenceHelper];
    BOOL hasIdentifier = (prefs.linkClickIdentifier.length > 0 ) || (prefs.spotlightIdentifier.length > 0 ) || (prefs.universalLinkUrl.length > 0);
    
    // Allow install to resolve a link.
    if ([endpoint bnc_containsString:@"/v1/install"] && hasIdentifier) {
        return YES;
    }
    
    // Allow open to resolve a link.
    if ([endpoint bnc_containsString:@"/v1/open"] && hasIdentifier) {
        return YES;
    }
    
    // Allow short url creation requests
    if ([endpoint bnc_containsString:@"/v1/url"]) {
        return YES;
    }
    
    return NO;
}

- (NSError*) verifyNetworkOperation:(id<BNCNetworkOperationProtocol>)operation {

    if (!operation) {
        NSString *message = BNCLocalizedString(
            @"A network operation instance is expected to be returned by the"
             " networkOperationWithURLRequest:completion: method."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (![operation conformsToProtocol:@protocol(BNCNetworkOperationProtocol)]) {
        NSString *message =
            BNCLocalizedFormattedString(
                @"Network operation of class '%@' does not conform to the BNCNetworkOperationProtocol.",
                NSStringFromClass([operation class]));
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (!operation.startDate) {
        NSString *message = BNCLocalizedString(
            @"The network operation start date is not set. The Branch SDK expects the network operation"
             " start date to be set by the network provider."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (!operation.timeoutDate) {
        NSString*message = BNCLocalizedString(
            @"The network operation timeout date is not set. The Branch SDK expects the network operation"
             " timeout date to be set by the network provider."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (!operation.request) {
        NSString *message = BNCLocalizedString(
            @"The network operation request is not set. The Branch SDK expects the network operation"
             " request to be set by the network provider."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    return nil;
}

- (BNCServerResponse *)genericHTTPRequestSynchronous:(NSURLRequest *)request {

    __block BNCServerResponse *serverResponse = nil;
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

    id<BNCNetworkOperationProtocol> operation =
        [self.networkService
            networkOperationWithURLRequest:request.copy
            completion:^void (id<BNCNetworkOperationProtocol>operation) {
                serverResponse =
                    [self processServerResponse:operation.response
                        data:operation.responseData error:operation.error];
                [self collectInstrumentationMetricsWithOperation:operation];                    
                dispatch_semaphore_signal(semaphore);
            }];
    [operation start];
    NSError *error = [self verifyNetworkOperation:operation];
    if (!error) {
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
    }
    return serverResponse;
}

#pragma mark - Internals

- (NSURLRequest *)prepareGetRequest:(NSDictionary *)params
                                url:(NSString *)url
                                key:(NSString *)key
                        retryNumber:(NSInteger)retryNumber {

    NSDictionary *preparedParams =
        [self prepareParamDict:params key:key retryNumber:retryNumber requestType:@"GET"];
    NSString *requestUrlString =
        [NSString stringWithFormat:@"%@%@", url, [BNCEncodingUtils encodeDictionaryToQueryString:preparedParams]];
    BNCLogDebug(@"URL: %@", requestUrlString);

    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:[NSURL URLWithString:requestUrlString]
            cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
            timeoutInterval:self.preferenceHelper.timeout];
    [request setHTTPMethod:@"GET"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    
    return request;
}

- (NSURLRequest *)preparePostRequest:(NSDictionary *)params
                                 url:(NSString *)url
                                 key:(NSString *)key
                         retryNumber:(NSInteger)retryNumber {

    NSMutableDictionary *preparedParams =
        [self prepareParamDict:params key:key retryNumber:retryNumber requestType:@"POST"];
    if ([self isV2APIURL:url]) {
        preparedParams[@"sdk"] = nil;
    }
    if (Branch.trackingDisabled) {
        preparedParams[@"tracking_disabled"] = (__bridge NSNumber*) kCFBooleanTrue;
        preparedParams[@"local_ip"] = nil;
        preparedParams[@"lastest_update_time"] = nil;
        preparedParams[@"previous_update_time"] = nil;
        preparedParams[@"latest_install_time"] = nil;
        preparedParams[@"first_install_time"] = nil;
        preparedParams[@"ios_vendor_id"] = nil;
        preparedParams[@"hardware_id"] = nil;
        preparedParams[@"hardware_id_type"] = nil;
        preparedParams[@"is_hardware_id_real"] = nil;
        preparedParams[@"device_fingerprint_id"] = nil;
        preparedParams[@"identity_id"] = nil;
        preparedParams[@"identity"] = nil;
        preparedParams[@"update"] = nil;
    }
    NSData *postData = [BNCEncodingUtils encodeDictionaryToJsonData:preparedParams];
    NSString *postLength = [NSString stringWithFormat:@"%lu", (unsigned long)[postData length]];

    BNCLogDebug(@"URL: %@.", url);
    BNCLogDebug(@"Body: %@\nJSON: %@.",
        preparedParams,
        [[NSString alloc] initWithData:postData encoding:NSUTF8StringEncoding]
    );
    
    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]
            cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
            timeoutInterval:self.preferenceHelper.timeout];
    [request setHTTPMethod:@"POST"];
    [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request setHTTPBody:postData];
    
    return request;
}

- (NSMutableDictionary *)prepareParamDict:(NSDictionary *)params
							   key:(NSString *)key
					   retryNumber:(NSInteger)retryNumber
                       requestType:(NSString *)reqType {

    NSMutableDictionary *fullParamDict = [[NSMutableDictionary alloc] init];
    [fullParamDict bnc_safeAddEntriesFromDictionary:params];
    fullParamDict[@"sdk"] = [NSString stringWithFormat:@"ios%@", BNC_SDK_VERSION];
    
    // using rangeOfString instead of containsString to support devices running pre iOS 8
    if ([[[NSBundle mainBundle] executablePath] rangeOfString:@".appex/"].location != NSNotFound) {
        fullParamDict[@"ios_extension"] = @(1);
    }
    fullParamDict[@"retryNumber"] = @(retryNumber);
    fullParamDict[@"branch_key"] = key;

    NSMutableDictionary *metadata = [[NSMutableDictionary alloc] init];
    [metadata bnc_safeAddEntriesFromDictionary:self.preferenceHelper.requestMetadataDictionary];
    [metadata bnc_safeAddEntriesFromDictionary:fullParamDict[BRANCH_REQUEST_KEY_STATE]];
    if (metadata.count) {
        fullParamDict[BRANCH_REQUEST_KEY_STATE] = metadata;
    }
    // we only send instrumentation info in the POST body request
    if (self.preferenceHelper.instrumentationDictionary.count && [reqType isEqualToString:@"POST"]) {
        fullParamDict[BRANCH_REQUEST_KEY_INSTRUMENTATION] = self.preferenceHelper.instrumentationDictionary;
    }
    
    return fullParamDict;
}

- (BNCServerResponse *)processServerResponse:(NSURLResponse *)response
                                        data:(NSData *)data
                                       error:(NSError *)error {
    BNCServerResponse *serverResponse = [[BNCServerResponse alloc] init];
    if (!error) {
        serverResponse.statusCode = @([(NSHTTPURLResponse *)response statusCode]);
        serverResponse.data = [BNCEncodingUtils decodeJsonDataToDictionary:data];
    }
    else {
        serverResponse.statusCode = @(error.code);
        serverResponse.data = error.userInfo;
    }
    BNCLogDebug(@"Server returned: %@.", serverResponse);
    return serverResponse;
}

- (void) collectInstrumentationMetricsWithOperation:(id<BNCNetworkOperationProtocol>)operation {
    // multiplying by negative because startTime happened in the past
    NSTimeInterval elapsedTime = [operation.startDate timeIntervalSinceNow] * -1000.0;
    NSString *lastRoundTripTime = [[NSNumber numberWithDouble:floor(elapsedTime)] stringValue];
    NSString * brttKey = [NSString stringWithFormat:@"%@-brtt", self.requestEndpoint];
    [self.preferenceHelper clearInstrumentationDictionary];
    [self.preferenceHelper addInstrumentationDictionaryKey:brttKey value:lastRoundTripTime];
}

- (void)updateDeviceInfoToMutableDictionary:(NSMutableDictionary *)dict {
    BNCDeviceInfo *deviceInfo  = [BNCDeviceInfo getInstance];
    @synchronized (deviceInfo) {
        [deviceInfo checkAdvertisingIdentifier];
        
        // hardware id information.  idfa, idfv or random
        NSString *hardwareId = [deviceInfo.hardwareId copy];
        NSString *hardwareIdType = [deviceInfo.hardwareIdType copy];
        NSNumber *isRealHardwareId = @(deviceInfo.isRealHardwareId);
        if (hardwareId != nil && hardwareIdType != nil && isRealHardwareId != nil) {
            dict[BRANCH_REQUEST_KEY_HARDWARE_ID] = hardwareId;
            dict[BRANCH_REQUEST_KEY_HARDWARE_ID_TYPE] = hardwareIdType;
            dict[BRANCH_REQUEST_KEY_IS_HARDWARE_ID_REAL] = isRealHardwareId;
        }

        // idfv is duplicated in the hardware id field when idfa is unavailable
        [self safeSetValue:deviceInfo.vendorId forKey:BRANCH_REQUEST_KEY_IOS_VENDOR_ID onDict:dict];
        // idfa is only in the hardware id field
        // [self safeSetValue:deviceInfo.advertiserId forKey:@"idfa" onDict:dict];
        
        [self safeSetValue:deviceInfo.osName forKey:BRANCH_REQUEST_KEY_OS onDict:dict];
        [self safeSetValue:deviceInfo.osVersion forKey:BRANCH_REQUEST_KEY_OS_VERSION onDict:dict];
        [self safeSetValue:deviceInfo.osBuildVersion forKey:@"build" onDict:dict];
        [self safeSetValue:deviceInfo.extensionType forKey:@"environment" onDict:dict];
        [self safeSetValue:deviceInfo.locale forKey:@"locale" onDict:dict];
        [self safeSetValue:deviceInfo.country forKey:@"country" onDict:dict];
        [self safeSetValue:deviceInfo.language forKey:@"language" onDict:dict];
        [self safeSetValue:deviceInfo.brandName forKey:BRANCH_REQUEST_KEY_BRAND onDict:dict];
        [self safeSetValue:deviceInfo.modelName forKey:BRANCH_REQUEST_KEY_MODEL onDict:dict];
        [self safeSetValue:deviceInfo.cpuType forKey:@"cpu_type" onDict:dict];
        [self safeSetValue:deviceInfo.screenScale forKey:@"screen_dpi" onDict:dict];
        [self safeSetValue:deviceInfo.screenHeight forKey:BRANCH_REQUEST_KEY_SCREEN_HEIGHT onDict:dict];
        [self safeSetValue:deviceInfo.screenWidth forKey:BRANCH_REQUEST_KEY_SCREEN_WIDTH onDict:dict];
        [self safeSetValue:deviceInfo.carrierName forKey:@"device_carrier" onDict:dict];
        
        [self safeSetValue:[deviceInfo localIPAddress] forKey:@"local_ip" onDict:dict];
        [self safeSetValue:[deviceInfo connectionType] forKey:@"connection_type" onDict:dict];
        [self safeSetValue:[deviceInfo userAgentString] forKey:@"user_agent" onDict:dict];
        
        [self safeSetValue:@(deviceInfo.isAdTrackingEnabled) forKey:BRANCH_REQUEST_KEY_AD_TRACKING_ENABLED onDict:dict];
        
        [self safeSetValue:deviceInfo.applicationVersion forKey:@"app_version" onDict:dict];
        [self safeSetValue:deviceInfo.pluginName forKey:@"plugin_name" onDict:dict];
        [self safeSetValue:deviceInfo.pluginVersion forKey:@"plugin_version" onDict:dict];
        
        BOOL disableAdNetworkCallouts = self.preferenceHelper.disableAdNetworkCallouts;
        if (disableAdNetworkCallouts) {
            [dict setObject:[NSNumber numberWithBool:disableAdNetworkCallouts] forKey:@"disable_ad_network_callouts"];
        }
    }
}

- (NSMutableDictionary*)updateDeviceInfoToParams:(NSDictionary *)params {
    NSMutableDictionary *extendedParams=[[NSMutableDictionary alloc] init];
    [extendedParams addEntriesFromDictionary:params];
    [self updateDeviceInfoToMutableDictionary:extendedParams];
    return extendedParams;
}

- (void)safeSetValue:(NSObject *)value forKey:(NSString *)key onDict:(NSMutableDictionary *)dict {
    if (value) {
        dict[key] = value;
    }
}

@end
