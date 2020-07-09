//
//  BranchOpenRequest.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 5/26/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchOpenRequest.h"
#import "BNCSystemObserver.h"
#import "BranchConstants.h"
#import "BranchContentDiscoveryManifest.h"
#import "BranchContentDiscoverer.h"
#import "NSMutableDictionary+Branch.h"
#import "BNCEncodingUtils.h"
#import "BNCCrashlyticsWrapper.h"
#import "BNCDeviceInfo.h"
#import "Branch.h"
#import "BNCApplication.h"
#import "BNCAppleReceipt.h"

@interface BranchOpenRequest ()
@property (assign, nonatomic) BOOL isInstall;
@end


@implementation BranchOpenRequest

- (id)initWithCallback:(callbackWithStatus)callback {
    return [self initWithCallback:callback isInstall:NO];
}

- (id)initWithCallback:(callbackWithStatus)callback isInstall:(BOOL)isInstall {
    if ((self = [super init])) {
        _callback = callback;
        _isInstall = isInstall;
    }

    return self;
}

- (void)makeRequest:(BNCServerInterface *)serverInterface key:(NSString *)key callback:(BNCServerCallback)callback {
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];

    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    if (preferenceHelper.deviceFingerprintID) {
        params[BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID] = preferenceHelper.deviceFingerprintID;
    }

    params[BRANCH_REQUEST_KEY_BRANCH_IDENTITY] = preferenceHelper.identityID;
    params[BRANCH_REQUEST_KEY_DEBUG] = @(preferenceHelper.isDebug);

    [self safeSetValue:[BNCSystemObserver getBundleID] forKey:BRANCH_REQUEST_KEY_BUNDLE_ID onDict:params];
    [self safeSetValue:[BNCSystemObserver getTeamIdentifier] forKey:BRANCH_REQUEST_KEY_TEAM_ID onDict:params];
    [self safeSetValue:[BNCSystemObserver getAppVersion] forKey:BRANCH_REQUEST_KEY_APP_VERSION onDict:params];
    [self safeSetValue:[BNCSystemObserver getDefaultUriScheme] forKey:BRANCH_REQUEST_KEY_URI_SCHEME onDict:params];
    [self safeSetValue:[NSNumber numberWithBool:preferenceHelper.checkedFacebookAppLinks]
        forKey:BRANCH_REQUEST_KEY_CHECKED_FACEBOOK_APPLINKS onDict:params];
    [self safeSetValue:[NSNumber numberWithBool:preferenceHelper.checkedAppleSearchAdAttribution]
        forKey:BRANCH_REQUEST_KEY_CHECKED_APPLE_AD_ATTRIBUTION onDict:params];
    [self safeSetValue:preferenceHelper.linkClickIdentifier forKey:BRANCH_REQUEST_KEY_LINK_IDENTIFIER onDict:params];
    [self safeSetValue:preferenceHelper.spotlightIdentifier forKey:BRANCH_REQUEST_KEY_SPOTLIGHT_IDENTIFIER onDict:params];
    [self safeSetValue:preferenceHelper.universalLinkUrl forKey:BRANCH_REQUEST_KEY_UNIVERSAL_LINK_URL onDict:params];
    [self safeSetValue:preferenceHelper.externalIntentURI forKey:BRANCH_REQUEST_KEY_EXTERNAL_INTENT_URI onDict:params];
    if (preferenceHelper.limitFacebookTracking)
        params[@"limit_facebook_tracking"] = (__bridge NSNumber*) kCFBooleanTrue;

    [self safeSetValue:[NSNumber numberWithBool:[[BNCAppleReceipt instance] isTestFlight]] forKey:BRANCH_REQUEST_KEY_APPLE_TESTFLIGHT onDict:params];
    
    NSMutableDictionary *cdDict = [[NSMutableDictionary alloc] init];
    BranchContentDiscoveryManifest *contentDiscoveryManifest = [BranchContentDiscoveryManifest getInstance];
    [cdDict bnc_safeSetObject:[contentDiscoveryManifest getManifestVersion] forKey:BRANCH_MANIFEST_VERSION_KEY];
    [cdDict bnc_safeSetObject:[BNCSystemObserver getBundleID] forKey:BRANCH_BUNDLE_IDENTIFIER];
    [self safeSetValue:cdDict forKey:BRANCH_CONTENT_DISCOVER_KEY onDict:params];

    if (preferenceHelper.appleSearchAdNeedsSend) {
        NSString *encodedSearchData = nil;
        @try {
            NSData *jsonData = [BNCEncodingUtils encodeDictionaryToJsonData:preferenceHelper.appleSearchAdDetails];
            encodedSearchData = [BNCEncodingUtils base64EncodeData:jsonData];
        } @catch (id) { }
        [self safeSetValue:encodedSearchData
                    forKey:BRANCH_REQUEST_KEY_SEARCH_AD
                    onDict:params];
    }

    BNCApplication *application = [BNCApplication currentApplication];
    params[@"lastest_update_time"] = BNCWireFormatFromDate(application.currentBuildDate);
    params[@"previous_update_time"] = BNCWireFormatFromDate(preferenceHelper.previousAppBuildDate);
    params[@"latest_install_time"] = BNCWireFormatFromDate(application.currentInstallDate);
    params[@"first_install_time"] = BNCWireFormatFromDate(application.firstInstallDate);
    params[@"update"] = [self.class appUpdateState];

    [serverInterface postRequest:params
        url:[preferenceHelper
        getAPIURL:BRANCH_REQUEST_ENDPOINT_OPEN]
        key:key
        callback:callback];
}

