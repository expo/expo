#import "ABI28_0_0RNBranch.h"
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>
#import "ABI28_0_0BranchEvent+RNBranch.h"
#import "ABI28_0_0BranchLinkProperties+RNBranch.h"
#import "ABI28_0_0BranchUniversalObject+RNBranch.h"
#import "ABI28_0_0RNBranchAgingDictionary.h"
#import "ABI28_0_0RNBranchConfig.h"
#import "ABI28_0_0RNBranchEventEmitter.h"

#import "ABI28_0_0EXConstants.h"

// ABI28_0_0EXPO CHANGES:
// - Add #import "ABI28_0_0EXConstants.h"
// - Use ABI28_0_0EX_EXPORT_SCOPED_MODULE(ABI28_0_0RNBranch, BranchManager); instead of ABI28_0_0RCT_EXPORT_MODULE
// - Add scoped module init (initWithExperienceId)
// - Add setBridge
// - Move code from init to setBridge and delete init

NSString * const ABI28_0_0RNBranchLinkOpenedNotification = @"ABI28_0_0RNBranchLinkOpenedNotification";
NSString * const ABI28_0_0RNBranchLinkOpenedNotificationErrorKey = @"error";
NSString * const ABI28_0_0RNBranchLinkOpenedNotificationParamsKey = @"params";
NSString * const ABI28_0_0RNBranchLinkOpenedNotificationUriKey = @"uri";
NSString * const ABI28_0_0RNBranchLinkOpenedNotificationBranchUniversalObjectKey = @"branch_universal_object";
NSString * const ABI28_0_0RNBranchLinkOpenedNotificationLinkPropertiesKey = @"link_properties";

static NSDictionary *initSessionWithLaunchOptionsResult;
static BOOL useTestInstance = NO;

static NSString * const IdentFieldName = @"ident";

// These are only really exposed to the JS layer, so keep them internal for now.
static NSString * const ABI28_0_0RNBranchErrorDomain = @"ABI28_0_0RNBranchErrorDomain";
static NSInteger const ABI28_0_0RNBranchUniversalObjectNotFoundError = 1;


#pragma mark - Private ABI28_0_0RNBranch declarations

@interface ABI28_0_0RNBranch()
@property (nonatomic, readonly) UIViewController *currentViewController;
@property (nonatomic) ABI28_0_0RNBranchAgingDictionary<NSString *, BranchUniversalObject *> *universalObjectMap;
@end

#pragma mark - ABI28_0_0RNBranch implementation

@implementation ABI28_0_0RNBranch

@synthesize bridge = _bridge;

ABI28_0_0EX_EXPORT_SCOPED_MODULE(ABI28_0_0RNBranch, BranchManager);

