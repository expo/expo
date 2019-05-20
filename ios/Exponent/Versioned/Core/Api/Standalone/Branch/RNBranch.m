#import "RNBranch.h"
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import "BranchEvent+RNBranch.h"
#import "BranchLinkProperties+RNBranch.h"
#import "BranchUniversalObject+RNBranch.h"
#import "RNBranchAgingDictionary.h"
#import "RNBranchConfig.h"
#import "RNBranchEventEmitter.h"
#import "EXScopedModuleRegistry.h"
#import "EXModuleRegistryBinding.h"
#import "EXConstantsBinding.h"

#import <UMConstantsInterface/UMConstantsInterface.h>

// EXPO CHANGES:
// - Add #import "EXConstants.h"
// - Use EX_EXPORT_SCOPED_MODULE(RNBranch, BranchManager); instead of RCT_EXPORT_MODULE
// - Add scoped module init (initWithExperienceId)
// - Add setBridge
// - Move code from init to setBridge and delete init

NSString * const RNBranchLinkOpenedNotification = @"RNBranchLinkOpenedNotification";
NSString * const RNBranchLinkOpenedNotificationErrorKey = @"error";
NSString * const RNBranchLinkOpenedNotificationParamsKey = @"params";
NSString * const RNBranchLinkOpenedNotificationUriKey = @"uri";
NSString * const RNBranchLinkOpenedNotificationBranchUniversalObjectKey = @"branch_universal_object";
NSString * const RNBranchLinkOpenedNotificationLinkPropertiesKey = @"link_properties";

static NSDictionary *initSessionWithLaunchOptionsResult;
static BOOL useTestInstance = NO;

static NSString * const IdentFieldName = @"ident";

// These are only really exposed to the JS layer, so keep them internal for now.
static NSString * const RNBranchErrorDomain = @"RNBranchErrorDomain";
static NSInteger const RNBranchUniversalObjectNotFoundError = 1;


#pragma mark - Private RNBranch declarations

@interface RNBranch()
@property (nonatomic, readonly) UIViewController *currentViewController;
@property (nonatomic) RNBranchAgingDictionary<NSString *, BranchUniversalObject *> *universalObjectMap;
@end

#pragma mark - RNBranch implementation

@implementation RNBranch

@synthesize bridge = _bridge;

EX_EXPORT_SCOPED_MODULE(RNBranch, BranchManager);