typedef NS_ENUM(NSInteger, BNCUpdateState) {
    BNCUpdateStateInstall       = 0,    // App was recently installed.
    BNCUpdateStateNonUpdate     = 1,    // App was neither newly installed nor updated.
    BNCUpdateStateUpdate        = 2,    // App was recently updated.

//  BNCUpdateStateError         = 3,    // Error determining update state.
//  BNCUpdateStateReinstall     = 4     // App was re-installed.
};

+ (NSNumber*) appUpdateState {

    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    BNCApplication *application = [BNCApplication currentApplication];
    NSTimeInterval first_install_time   = application.firstInstallDate.timeIntervalSince1970;
    NSTimeInterval latest_install_time  = application.currentInstallDate.timeIntervalSince1970;
    NSTimeInterval latest_update_time   = application.currentBuildDate.timeIntervalSince1970;
    NSTimeInterval previous_update_time = preferenceHelper.previousAppBuildDate.timeIntervalSince1970;
    NSTimeInterval const kOneDay        = 1.0 * 24.0 * 60.0 * 60.0;

    BNCUpdateState update_state = 0;
    if (first_install_time <= 0.0 ||
        latest_install_time <= 0.0 ||
        latest_update_time <= 0.0 ||
        previous_update_time > latest_update_time)
        update_state = BNCUpdateStateNonUpdate; // Error: Send Non-update.
    else
    if ((latest_update_time - kOneDay) <= first_install_time && previous_update_time <= 0)
        update_state = BNCUpdateStateInstall;
    else
    if (first_install_time < latest_install_time && previous_update_time <= 0)
        update_state = BNCUpdateStateUpdate; // Re-install: Send Update.
    else
    if (latest_update_time > first_install_time && previous_update_time < latest_update_time)
        update_state = BNCUpdateStateUpdate;
    else
        update_state = BNCUpdateStateNonUpdate;

    return @(update_state);
}