+ (Branch *)branch
{
    @synchronized(self) {
        static Branch *instance;
        static dispatch_once_t once = 0;
        dispatch_once(&once, ^{
            ABI28_0_0RNBranchConfig *config = ABI28_0_0RNBranchConfig.instance;

            // YES if either [ABI28_0_0RNBranch useTestInstance] was called or useTestInstance: true is present in branch.json.
            BOOL usingTestInstance = useTestInstance || config.useTestInstance;
            NSString *key = config.branchKey ?: usingTestInstance ? config.testKey : config.liveKey;

            if (key) {
                // Override the Info.plist if these are present.
                instance = [Branch getInstance: key];
            }
            else {
                [Branch setUseTestBranchKey:usingTestInstance];
                instance = [Branch getInstance];
            }

            [self setupBranchInstance:instance];
        });
        return instance;
    }
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

+ (void)setupBranchInstance:(Branch *)instance
{
    ABI28_0_0RCTLogInfo(@"Initializing Branch SDK v. %@", BNC_SDK_VERSION);
    ABI28_0_0RNBranchConfig *config = ABI28_0_0RNBranchConfig.instance;
    if (config.debugMode) {
        [instance setDebug];
    }
    if (config.delayInitToCheckForSearchAds) {
        [instance delayInitToCheckForSearchAds];
    }
    if (config.appleSearchAdsDebugMode) {
        [instance setAppleSearchAdsDebugMode];
    }
}

- (NSDictionary<NSString *, NSString *> *)constantsToExport {
    return @{
             // ABI28_0_0RN events transmitted to JS by event emitter
             @"INIT_SESSION_SUCCESS": ABI28_0_0RNBranchInitSessionSuccess,
             @"INIT_SESSION_ERROR": ABI28_0_0RNBranchInitSessionError,

             // constants for use with userCompletedAction
             @"ADD_TO_CART_EVENT": BNCAddToCartEvent,
             @"ADD_TO_WISHLIST_EVENT": BNCAddToWishlistEvent,
             @"PURCHASED_EVENT": BNCPurchasedEvent,
             @"PURCHASE_INITIATED_EVENT": BNCPurchaseInitiatedEvent,
             @"REGISTER_VIEW_EVENT": BNCRegisterViewEvent,
             @"SHARE_COMPLETED_EVENT": BNCShareCompletedEvent,
             @"SHARE_INITIATED_EVENT": BNCShareInitiatedEvent,

             // constants for use with BranchEvent

             // Commerce events
             @"STANDARD_EVENT_ADD_TO_CART": BranchStandardEventAddToCart,
             @"STANDARD_EVENT_ADD_TO_WISHLIST": BranchStandardEventAddToWishlist,
             @"STANDARD_EVENT_VIEW_CART": BranchStandardEventViewCart,
             @"STANDARD_EVENT_INITIATE_PURCHASE": BranchStandardEventInitiatePurchase,
             @"STANDARD_EVENT_ADD_PAYMENT_INFO": BranchStandardEventAddPaymentInfo,
             @"STANDARD_EVENT_PURCHASE": BranchStandardEventPurchase,
             @"STANDARD_EVENT_SPEND_CREDITS": BranchStandardEventSpendCredits,

             // Content Events
             @"STANDARD_EVENT_SEARCH": BranchStandardEventSearch,
             @"STANDARD_EVENT_VIEW_ITEM": BranchStandardEventViewItem,
             @"STANDARD_EVENT_VIEW_ITEMS": BranchStandardEventViewItems,
             @"STANDARD_EVENT_RATE": BranchStandardEventRate,
             @"STANDARD_EVENT_SHARE": BranchStandardEventShare,

             // User Lifecycle Events
             @"STANDARD_EVENT_COMPLETE_REGISTRATION": BranchStandardEventCompleteRegistration,
             @"STANDARD_EVENT_COMPLETE_TUTORIAL": BranchStandardEventCompleteTutorial,
             @"STANDARD_EVENT_ACHIEVE_LEVEL": BranchStandardEventAchieveLevel,
             @"STANDARD_EVENT_UNLOCK_ACHIEVEMENT": BranchStandardEventUnlockAchievement
             };
}

#pragma mark - Class methods

+ (void)setDebug
{
    [self.branch setDebug];
}

+ (void)delayInitToCheckForSearchAds
{
    [self.branch delayInitToCheckForSearchAds];
}

+ (void)setAppleSearchAdsDebugMode
{
    [self.branch setAppleSearchAdsDebugMode];
}

+ (void)setRequestMetadataKey:(NSString *)key value:(NSObject *)value
{
    [self.branch setRequestMetadataKey:key value:value];
}

+ (void)useTestInstance {
    useTestInstance = YES;
}

//Called by AppDelegate.m -- stores initSession result in static variables and posts ABI28_0_0RNBranchLinkOpened event that's captured by the ABI28_0_0RNBranch instance to emit it to ReactABI28_0_0 Native
+ (void)initSessionWithLaunchOptions:(NSDictionary *)launchOptions isReferrable:(BOOL)isReferrable {
    [self.branch initSessionWithLaunchOptions:launchOptions isReferrable:isReferrable andRegisterDeepLinkHandler:^(NSDictionary *params, NSError *error) {
        NSMutableDictionary *result = [NSMutableDictionary dictionary];
        if (error) result[ABI28_0_0RNBranchLinkOpenedNotificationErrorKey] = error;
        if (params) {
            result[ABI28_0_0RNBranchLinkOpenedNotificationParamsKey] = params;
            BOOL clickedBranchLink = params[@"+clicked_branch_link"];

            if (clickedBranchLink) {
                BranchUniversalObject *branchUniversalObject = [BranchUniversalObject objectWithDictionary:params];
                if (branchUniversalObject) result[ABI28_0_0RNBranchLinkOpenedNotificationBranchUniversalObjectKey] = branchUniversalObject;

                BranchLinkProperties *linkProperties = [BranchLinkProperties getBranchLinkPropertiesFromDictionary:params];
                if (linkProperties) result[ABI28_0_0RNBranchLinkOpenedNotificationLinkPropertiesKey] = linkProperties;

                if (params[@"~referring_link"]) {
                    result[ABI28_0_0RNBranchLinkOpenedNotificationUriKey] = [NSURL URLWithString:params[@"~referring_link"]];
                }
            }
            else if (params[@"+non_branch_link"]) {
                result[ABI28_0_0RNBranchLinkOpenedNotificationUriKey] = [NSURL URLWithString:params[@"+non_branch_link"]];
            }
        }

        [[NSNotificationCenter defaultCenter] postNotificationName:ABI28_0_0RNBranchLinkOpenedNotification object:nil userInfo:result];
    }];
}

// TODO: Eliminate these now that sourceUrl is gone.
+ (BOOL)handleDeepLink:(NSURL *)url {
    BOOL handled = [self.branch handleDeepLink:url];
    return handled;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
+ (BOOL)continueUserActivity:(NSUserActivity *)userActivity {
    return [self.branch continueUserActivity:userActivity];
}
#pragma clang diagnostic pop

#pragma mark - Object lifecycle

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    [kernelServiceInstance branchModuleDidInit:self];
  }
  return self;
}

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  if ([self.bridge.scopedModules.constants.appOwnership isEqualToString:@"standalone"]) {
    _universalObjectMap = [ABI28_0_0RNBranchAgingDictionary dictionaryWithTtl:3600.0];

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onInitSessionFinished:) name:ABI28_0_0RNBranchLinkOpenedNotification object:nil];
  }
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Utility methods