+ (Branch *)branch
{
    @synchronized(self) {
        static Branch *instance;
        static dispatch_once_t once = 0;
        dispatch_once(&once, ^{
            RNBranchConfig *config = RNBranchConfig.instance;

            // YES if either [RNBranch useTestInstance] was called or useTestInstance: true is present in branch.json.
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
    RCTLogInfo(@"Initializing Branch SDK v. %@", BNC_SDK_VERSION);
    RNBranchConfig *config = RNBranchConfig.instance;
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
             // RN events transmitted to JS by event emitter
             @"INIT_SESSION_SUCCESS": RNBranchInitSessionSuccess,
             @"INIT_SESSION_ERROR": RNBranchInitSessionError,

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

//Called by AppDelegate.m -- stores initSession result in static variables and posts RNBranchLinkOpened event that's captured by the RNBranch instance to emit it to React Native
+ (void)initSessionWithLaunchOptions:(NSDictionary *)launchOptions isReferrable:(BOOL)isReferrable {
    [self.branch initSessionWithLaunchOptions:launchOptions isReferrable:isReferrable andRegisterDeepLinkHandler:^(NSDictionary *params, NSError *error) {
        NSMutableDictionary *result = [NSMutableDictionary dictionary];
        if (error) result[RNBranchLinkOpenedNotificationErrorKey] = error;
        if (params) {
            result[RNBranchLinkOpenedNotificationParamsKey] = params;
            BOOL clickedBranchLink = params[@"+clicked_branch_link"];

            if (clickedBranchLink) {
                BranchUniversalObject *branchUniversalObject = [BranchUniversalObject objectWithDictionary:params];
                if (branchUniversalObject) result[RNBranchLinkOpenedNotificationBranchUniversalObjectKey] = branchUniversalObject;

                BranchLinkProperties *linkProperties = [BranchLinkProperties getBranchLinkPropertiesFromDictionary:params];
                if (linkProperties) result[RNBranchLinkOpenedNotificationLinkPropertiesKey] = linkProperties;

                if (params[@"~referring_link"]) {
                    result[RNBranchLinkOpenedNotificationUriKey] = [NSURL URLWithString:params[@"~referring_link"]];
                }
            }
            else if (params[@"+non_branch_link"]) {
                result[RNBranchLinkOpenedNotificationUriKey] = [NSURL URLWithString:params[@"+non_branch_link"]];
            }
        }

        [[NSNotificationCenter defaultCenter] postNotificationName:RNBranchLinkOpenedNotification object:nil userInfo:result];
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

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  EXConstantsBinding *constants = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(UMConstantsInterface)];

  if ([constants.appOwnership isEqualToString:@"standalone"]) {
    _universalObjectMap = [RNBranchAgingDictionary dictionaryWithTtl:3600.0];

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onInitSessionFinished:) name:RNBranchLinkOpenedNotification object:nil];
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
    NSURL *uri = notification.userInfo[RNBranchLinkOpenedNotificationUriKey];
    NSError *error = notification.userInfo[RNBranchLinkOpenedNotificationErrorKey];
    NSDictionary *params = notification.userInfo[RNBranchLinkOpenedNotificationParamsKey];

    initSessionWithLaunchOptionsResult = @{
                                           RNBranchLinkOpenedNotificationErrorKey: error.localizedDescription ?: NSNull.null,
                                           RNBranchLinkOpenedNotificationParamsKey: params ?: NSNull.null,
                                           RNBranchLinkOpenedNotificationUriKey: uri.absoluteString ?: NSNull.null
                                           };

    // If there is an error, fire error event
    if (error) {
        [RNBranchEventEmitter initSessionDidEncounterErrorWithPayload:initSessionWithLaunchOptionsResult];
    }

    // otherwise notify the session is finished
    else {
        [RNBranchEventEmitter initSessionDidSucceedWithPayload:initSessionWithLaunchOptionsResult];
    }
}

- (BranchLinkProperties*) createLinkProperties:(NSDictionary *)linkPropertiesMap withControlParams:(NSDictionary *)controlParamsMap
{
    BranchLinkProperties *linkProperties = [[BranchLinkProperties alloc] initWithMap:linkPropertiesMap];

    linkProperties.controlParams = controlParamsMap;
    return linkProperties;
}

- (BranchUniversalObject *)findUniversalObjectWithIdent:(NSString *)ident rejecter:(RCTPromiseRejectBlock)reject
{
    BranchUniversalObject *universalObject = self.universalObjectMap[ident];

    if (!universalObject) {
        NSString *errorMessage = [NSString stringWithFormat:@"BranchUniversalObject for ident %@ not found.", ident];

        NSError *error = [NSError errorWithDomain:RNBranchErrorDomain
                                             code:RNBranchUniversalObjectNotFoundError
                                         userInfo:@{IdentFieldName : ident,
                                                    NSLocalizedDescriptionKey: errorMessage
                                                    }];

        reject(@"RNBranch::Error::BUONotFound", errorMessage, error);
    }

    return universalObject;
}

#pragma mark - Methods exported to React Native

#pragma mark redeemInitSessionResult
RCT_EXPORT_METHOD(
                  redeemInitSessionResult:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject
                  ) {
    resolve(initSessionWithLaunchOptionsResult ?: [NSNull null]);
}

#pragma mark getLatestReferringParams
RCT_EXPORT_METHOD(
                  getLatestReferringParams:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject
                  ) {
    resolve([self.class.branch getLatestReferringParams]);
}

#pragma mark getFirstReferringParams
RCT_EXPORT_METHOD(
                  getFirstReferringParams:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject
                  ) {
    resolve([self.class.branch getFirstReferringParams]);
}

#pragma mark setIdentity
RCT_EXPORT_METHOD(
                  setIdentity:(NSString *)identity
                  ) {
    [self.class.branch setIdentity:identity];
}

#pragma mark logout
RCT_EXPORT_METHOD(
                  logout
                  ) {
    [self.class.branch logout];
}

#pragma mark openURL
RCT_EXPORT_METHOD(
                  openURL:(NSString *)urlString
                  ) {
    [self.class.branch handleDeepLinkWithNewSession:[NSURL URLWithString:urlString]];
}

#pragma mark sendCommerceEvent
RCT_EXPORT_METHOD(
                  sendCommerceEvent:(NSString *)revenue
                  metadata:(NSDictionary *)metadata
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject
                  ) {
    BNCCommerceEvent *commerceEvent = [BNCCommerceEvent new];
    commerceEvent.revenue = [NSDecimalNumber decimalNumberWithString:revenue];
    [self.class.branch sendCommerceEvent:commerceEvent metadata:metadata withCompletion:nil];
    resolve(NSNull.null);
}

#pragma mark userCompletedAction
RCT_EXPORT_METHOD(
                  userCompletedAction:(NSString *)event withState:(NSDictionary *)appState
                  ) {
    [self.class.branch userCompletedAction:event withState:appState];
}

#pragma mark userCompletedActionOnUniversalObject
RCT_EXPORT_METHOD(
                  userCompletedActionOnUniversalObject:(NSString *)identifier
                  event:(NSString *)event
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    [branchUniversalObject userCompletedAction:event];
    resolve(NSNull.null);
}

#pragma mark userCompletedActionOnUniversalObject
RCT_EXPORT_METHOD(
                  userCompletedActionOnUniversalObject:(NSString *)identifier
                  event:(NSString *)event
                  state:(NSDictionary *)state
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    [branchUniversalObject userCompletedAction:event withState:state];
    resolve(NSNull.null);
}

#pragma mark logEvent
RCT_EXPORT_METHOD(
                  logEvent:(NSArray *)identifiers
                  eventName:(NSString *)eventName
                  params:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
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
RCT_EXPORT_METHOD(
                  showShareSheet:(NSString *)identifier
                  withShareOptions:(NSDictionary *)shareOptionsMap
                  withLinkProperties:(NSDictionary *)linkPropertiesMap
                  withControlParams:(NSDictionary *)controlParamsMap
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
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
RCT_EXPORT_METHOD(
                  registerView:(NSString *)identifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
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
RCT_EXPORT_METHOD(
                  generateShortUrl:(NSString *)identifier
                  withLinkProperties:(NSDictionary *)linkPropertiesMap
                  withControlParams:(NSDictionary *)controlParamsMap
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *branchUniversalObject = [self findUniversalObjectWithIdent:identifier rejecter:reject];
    if (!branchUniversalObject) return;

    BranchLinkProperties *linkProperties = [self createLinkProperties:linkPropertiesMap withControlParams:controlParamsMap];

    [branchUniversalObject getShortUrlWithLinkProperties:linkProperties andCallback:^(NSString *url, NSError *error) {
        if (!error) {
            RCTLogInfo(@"RNBranch Success");
            resolve(@{ @"url": url });
        }
        else if (error.code == BNCDuplicateResourceError) {
            reject(@"RNBranch::Error::DuplicateResourceError", error.localizedDescription, error);
        }
        else {
            reject(@"RNBranch::Error", error.localizedDescription, error);
        }
    }];
}

#pragma mark listOnSpotlight
RCT_EXPORT_METHOD(
                  listOnSpotlight:(NSString *)identifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
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
RCT_EXPORT_METHOD(
                  getShortUrl:(NSDictionary *)linkPropertiesMap
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
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
                                      RCTLogError(@"RNBranch::Error: %@", error.localizedDescription);
                                      reject(@"RNBranch::Error", @"getShortURLWithParams", error);
                                  }
                                  resolve(url);
                              }];
}

#pragma mark loadRewards
RCT_EXPORT_METHOD(
                  loadRewards:(NSString *)bucket
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
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
            RCTLogError(@"Load Rewards Error: %@", error.localizedDescription);
            reject(@"RNBranch::Error::loadRewardsWithCallback", @"loadRewardsWithCallback", error);
        }
    }];
}

#pragma mark redeemRewards
RCT_EXPORT_METHOD(
                  redeemRewards:(NSInteger)amount
                  inBucket:(NSString *)bucket
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  ) {
    if (bucket) {
        [self.class.branch redeemRewards:amount forBucket:bucket callback:^(BOOL changed, NSError *error) {
            if (!error) {
                resolve(@{@"changed": @(changed)});
            } else {
                RCTLogError(@"Redeem Rewards Error: %@", error.localizedDescription);
                reject(@"RNBranch::Error::redeemRewards", error.localizedDescription, error);
            }
        }];
    } else {
        [self.class.branch redeemRewards:amount callback:^(BOOL changed, NSError *error) {
            if (!error) {
                resolve(@{@"changed": @(changed)});
            } else {
                RCTLogError(@"Redeem Rewards Error: %@", error.localizedDescription);
                reject(@"RNBranch::Error::redeemRewards", error.localizedDescription, error);
            }
        }];
    }
}

#pragma mark getCreditHistory
RCT_EXPORT_METHOD(
                  getCreditHistory:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  ) {
    [self.class.branch getCreditHistoryWithCallback:^(NSArray *list, NSError *error) {
        if (!error) {
            resolve(list);
        } else {
            RCTLogError(@"Credit History Error: %@", error.localizedDescription);
            reject(@"RNBranch::Error::getCreditHistory", error.localizedDescription, error);
        }
    }];
}

#pragma mark createUniversalObject
RCT_EXPORT_METHOD(
                  createUniversalObject:(NSDictionary *)universalObjectProperties
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject
                  ) {
    BranchUniversalObject *universalObject = [[BranchUniversalObject alloc] initWithMap:universalObjectProperties];
    NSString *identifier = [NSUUID UUID].UUIDString;
    self.universalObjectMap[identifier] = universalObject;
    NSDictionary *response = @{IdentFieldName: identifier};

    resolve(response);
}

#pragma mark releaseUniversalObject
RCT_EXPORT_METHOD(
                  releaseUniversalObject:(NSString *)identifier
                  ) {
    [self.universalObjectMap removeObjectForKey:identifier];
}

@end