- (void)processResponse:(BNCServerResponse *)response error:(NSError *)error {
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    if (error && preferenceHelper.blacklistURLOpen) {
        // Ignore this response from the server. Dummy up a response:
        error = nil;
        response.data = @{
            BRANCH_RESPONSE_KEY_SESSION_DATA: @{
                BRANCH_RESPONSE_KEY_CLICKED_BRANCH_LINK: @0
            }
        };
    } else
    if (error) {
        [BranchOpenRequest releaseOpenResponseLock];
        if (self.callback) {
            self.callback(NO, error);
        }
        return;
    }

    NSDictionary *data = response.data;
    
    // Handle possibly mis-parsed identity.
    id userIdentity = data[BRANCH_RESPONSE_KEY_DEVELOPER_IDENTITY];
    if ([userIdentity isKindOfClass:[NSNumber class]]) {
        userIdentity = [userIdentity stringValue];
    }

    preferenceHelper.deviceFingerprintID = data[BRANCH_RESPONSE_KEY_DEVICE_FINGERPRINT_ID];
    preferenceHelper.userUrl = data[BRANCH_RESPONSE_KEY_USER_URL];
    preferenceHelper.userIdentity = userIdentity;
    preferenceHelper.sessionID = data[BRANCH_RESPONSE_KEY_SESSION_ID];
    preferenceHelper.previousAppBuildDate = [BNCApplication currentApplication].currentBuildDate;

    if (Branch.enableFingerprintIDInCrashlyticsReports) {
        BNCCrashlyticsWrapper *crashlytics = [BNCCrashlyticsWrapper wrapper];
        [crashlytics setObjectValue:preferenceHelper.deviceFingerprintID
            forKey:BRANCH_CRASHLYTICS_FINGERPRINT_ID_KEY];
    }

    NSString *sessionData = data[BRANCH_RESPONSE_KEY_SESSION_DATA];
    if (sessionData == nil || [sessionData isKindOfClass:[NSString class]]) {
    } else
    if ([sessionData isKindOfClass:[NSDictionary class]]) {
        BNCLogWarning(@"Received session data of type '%@' data is '%@'.",
            NSStringFromClass(sessionData.class), sessionData);        
        sessionData = [BNCEncodingUtils encodeDictionaryToJsonString:(NSDictionary*)sessionData];
    } else
    if ([sessionData isKindOfClass:[NSArray class]]) {
        BNCLogWarning(@"Received session data of type '%@' data is '%@'.",
            NSStringFromClass(sessionData.class), sessionData);
        sessionData = [BNCEncodingUtils encodeArrayToJsonString:(NSArray*)sessionData];
    } else {
        BNCLogError(@"Received session data of type '%@' data is '%@'.",
            NSStringFromClass(sessionData.class), sessionData);
        sessionData = nil;
    }

    // Update session params

    if (preferenceHelper.spotlightIdentifier) {
        NSMutableDictionary *sessionDataDict =
        [NSMutableDictionary dictionaryWithDictionary: [BNCEncodingUtils decodeJsonStringToDictionary:sessionData]];
        NSDictionary *spotlightDic = @{BRANCH_RESPONSE_KEY_SPOTLIGHT_IDENTIFIER:preferenceHelper.spotlightIdentifier};
        [sessionDataDict addEntriesFromDictionary:spotlightDic];
        sessionData = [BNCEncodingUtils encodeDictionaryToJsonString:sessionDataDict];
    }
    
    preferenceHelper.sessionParams = sessionData;

    // Scenarios:
    // If no data, data isn't from a link click, or isReferrable is false, don't set, period.
    // Otherwise,
    // * On Install: set.
    // * On Open and installParams set: don't set.
    // * On Open and stored installParams are empty: set.
    if (sessionData.length) {
        NSDictionary *sessionDataDict = [BNCEncodingUtils decodeJsonStringToDictionary:sessionData];
        BOOL dataIsFromALinkClick = [sessionDataDict[BRANCH_RESPONSE_KEY_CLICKED_BRANCH_LINK] isEqual:@1];
        BOOL storedParamsAreEmpty = YES;

        if ([preferenceHelper.installParams isKindOfClass:[NSString class]]) {
            storedParamsAreEmpty = !preferenceHelper.installParams.length;
        }

        if (dataIsFromALinkClick && (self.isInstall || storedParamsAreEmpty)) {
            preferenceHelper.installParams = sessionData;
        }
    }

    NSString *referringURL = nil;
    if (preferenceHelper.universalLinkUrl.length) {
        referringURL = preferenceHelper.universalLinkUrl;
    }
    else if (preferenceHelper.externalIntentURI.length) {
        referringURL = preferenceHelper.externalIntentURI;
    }
    else {
        NSDictionary *sessionDataDict = [BNCEncodingUtils decodeJsonStringToDictionary:sessionData];
        NSString *link = sessionDataDict[BRANCH_RESPONSE_KEY_BRANCH_REFERRING_LINK];
        if (link.length) referringURL = link;
    }

    // Clear link identifiers so they don't get reused on the next open
    preferenceHelper.checkedFacebookAppLinks = NO;
    preferenceHelper.linkClickIdentifier = nil;
    preferenceHelper.spotlightIdentifier = nil;
    preferenceHelper.universalLinkUrl = nil;
    preferenceHelper.externalIntentURI = nil;
    preferenceHelper.appleSearchAdNeedsSend = NO;
    preferenceHelper.referringURL = referringURL;
    preferenceHelper.blacklistURLOpen = NO;

    NSString *string = BNCStringFromWireFormat(data[BRANCH_RESPONSE_KEY_BRANCH_IDENTITY]);
    if (string) preferenceHelper.identityID = string;

    [BranchOpenRequest releaseOpenResponseLock];

    BranchContentDiscoveryManifest *cdManifest = [BranchContentDiscoveryManifest getInstance];
    [cdManifest onBranchInitialised:data withUrl:referringURL];
    if ([cdManifest isCDEnabled]) {
        [[BranchContentDiscoverer getInstance] startDiscoveryTaskWithManifest:cdManifest];
    }

    if (self.callback) {
        self.callback(YES, nil);
    }
}