- (UIViewController *)currentViewController
{
    UIViewController *current = [UIApplication sharedApplication].keyWindow.rootViewController;
    while (current.presentedViewController && ![current.presentedViewController isKindOfClass:UIAlertController.class]) {
        current = current.presentedViewController;
    }
    return current;
}

- (void) onInitSessionFinished:(NSNotification*) notification {
    NSURL *uri = notification.userInfo[ABI28_0_0RNBranchLinkOpenedNotificationUriKey];
    NSError *error = notification.userInfo[ABI28_0_0RNBranchLinkOpenedNotificationErrorKey];
    NSDictionary *params = notification.userInfo[ABI28_0_0RNBranchLinkOpenedNotificationParamsKey];

    initSessionWithLaunchOptionsResult = @{
                                           ABI28_0_0RNBranchLinkOpenedNotificationErrorKey: error.localizedDescription ?: NSNull.null,
                                           ABI28_0_0RNBranchLinkOpenedNotificationParamsKey: params ?: NSNull.null,
                                           ABI28_0_0RNBranchLinkOpenedNotificationUriKey: uri.absoluteString ?: NSNull.null
                                           };

    // If there is an error, fire error event
    if (error) {
        [ABI28_0_0RNBranchEventEmitter initSessionDidEncounterErrorWithPayload:initSessionWithLaunchOptionsResult];
    }

    // otherwise notify the session is finished
    else {
        [ABI28_0_0RNBranchEventEmitter initSessionDidSucceedWithPayload:initSessionWithLaunchOptionsResult];
    }
}

- (BranchLinkProperties*) createLinkProperties:(NSDictionary *)linkPropertiesMap withControlParams:(NSDictionary *)controlParamsMap
{
    BranchLinkProperties *linkProperties = [[BranchLinkProperties alloc] initWithMap:linkPropertiesMap];

    linkProperties.controlParams = controlParamsMap;
    return linkProperties;
}

