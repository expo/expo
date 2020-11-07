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

#import "EXNotificationBuilder.h"
#import "EXBadgeModule.h"
#import "EXInstallationIdProvider.h"
#import "EXNotificationCategoriesModule.h"
#import "EXNotificationsEmitter.h"
#import "EXNotificationCenterDelegate.h"
#import "EXNotificationsDelegate.h"
#import "EXNotificationSerializer.h"
#import "EXNotificationsHandlerModule.h"
#import "EXSingleNotificationHandlerTask.h"
#import "NSDictionary+EXNotificationsVerifyingClass.h"
#import "EXNotificationPresentationModule.h"
#import "EXNotificationSchedulerModule.h"
#import "EXLegacyRemoteNotificationPermissionRequester.h"
#import "EXNotificationPermissionsModule.h"
#import "EXRemoteNotificationPermissionSingletonModule.h"
#import "EXUserFacingNotificationsPermissionsRequester.h"
#import "EXPushTokenListener.h"
#import "EXPushTokenManager.h"
#import "EXPushTokenModule.h"

FOUNDATION_EXPORT double EXNotificationsVersionNumber;
FOUNDATION_EXPORT const unsigned char EXNotificationsVersionString[];