- (NSString *)getActionName {
    return @"open";
}


#pragma - Open Response Lock Handling


//	Instead of semaphores, the lock is handled by scheduled dispatch_queues.
//	This is the 'new' way to lock and is handled better optimized for iOS.
//	Also, since implied lock is handled by a scheduler and not a hard semaphore it's less error
//	prone.


static dispatch_queue_t openRequestWaitQueue = NULL;
static BOOL openRequestWaitQueueIsSuspended = NO;


+ (void) initialize {
    if (self != [BranchOpenRequest self])
        return;
    openRequestWaitQueue =
        dispatch_queue_create("io.branch.sdk.openqueue", DISPATCH_QUEUE_CONCURRENT);
}

+ (void) setWaitNeededForOpenResponseLock {
    @synchronized (self) {
        if (!openRequestWaitQueueIsSuspended) {
            BNCLogDebugSDK(@"Suspended for openRequestWaitQueue.");
            openRequestWaitQueueIsSuspended = YES;
            dispatch_suspend(openRequestWaitQueue);
        }
    }
}

+ (void) waitForOpenResponseLock {
    BNCLogDebugSDK(@"Waiting for openRequestWaitQueue.");
    [BNCDeviceInfo userAgentString];    //  Make sure we do this lock first to prevent a deadlock.
    dispatch_sync(openRequestWaitQueue, ^ {
        BNCLogDebugSDK(@"Finished waitForOpenResponseLock.");
    });
}

+ (void) releaseOpenResponseLock {
    @synchronized (self) {
        if (openRequestWaitQueueIsSuspended) {
            BNCLogDebugSDK(@"Resuming openRequestWaitQueue.");
            openRequestWaitQueueIsSuspended = NO;
            dispatch_resume(openRequestWaitQueue);
        }
    }
}

@end