- (BranchUniversalObject *)findUniversalObjectWithIdent:(NSString *)ident rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
{
    BranchUniversalObject *universalObject = self.universalObjectMap[ident];

    if (!universalObject) {
        NSString *errorMessage = [NSString stringWithFormat:@"BranchUniversalObject for ident %@ not found.", ident];

        NSError *error = [NSError errorWithDomain:ABI28_0_0RNBranchErrorDomain
                                             code:ABI28_0_0RNBranchUniversalObjectNotFoundError
                                         userInfo:@{IdentFieldName : ident,
                                                    NSLocalizedDescriptionKey: errorMessage
                                                    }];

        reject(@"ABI28_0_0RNBranch::Error::BUONotFound", errorMessage, error);
    }

    return universalObject;
}

#pragma mark - Methods exported to ReactABI28_0_0 Native

#pragma mark redeemInitSessionResult
ABI28_0_0RCT_EXPORT_METHOD(
                  redeemInitSessionResult:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    resolve(initSessionWithLaunchOptionsResult ?: [NSNull null]);
}

#pragma mark getLatestReferringParams
ABI28_0_0RCT_EXPORT_METHOD(
                  getLatestReferringParams:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    resolve([self.class.branch getLatestReferringParams]);
}

#pragma mark getFirstReferringParams
ABI28_0_0RCT_EXPORT_METHOD(
                  getFirstReferringParams:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    resolve([self.class.branch getFirstReferringParams]);
}

#pragma mark setIdentity
ABI28_0_0RCT_EXPORT_METHOD(
                  setIdentity:(NSString *)identity
                  ) {
    [self.class.branch setIdentity:identity];
}

#pragma mark logout
ABI28_0_0RCT_EXPORT_METHOD(
                  logout
                  ) {
    [self.class.branch logout];
}

#pragma mark openURL
ABI28_0_0RCT_EXPORT_METHOD(
                  openURL:(NSString *)urlString
                  ) {
    [self.class.branch handleDeepLinkWithNewSession:[NSURL URLWithString:urlString]];
}

#pragma mark sendCommerceEvent
ABI28_0_0RCT_EXPORT_METHOD(
                  sendCommerceEvent:(NSString *)revenue
                  metadata:(NSDictionary *)metadata
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BNCCommerceEvent *commerceEvent = [BNCCommerceEvent new];
    commerceEvent.revenue = [NSDecimalNumber decimalNumberWithString:revenue];
    [self.class.branch sendCommerceEvent:commerceEvent metadata:metadata withCompletion:nil];
    resolve(NSNull.null);
}

#pragma mark userCompletedAction
ABI28_0_0RCT_EXPORT_METHOD(
                  userCompletedAction:(NSString *)event withState:(NSDictionary *)appState
                  ) {
    [self.class.branch userCompletedAction:event withState:appState];
}

#pragma mark userCompletedActionOnUniversalObject
ABI28_0_0RCT_EXPORT_METHOD(
                  userCompletedActionOnUniversalObject:(NSString *)identifier
                  event:(NSString *)event
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    [branchUniversalObject userCompletedAction:event];
    resolve(NSNull.null);
}

#pragma mark userCompletedActionOnUniversalObject
ABI28_0_0RCT_EXPORT_METHOD(
                  userCompletedActionOnUniversalObject:(NSString *)identifier
                  event:(NSString *)event
                  state:(NSDictionary *)state
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    [branchUniversalObject userCompletedAction:event withState:state];
    resolve(NSNull.null);
}

