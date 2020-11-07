#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "Analytics.h"
#import "SEGAliasPayload.h"
#import "SEGAnalytics.h"
#import "SEGAnalyticsConfiguration.h"
#import "SEGAnalyticsUtils.h"
#import "SEGContext.h"
#import "SEGCrypto.h"
#import "SEGGroupPayload.h"
#import "SEGHTTPClient.h"
#import "SEGIdentifyPayload.h"
#import "SEGIntegration.h"
#import "SEGIntegrationFactory.h"
#import "SEGMiddleware.h"
#import "SEGPayload.h"
#import "SEGReachability.h"
#import "SEGScreenPayload.h"
#import "SEGScreenReporting.h"
#import "SEGSegmentIntegration.h"
#import "SEGSegmentIntegrationFactory.h"
#import "SEGSerializableValue.h"
#import "SEGStorage.h"
#import "SEGTrackPayload.h"
#import "NSData+SEGGZIP.h"
#import "NSViewController+SEGScreen.h"
#import "SEGAES256Crypto.h"
#import "SEGFileStorage.h"
#import "SEGIntegrationsManager.h"
#import "SEGMacros.h"
#import "SEGState.h"
#import "SEGStoreKitTracker.h"
#import "SEGUserDefaultsStorage.h"
#import "SEGUtils.h"
#import "UIViewController+SEGScreen.h"

FOUNDATION_EXPORT double AnalyticsVersionNumber;
FOUNDATION_EXPORT const unsigned char AnalyticsVersionString[];