#pragma mark logEvent
ABI28_0_0RCT_EXPORT_METHOD(
                  logEvent:(NSArray *)identifiers
                  eventName:(NSString *)eventName
                  params:(NSDictionary *)params
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BranchEvent *event = [[BranchEvent alloc] initWithName:eventName map:params];

    NSMutableArray<BranchUniversalObject *> *buos = @[].mutableCopy;
    for (NSString *identifier in identifiers) {
        BranchUniversalObject *buo = [self findUniversalObjectWithIdent:identifier rejecter:reject];
        if (!buo) return;

        [buos addObject:buo];
    }

    event.contentItems = buos;
    if ([eventName isEqualToString:BranchStandardEventViewItem] && params.count == 0) {
        for (BranchUniversalObject *buo in buos) {
            if (!buo.locallyIndex) continue;
            // for now at least, pending possible changes to the native SDK
            [buo listOnSpotlight];
        }
    }

    [event logEvent];
    resolve(NSNull.null);
}

#pragma mark showShareSheet
ABI28_0_0RCT_EXPORT_METHOD(
                  showShareSheet:(NSString *)identifier
                  withShareOptions:(NSDictionary *)shareOptionsMap
                  withLinkProperties:(NSDictionary *)linkPropertiesMap
                  withControlParams:(NSDictionary *)controlParamsMap
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    dispatch_async(dispatch_get_main_queue(), ^{
        NSMutableDictionary *mutableControlParams = controlParamsMap.mutableCopy;
        if (shareOptionsMap && shareOptionsMap[@"emailSubject"]) {
            mutableControlParams[@"$email_subject"] = shareOptionsMap[@"emailSubject"];
        }

        BranchLinkProperties *linkProperties = [self createLinkProperties:linkPropertiesMap withControlParams:mutableControlParams];

        [branchUniversalObject showShareSheetWithLinkProperties:linkProperties
                                                   andShareText:shareOptionsMap[@"messageBody"]
                                             fromViewController:self.currentViewController
                                            completionWithError:^(NSString * _Nullable activityType, BOOL completed, NSError * _Nullable activityError){
                                                if (activityError) {
                                                    NSString *errorCodeString = [NSString stringWithFormat:@"%ld", (long)activityError.code];
                                                    reject(errorCodeString, activityError.localizedDescription, activityError);
                                                    return;
                                                }

                                                NSDictionary *result = @{
                                                                         @"channel" : activityType ?: [NSNull null],
                                                                         @"completed" : @(completed),
                                                                         @"error" : [NSNull null]
                                                                         };

                                                resolve(result);
                                            }];
    });
}

#pragma mark registerView
ABI28_0_0RCT_EXPORT_METHOD(
                  registerView:(NSString *)identifier
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    [branchUniversalObject registerViewWithCallback:^(NSDictionary *params, NSError *error) {
        if (!error) {
            resolve([NSNull null]);
        } else {
            reject([NSString stringWithFormat: @"%lu", (long)error.code], error.localizedDescription, error);
        }
    }];
}

#pragma mark generateShortUrl
ABI28_0_0RCT_EXPORT_METHOD(
                  generateShortUrl:(NSString *)identifier
                  withLinkProperties:(NSDictionary *)linkPropertiesMap
                  withControlParams:(NSDictionary *)controlParamsMap
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    BranchLinkProperties *linkProperties = [self createLinkProperties:linkPropertiesMap withControlParams:controlParamsMap];

    [branchUniversalObject getShortUrlWithLinkProperties:linkProperties andCallback:^(NSString *url, NSError *error) {
        if (!error) {
            ABI28_0_0RCTLogInfo(@"ABI28_0_0RNBranch Success");
            resolve(@{ @"url": url });
        }
        else if (error.code == BNCDuplicateResourceError) {
            reject(@"ABI28_0_0RNBranch::Error::DuplicateResourceError", error.localizedDescription, error);
        }
        else {
            reject(@"ABI28_0_0RNBranch::Error", error.localizedDescription, error);
        }
    }];
}

#pragma mark listOnSpotlight
ABI28_0_0RCT_EXPORT_METHOD(
                  listOnSpotlight:(NSString *)identifier
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    [branchUniversalObject listOnSpotlightWithCallback:^(NSString *string, NSError *error) {
        if (!error) {
            NSDictionary *data = @{@"result":string};
            resolve(data);
        } else {
            reject([NSString stringWithFormat: @"%lu", (long)error.code], error.localizedDescription, error);
        }
    }];
}

// @TODO can this be removed? legacy, short url should be created from BranchUniversalObject
#pragma mark getShortUrl
ABI28_0_0RCT_EXPORT_METHOD(
                  getShortUrl:(NSDictionary *)linkPropertiesMap
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    NSString *feature = linkPropertiesMap[@"feature"];
    NSString *channel = linkPropertiesMap[@"channel"];
    NSString *stage = linkPropertiesMap[@"stage"];
    NSArray *tags = linkPropertiesMap[@"tags"];

    [self.class.branch getShortURLWithParams:linkPropertiesMap
                                  andTags:tags
                               andChannel:channel
                               andFeature:feature
                                 andStage:stage
                              andCallback:^(NSString *url, NSError *error) {
                                  if (error) {
                                      ABI28_0_0RCTLogError(@"ABI28_0_0RNBranch::Error: %@", error.localizedDescription);
                                      reject(@"ABI28_0_0RNBranch::Error", @"getShortURLWithParams", error);
                                  }
                                  resolve(url);
                              }];
}

#pragma mark loadRewards
ABI28_0_0RCT_EXPORT_METHOD(
                  loadRewards:(NSString *)bucket
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    [self.class.branch loadRewardsWithCallback:^(BOOL changed, NSError *error) {
        if(!error) {
            int credits = 0;
            if (bucket) {
                credits = (int)[self.class.branch getCreditsForBucket:bucket];
            } else {
                credits = (int)[self.class.branch getCredits];
            }
            resolve(@{@"credits": @(credits)});
        } else {
            ABI28_0_0RCTLogError(@"Load Rewards Error: %@", error.localizedDescription);
            reject(@"ABI28_0_0RNBranch::Error::loadRewardsWithCallback", @"loadRewardsWithCallback", error);
        }
    }];
}

#pragma mark redeemRewards
ABI28_0_0RCT_EXPORT_METHOD(
                  redeemRewards:(NSInteger)amount
                  inBucket:(NSString *)bucket
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    if (bucket) {
        [self.class.branch redeemRewards:amount forBucket:bucket callback:^(BOOL changed, NSError *error) {
            if (!error) {
                resolve(@{@"changed": @(changed)});
            } else {
                ABI28_0_0RCTLogError(@"Redeem Rewards Error: %@", error.localizedDescription);
                reject(@"ABI28_0_0RNBranch::Error::redeemRewards", error.localizedDescription, error);
            }
        }];
    } else {
        [self.class.branch redeemRewards:amount callback:^(BOOL changed, NSError *error) {
            if (!error) {
                resolve(@{@"changed": @(changed)});
            } else {
                ABI28_0_0RCTLogError(@"Redeem Rewards Error: %@", error.localizedDescription);
                reject(@"ABI28_0_0RNBranch::Error::redeemRewards", error.localizedDescription, error);
            }
        }];
    }
}

#pragma mark getCreditHistory
ABI28_0_0RCT_EXPORT_METHOD(
                  getCreditHistory:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    [self.class.branch getCreditHistoryWithCallback:^(NSArray *list, NSError *error) {
        if (!error) {
            resolve(list);
        } else {
            ABI28_0_0RCTLogError(@"Credit History Error: %@", error.localizedDescription);
            reject(@"ABI28_0_0RNBranch::Error::getCreditHistory", error.localizedDescription, error);
        }
    }];
}

#pragma mark createUniversalObject
ABI28_0_0RCT_EXPORT_METHOD(
                  createUniversalObject:(NSDictionary *)universalObjectProperties
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI28_0_0RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *universalObject = [[BranchUniversalObject alloc] initWithMap:universalObjectProperties];
    NSString *identifier = [NSUUID UUID].UUIDString;
    self.universalObjectMap[identifier] = universalObject;
    NSDictionary *response = @{IdentFieldName: identifier};

    resolve(response);
}

#pragma mark releaseUniversalObject
ABI28_0_0RCT_EXPORT_METHOD(
                  releaseUniversalObject:(NSString *)identifier
                  ) {
    [self.universalObjectMap removeObjectForKey:identifier];
}

@end
