// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "TargetConditionals.h"

#if TARGET_OS_IOS || TARGET_OS_TV

#import <GoogleUtilities/GULAppEnvironmentUtil.h>
#import <GoogleUtilities/GULLogger.h>
#import <GoogleUtilities/GULMutableDictionary.h>
#import "../Common/GULLoggerCodes.h"
#import "Internal/GULAppDelegateSwizzler_Private.h"
#import "Private/GULAppDelegateSwizzler.h"

#import <UIKit/UIKit.h>
#import <objc/runtime.h>

// Implementations need to be typed before calling the implementation directly to cast the
// arguments and the return types correctly. Otherwise, it will crash the app.
typedef BOOL (*GULRealOpenURLSourceApplicationAnnotationIMP)(
    id, SEL, UIApplication *, NSURL *, NSString *, id);

typedef BOOL (*GULRealOpenURLOptionsIMP)(
    id, SEL, UIApplication *, NSURL *, NSDictionary<NSString *, id> *);

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wstrict-prototypes"
typedef void (*GULRealHandleEventsForBackgroundURLSessionIMP)(
    id, SEL, UIApplication *, NSString *, void (^)());
#pragma clang diagnostic pop

// This is needed to for the library to be warning free on iOS versions < 8.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
typedef BOOL (*GULRealContinueUserActivityIMP)(
    id, SEL, UIApplication *, NSUserActivity *, void (^)(NSArray *restorableObjects));
#pragma clang diagnostic pop

typedef void (*GULRealDidRegisterForRemoteNotificationsIMP)(id, SEL, UIApplication *, NSData *);

typedef void (*GULRealDidFailToRegisterForRemoteNotificationsIMP)(id,
                                                                  SEL,
                                                                  UIApplication *,
                                                                  NSError *);

typedef void (*GULRealDidReceiveRemoteNotificationIMP)(id, SEL, UIApplication *, NSDictionary *);

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 70000
// This is needed to for the library to be warning free on iOS versions < 7.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
typedef void (*GULRealDidReceiveRemoteNotificationWithCompletionIMP)(
    id, SEL, UIApplication *, NSDictionary *, void (^)(UIBackgroundFetchResult));
#pragma clang diagnostic pop
#endif  // __IPHONE_OS_VERSION_MAX_ALLOWED >= 70000

typedef void (^GULAppDelegateInterceptorCallback)(id<UIApplicationDelegate>);

// The strings below are the keys for associated objects.
static char const *const kGULRealIMPBySelectorKey = "GUL_realIMPBySelector";
static char const *const kGULRealClassKey = "GUL_realClass";

static NSString *const kGULAppDelegateKeyPath = @"delegate";

static GULLoggerService kGULLoggerSwizzler = @"[GoogleUtilities/AppDelegateSwizzler]";

// Since Firebase SDKs also use this for app delegate proxying, in order to not be a breaking change
// we disable App Delegate proxying when either of these two flags are set to NO.

/** Plist key that allows Firebase developers to disable App Delegate Proxying. */
static NSString *const kGULFirebaseAppDelegateProxyEnabledPlistKey =
    @"FirebaseAppDelegateProxyEnabled";

/** Plist key that allows developers not using Firebase to disable App Delegate Proxying. */
static NSString *const kGULGoogleUtilitiesAppDelegateProxyEnabledPlistKey =
    @"GoogleUtilitiesAppDelegateProxyEnabled";

/** The prefix of the App Delegate. */
static NSString *const kGULAppDelegatePrefix = @"GUL_";

/** The original instance of App Delegate. */
static id<UIApplicationDelegate> gOriginalAppDelegate;

/** The original App Delegate class */
static Class gOriginalAppDelegateClass;

/** The subclass of the original App Delegate. */
static Class gAppDelegateSubclass;

/** Remote notification methods selectors
 *
 *  We have to opt out of referencing APNS related App Delegate methods directly to prevent
 *  an Apple review warning email about missing Push Notification Entitlement
 *  (like here: https://github.com/firebase/firebase-ios-sdk/issues/2807). From our experience, the
 *  warning is triggered when any of the symbols is present in the application sent to review, even
 *  if the code is never executed. Because GULAppDelegateSwizzler may be used by applications that
 *  are not using APNS we have to refer to the methods indirectly using selector constructed from
 *  string.
 *
 *  NOTE: None of the methods is proxied unless it is explicitly requested by calling the method
 *  +[GULAppDelegateSwizzler proxyOriginalDelegateIncludingAPNSMethods]
 */
static NSString *const kGULDidRegisterForRemoteNotificationsSEL =
    @"application:didRegisterForRemoteNotificationsWithDeviceToken:";
static NSString *const kGULDidFailToRegisterForRemoteNotificationsSEL =
    @"application:didFailToRegisterForRemoteNotificationsWithError:";
static NSString *const kGULDidReceiveRemoteNotificationSEL =
    @"application:didReceiveRemoteNotification:";
static NSString *const kGULDidReceiveRemoteNotificationWithCompletionSEL =
    @"application:didReceiveRemoteNotification:fetchCompletionHandler:";

/**
 * This class is necessary to store the delegates in an NSArray without retaining them.
 * [NSValue valueWithNonRetainedObject] also provides this functionality, but does not provide a
 * zeroing pointer. This will cause EXC_BAD_ACCESS when trying to access the object after it is
 * dealloced. Instead, this container stores a weak, zeroing reference to the object, which
 * automatically is set to nil by the runtime when the object is dealloced.
 */
@interface GULZeroingWeakContainer : NSObject

/** Stores a weak object. */
@property(nonatomic, weak) id object;

@end

@implementation GULZeroingWeakContainer
@end

@interface GULAppDelegateObserver : NSObject
@end

@implementation GULAppDelegateObserver {
  BOOL _isObserving;
}

+ (GULAppDelegateObserver *)sharedInstance {
  static GULAppDelegateObserver *instance;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    instance = [[GULAppDelegateObserver alloc] init];
  });
  return instance;
}

- (void)observeUIApplication {
  if (_isObserving) {
    return;
  }
  [[GULAppDelegateSwizzler sharedApplication]
      addObserver:self
       forKeyPath:kGULAppDelegateKeyPath
          options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld
          context:nil];
  _isObserving = YES;
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
  if ([keyPath isEqual:kGULAppDelegateKeyPath]) {
    id newValue = change[NSKeyValueChangeNewKey];
    id oldValue = change[NSKeyValueChangeOldKey];
    if ([newValue isEqual:oldValue]) {
      return;
    }
    // Free the stored app delegate instance because it has been changed to a different instance to
    // avoid keeping it alive forever.
    if ([oldValue isEqual:gOriginalAppDelegate]) {
      gOriginalAppDelegate = nil;
      // Remove the observer. Parse it to NSObject to avoid warning.
      [[GULAppDelegateSwizzler sharedApplication] removeObserver:self
                                                      forKeyPath:kGULAppDelegateKeyPath];
      _isObserving = NO;
    }
  }
}

@end

@implementation GULAppDelegateSwizzler

static dispatch_once_t sProxyAppDelegateOnceToken;
static dispatch_once_t sProxyAppDelegateRemoteNotificationOnceToken;

#pragma mark - Public methods

+ (BOOL)isAppDelegateProxyEnabled {
  NSDictionary *infoDictionary = [NSBundle mainBundle].infoDictionary;

  id isFirebaseProxyEnabledPlistValue = infoDictionary[kGULFirebaseAppDelegateProxyEnabledPlistKey];
  id isGoogleProxyEnabledPlistValue =
      infoDictionary[kGULGoogleUtilitiesAppDelegateProxyEnabledPlistKey];

  // Enabled by default.
  BOOL isFirebaseAppDelegateProxyEnabled = YES;
  BOOL isGoogleUtilitiesAppDelegateProxyEnabled = YES;

  if ([isFirebaseProxyEnabledPlistValue isKindOfClass:[NSNumber class]]) {
    isFirebaseAppDelegateProxyEnabled = [isFirebaseProxyEnabledPlistValue boolValue];
  }

  if ([isGoogleProxyEnabledPlistValue isKindOfClass:[NSNumber class]]) {
    isGoogleUtilitiesAppDelegateProxyEnabled = [isGoogleProxyEnabledPlistValue boolValue];
  }

  // Only deactivate the proxy if it is explicitly disabled by app developers using either one of
  // the plist flags.
  return isFirebaseAppDelegateProxyEnabled && isGoogleUtilitiesAppDelegateProxyEnabled;
}

+ (GULAppDelegateInterceptorID)registerAppDelegateInterceptor:
    (id<UIApplicationDelegate>)interceptor {
  NSAssert(interceptor, @"AppDelegateProxy cannot add nil interceptor");
  NSAssert([interceptor conformsToProtocol:@protocol(UIApplicationDelegate)],
           @"AppDelegateProxy interceptor does not conform to UIApplicationDelegate");

  if (!interceptor) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling000],
                @"AppDelegateProxy cannot add nil interceptor.");
    return nil;
  }
  if (![interceptor conformsToProtocol:@protocol(UIApplicationDelegate)]) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling001],
                @"AppDelegateProxy interceptor does not conform to UIApplicationDelegate");
    return nil;
  }

  // The ID should be the same given the same interceptor object.
  NSString *interceptorID = [NSString stringWithFormat:@"%@%p", kGULAppDelegatePrefix, interceptor];
  if (!interceptorID.length) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling002],
                @"AppDelegateProxy cannot create Interceptor ID.");
    return nil;
  }
  GULZeroingWeakContainer *weakObject = [[GULZeroingWeakContainer alloc] init];
  weakObject.object = interceptor;
  [GULAppDelegateSwizzler interceptors][interceptorID] = weakObject;
  return interceptorID;
}

+ (void)unregisterAppDelegateInterceptorWithID:(GULAppDelegateInterceptorID)interceptorID {
  NSAssert(interceptorID, @"AppDelegateProxy cannot unregister nil interceptor ID.");
  NSAssert(((NSString *)interceptorID).length != 0,
           @"AppDelegateProxy cannot unregister empty interceptor ID.");

  if (!interceptorID) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling003],
                @"AppDelegateProxy cannot unregister empty interceptor ID.");
    return;
  }

  GULZeroingWeakContainer *weakContainer = [GULAppDelegateSwizzler interceptors][interceptorID];
  if (!weakContainer.object) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling004],
                @"AppDelegateProxy cannot unregister interceptor that was not registered. "
                 "Interceptor ID %@",
                interceptorID);
    return;
  }

  [[GULAppDelegateSwizzler interceptors] removeObjectForKey:interceptorID];
}

+ (void)proxyOriginalDelegate {
  if ([GULAppEnvironmentUtil isAppExtension]) {
    return;
  }

  dispatch_once(&sProxyAppDelegateOnceToken, ^{
    id<UIApplicationDelegate> originalDelegate =
        [GULAppDelegateSwizzler sharedApplication].delegate;
    [GULAppDelegateSwizzler proxyAppDelegate:originalDelegate];
  });
}

+ (void)proxyOriginalDelegateIncludingAPNSMethods {
  if ([GULAppEnvironmentUtil isAppExtension]) {
    return;
  }

  [self proxyOriginalDelegate];

  dispatch_once(&sProxyAppDelegateRemoteNotificationOnceToken, ^{
    id<UIApplicationDelegate> appDelegate = [GULAppDelegateSwizzler sharedApplication].delegate;

    NSMutableDictionary *realImplementationsBySelector =
        [objc_getAssociatedObject(appDelegate, &kGULRealIMPBySelectorKey) mutableCopy];

    [self proxyRemoteNotificationsMethodsWithAppDelegateSubClass:gAppDelegateSubclass
                                                       realClass:gOriginalAppDelegateClass
                                                     appDelegate:appDelegate
                                   realImplementationsBySelector:realImplementationsBySelector];

    objc_setAssociatedObject(appDelegate, &kGULRealIMPBySelectorKey,
                             [realImplementationsBySelector copy], OBJC_ASSOCIATION_RETAIN);
    [self reassignAppDelegate];
  });
}

#pragma mark - Create proxy

+ (UIApplication *)sharedApplication {
  if ([GULAppEnvironmentUtil isAppExtension]) {
    return nil;
  }
  id sharedApplication = nil;
  Class uiApplicationClass = NSClassFromString(@"UIApplication");
  if (uiApplicationClass &&
      [uiApplicationClass respondsToSelector:(NSSelectorFromString(@"sharedApplication"))]) {
    sharedApplication = [uiApplicationClass sharedApplication];
  }
  return sharedApplication;
}

#pragma mark - Override default methods

/** Creates a new subclass of the class of the given object and sets the isa value of the given
 *  object to the new subclass. Additionally this copies methods to that new subclass that allow us
 *  to intercept UIApplicationDelegate methods. This is better known as isa swizzling.
 *
 *  @param appDelegate The object to which you want to isa swizzle. This has to conform to the
 *      UIApplicationDelegate subclass.
 *  @return Returns the new subclass.
 */
+ (nullable Class)createSubclassWithObject:(id<UIApplicationDelegate>)appDelegate {
  Class realClass = [appDelegate class];

  // Create GUL_<RealAppDelegate>_<UUID>
  NSString *classNameWithPrefix =
      [kGULAppDelegatePrefix stringByAppendingString:NSStringFromClass(realClass)];
  NSString *newClassName =
      [NSString stringWithFormat:@"%@-%@", classNameWithPrefix, [NSUUID UUID].UUIDString];

  if (NSClassFromString(newClassName)) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling005],
                @"Cannot create a proxy for App Delegate. Subclass already exists. Original Class: "
                @"%@, subclass: %@",
                NSStringFromClass(realClass), newClassName);
    return nil;
  }

  // Register the new class as subclass of the real one. Do not allocate more than the real class
  // size.
  Class appDelegateSubClass = objc_allocateClassPair(realClass, newClassName.UTF8String, 0);
  if (appDelegateSubClass == Nil) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling006],
                @"Cannot create a proxy for App Delegate. Subclass already exists. Original Class: "
                @"%@, subclass: Nil",
                NSStringFromClass(realClass));
    return nil;
  }

  NSMutableDictionary<NSString *, NSValue *> *realImplementationsBySelector =
      [[NSMutableDictionary alloc] init];

  // Add the following methods from GULAppDelegate class, and store the real implementation so it
  // can forward to the real one.
  // For application:openURL:options:
  SEL applicationOpenURLOptionsSEL = @selector(application:openURL:options:);
  if ([appDelegate respondsToSelector:applicationOpenURLOptionsSEL]) {
    // Only add the application:openURL:options: method if the original AppDelegate implements it.
    // This fixes a bug if an app only implements application:openURL:sourceApplication:annotation:
    // (if we add the `options` method, iOS sees that one exists and does not call the
    // `sourceApplication` method, which in this case is the only one the app implements).

    [self proxyDestinationSelector:applicationOpenURLOptionsSEL
        implementationsFromSourceSelector:applicationOpenURLOptionsSEL
                                fromClass:[GULAppDelegateSwizzler class]
                                  toClass:appDelegateSubClass
                                realClass:realClass
         storeDestinationImplementationTo:realImplementationsBySelector];
  }

  // For application:continueUserActivity:restorationHandler:
  SEL continueUserActivitySEL = @selector(application:continueUserActivity:restorationHandler:);
  [self proxyDestinationSelector:continueUserActivitySEL
      implementationsFromSourceSelector:continueUserActivitySEL
                              fromClass:[GULAppDelegateSwizzler class]
                                toClass:appDelegateSubClass
                              realClass:realClass
       storeDestinationImplementationTo:realImplementationsBySelector];

  // For application:handleEventsForBackgroundURLSession:completionHandler:
  SEL handleEventsForBackgroundURLSessionSEL = @selector(application:
                                 handleEventsForBackgroundURLSession:completionHandler:);
  [self proxyDestinationSelector:handleEventsForBackgroundURLSessionSEL
      implementationsFromSourceSelector:handleEventsForBackgroundURLSessionSEL
                              fromClass:[GULAppDelegateSwizzler class]
                                toClass:appDelegateSubClass
                              realClass:realClass
       storeDestinationImplementationTo:realImplementationsBySelector];

#if TARGET_OS_IOS
  // For application:openURL:sourceApplication:annotation:
  SEL openURLSourceApplicationAnnotationSEL = @selector(application:
                                                            openURL:sourceApplication:annotation:);

  [self proxyDestinationSelector:openURLSourceApplicationAnnotationSEL
      implementationsFromSourceSelector:openURLSourceApplicationAnnotationSEL
                              fromClass:[GULAppDelegateSwizzler class]
                                toClass:appDelegateSubClass
                              realClass:realClass
       storeDestinationImplementationTo:realImplementationsBySelector];
#endif  // TARGET_OS_IOS

  // Override the description too so the custom class name will not show up.
  [GULAppDelegateSwizzler addInstanceMethodWithDestinationSelector:@selector(description)
                              withImplementationFromSourceSelector:@selector(fakeDescription)
                                                         fromClass:[self class]
                                                           toClass:appDelegateSubClass];

  // Store original implementations to a fake property of the original delegate.
  objc_setAssociatedObject(appDelegate, &kGULRealIMPBySelectorKey,
                           [realImplementationsBySelector copy], OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  objc_setAssociatedObject(appDelegate, &kGULRealClassKey, realClass,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  // The subclass size has to be exactly the same size with the original class size. The subclass
  // cannot have more ivars/properties than its superclass since it will cause an offset in memory
  // that can lead to overwriting the isa of an object in the next frame.
  if (class_getInstanceSize(realClass) != class_getInstanceSize(appDelegateSubClass)) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling007],
                @"Cannot create subclass of App Delegate, because the created subclass is not the "
                @"same size. %@",
                NSStringFromClass(realClass));
    NSAssert(NO, @"Classes must be the same size to swizzle isa");
    return nil;
  }

  // Make the newly created class to be the subclass of the real App Delegate class.
  objc_registerClassPair(appDelegateSubClass);
  if (object_setClass(appDelegate, appDelegateSubClass)) {
    GULLogDebug(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling008],
                @"Successfully created App Delegate Proxy automatically. To disable the "
                @"proxy, set the flag %@ to NO (Boolean) in the Info.plist",
                [GULAppDelegateSwizzler correctAppDelegateProxyKey]);
  }

  return appDelegateSubClass;
}

+ (void)proxyRemoteNotificationsMethodsWithAppDelegateSubClass:(Class)appDelegateSubClass
                                                     realClass:(Class)realClass
                                                   appDelegate:(id)appDelegate
                                 realImplementationsBySelector:
                                     (NSMutableDictionary *)realImplementationsBySelector {
  if (realClass == nil || appDelegateSubClass == nil || appDelegate == nil ||
      realImplementationsBySelector == nil) {
    // The App Delegate has not been swizzled.
    return;
  }

  // For application:didRegisterForRemoteNotificationsWithDeviceToken:
  SEL didRegisterForRemoteNotificationsSEL =
      NSSelectorFromString(kGULDidRegisterForRemoteNotificationsSEL);
  SEL didRegisterForRemoteNotificationsDonorSEL = @selector(application:
                 donor_didRegisterForRemoteNotificationsWithDeviceToken:);

  [self proxyDestinationSelector:didRegisterForRemoteNotificationsSEL
      implementationsFromSourceSelector:didRegisterForRemoteNotificationsDonorSEL
                              fromClass:[GULAppDelegateSwizzler class]
                                toClass:appDelegateSubClass
                              realClass:realClass
       storeDestinationImplementationTo:realImplementationsBySelector];

  // For application:didFailToRegisterForRemoteNotificationsWithError:
  SEL didFailToRegisterForRemoteNotificationsSEL =
      NSSelectorFromString(kGULDidFailToRegisterForRemoteNotificationsSEL);
  SEL didFailToRegisterForRemoteNotificationsDonorSEL = @selector(application:
                       donor_didFailToRegisterForRemoteNotificationsWithError:);

  [self proxyDestinationSelector:didFailToRegisterForRemoteNotificationsSEL
      implementationsFromSourceSelector:didFailToRegisterForRemoteNotificationsDonorSEL
                              fromClass:[GULAppDelegateSwizzler class]
                                toClass:appDelegateSubClass
                              realClass:realClass
       storeDestinationImplementationTo:realImplementationsBySelector];

  // For application:didReceiveRemoteNotification:
  SEL didReceiveRemoteNotificationSEL = NSSelectorFromString(kGULDidReceiveRemoteNotificationSEL);
  SEL didReceiveRemoteNotificationDonotSEL = @selector(application:
                                donor_didReceiveRemoteNotification:);

  [self proxyDestinationSelector:didReceiveRemoteNotificationSEL
      implementationsFromSourceSelector:didReceiveRemoteNotificationDonotSEL
                              fromClass:[GULAppDelegateSwizzler class]
                                toClass:appDelegateSubClass
                              realClass:realClass
       storeDestinationImplementationTo:realImplementationsBySelector];

  // For application:didReceiveRemoteNotification:fetchCompletionHandler:
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 70000
  if ([GULAppEnvironmentUtil isIOS7OrHigher]) {
    SEL didReceiveRemoteNotificationWithCompletionSEL =
        NSSelectorFromString(kGULDidReceiveRemoteNotificationWithCompletionSEL);
    SEL didReceiveRemoteNotificationWithCompletionDonorSEL =
        @selector(application:donor_didReceiveRemoteNotification:fetchCompletionHandler:);
    if ([appDelegate respondsToSelector:didReceiveRemoteNotificationWithCompletionSEL]) {
      // Only add the application:didReceiveRemoteNotification:fetchCompletionHandler: method if
      // the original AppDelegate implements it.
      // This fixes a bug if an app only implements application:didReceiveRemoteNotification:
      // (if we add the method with completion, iOS sees that one exists and does not call
      // the method without the completion, which in this case is the only one the app implements).

      [self proxyDestinationSelector:didReceiveRemoteNotificationWithCompletionSEL
          implementationsFromSourceSelector:didReceiveRemoteNotificationWithCompletionDonorSEL
                                  fromClass:[GULAppDelegateSwizzler class]
                                    toClass:appDelegateSubClass
                                  realClass:realClass
           storeDestinationImplementationTo:realImplementationsBySelector];
    }
  }
#endif  // __IPHONE_OS_VERSION_MAX_ALLOWED >= 70000
}

/// We have to do this to invalidate the cache that caches the original respondsToSelector of
/// openURL handlers. Without this, it won't call the default implementations because the system
/// checks and caches them.
/// Register KVO only once. Otherwise, the observing method will be called as many times as
/// being registered.
+ (void)reassignAppDelegate {
  id<UIApplicationDelegate> delegate = [self sharedApplication].delegate;
  [self sharedApplication].delegate = nil;
  [self sharedApplication].delegate = delegate;
  gOriginalAppDelegate = delegate;
  [[GULAppDelegateObserver sharedInstance] observeUIApplication];
}

#pragma mark - Helper methods

+ (GULMutableDictionary *)interceptors {
  static dispatch_once_t onceToken;
  static GULMutableDictionary *sInterceptors;
  dispatch_once(&onceToken, ^{
    sInterceptors = [[GULMutableDictionary alloc] init];
  });
  return sInterceptors;
}

+ (nullable NSValue *)originalImplementationForSelector:(SEL)selector object:(id)object {
  NSDictionary *realImplementationBySelector =
      objc_getAssociatedObject(object, &kGULRealIMPBySelectorKey);
  return realImplementationBySelector[NSStringFromSelector(selector)];
}

+ (void)proxyDestinationSelector:(SEL)destinationSelector
    implementationsFromSourceSelector:(SEL)sourceSelector
                            fromClass:(Class)sourceClass
                              toClass:(Class)destinationClass
                            realClass:(Class)realClass
     storeDestinationImplementationTo:
         (NSMutableDictionary<NSString *, NSValue *> *)destinationImplementationsBySelector {
  [self addInstanceMethodWithDestinationSelector:destinationSelector
            withImplementationFromSourceSelector:sourceSelector
                                       fromClass:sourceClass
                                         toClass:destinationClass];
  IMP sourceImplementation =
      [GULAppDelegateSwizzler implementationOfMethodSelector:destinationSelector
                                                   fromClass:realClass];
  NSValue *sourceImplementationPointer = [NSValue valueWithPointer:sourceImplementation];

  NSString *destinationSelectorString = NSStringFromSelector(destinationSelector);
  destinationImplementationsBySelector[destinationSelectorString] = sourceImplementationPointer;
}

/** Copies a method identified by the methodSelector from one class to the other. After this method
 *  is called, performing [toClassInstance methodSelector] will be similar to calling
 *  [fromClassInstance methodSelector]. This method does nothing if toClass already has a method
 *  identified by methodSelector.
 *
 *  @param methodSelector The SEL that identifies both the method on the fromClass as well as the
 *      one on the toClass.
 *  @param fromClass The class from which a method is sourced.
 *  @param toClass The class to which the method is added. If the class already has a method with
 *      the same selector, this has no effect.
 */
+ (void)addInstanceMethodWithSelector:(SEL)methodSelector
                            fromClass:(Class)fromClass
                              toClass:(Class)toClass {
  [self addInstanceMethodWithDestinationSelector:methodSelector
            withImplementationFromSourceSelector:methodSelector
                                       fromClass:fromClass
                                         toClass:toClass];
}

/** Copies a method identified by the sourceSelector from the fromClass as a method for the
 *  destinationSelector on the toClass. After this method is called, performing
 *  [toClassInstance destinationSelector] will be similar to calling
 *  [fromClassInstance sourceSelector]. This method does nothing if toClass already has a method
 *  identified by destinationSelector.
 *
 *  @param destinationSelector The SEL that identifies the method on the toClass.
 *  @param sourceSelector The SEL that identifies the method on the fromClass.
 *  @param fromClass The class from which a method is sourced.
 *  @param toClass The class to which the method is added. If the class already has a method with
 *      the same selector, this has no effect.
 */
+ (void)addInstanceMethodWithDestinationSelector:(SEL)destinationSelector
            withImplementationFromSourceSelector:(SEL)sourceSelector
                                       fromClass:(Class)fromClass
                                         toClass:(Class)toClass {
  Method method = class_getInstanceMethod(fromClass, sourceSelector);
  IMP methodIMP = method_getImplementation(method);
  const char *types = method_getTypeEncoding(method);
  if (!class_addMethod(toClass, destinationSelector, methodIMP, types)) {
    GULLogWarning(kGULLoggerSwizzler, NO,
                  [NSString stringWithFormat:@"I-SWZ%06ld",
                                             (long)kGULSwizzlerMessageCodeAppDelegateSwizzling009],
                  @"Cannot copy method to destination selector %@ as it already exists",
                  NSStringFromSelector(destinationSelector));
  }
}

/** Gets the IMP of the instance method on the class identified by the selector.
 *
 *  @param selector The selector of which the IMP is to be fetched.
 *  @param aClass The class from which the IMP is to be fetched.
 *  @return The IMP of the instance method identified by selector and aClass.
 */
+ (IMP)implementationOfMethodSelector:(SEL)selector fromClass:(Class)aClass {
  Method aMethod = class_getInstanceMethod(aClass, selector);
  return method_getImplementation(aMethod);
}

/** Enumerates through all the interceptors and if they respond to a given selector, executes a
 *  GULAppDelegateInterceptorCallback with the interceptor.
 *
 *  @param methodSelector The SEL to check if an interceptor responds to.
 *  @param callback the GULAppDelegateInterceptorCallback.
 */
+ (void)notifyInterceptorsWithMethodSelector:(SEL)methodSelector
                                    callback:(GULAppDelegateInterceptorCallback)callback {
  if (!callback) {
    return;
  }

  NSDictionary *interceptors = [GULAppDelegateSwizzler interceptors].dictionary;
  [interceptors enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    GULZeroingWeakContainer *interceptorContainer = obj;
    id interceptor = interceptorContainer.object;
    if (!interceptor) {
      GULLogWarning(
          kGULLoggerSwizzler, NO,
          [NSString
              stringWithFormat:@"I-SWZ%06ld", (long)kGULSwizzlerMessageCodeAppDelegateSwizzling010],
          @"AppDelegateProxy cannot find interceptor with ID %@. Removing the interceptor.", key);
      [[GULAppDelegateSwizzler interceptors] removeObjectForKey:key];
      return;
    }
    if ([interceptor respondsToSelector:methodSelector]) {
      callback(interceptor);
    }
  }];
}

// The methods below are donor methods which are added to the dynamic subclass of the App Delegate.
// They are called within the scope of the real App Delegate so |self| does not refer to the
// GULAppDelegateSwizzler instance but the real App Delegate instance.

#pragma mark - [Donor Methods] Overridden instance description method

- (NSString *)fakeDescription {
  Class realClass = objc_getAssociatedObject(self, &kGULRealClassKey);
  return [NSString stringWithFormat:@"<%@: %p>", realClass, self];
}

#pragma mark - [Donor Methods] URL overridden handler methods

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<NSString *, id> *)options {
  SEL methodSelector = @selector(application:openURL:options:);
  // Call the real implementation if the real App Delegate has any.
  NSValue *openURLIMPPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealOpenURLOptionsIMP openURLOptionsIMP = [openURLIMPPointer pointerValue];

  __block BOOL returnedValue = NO;

// This is needed to for the library to be warning free on iOS versions < 9.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
                                    returnedValue |= [interceptor application:application
                                                                      openURL:url
                                                                      options:options];
                                  }];
#pragma clang diagnostic pop
  if (openURLOptionsIMP) {
    returnedValue |= openURLOptionsIMP(self, methodSelector, application, url, options);
  }
  return returnedValue;
}

#if TARGET_OS_IOS

- (BOOL)application:(UIApplication *)application
              openURL:(NSURL *)url
    sourceApplication:(NSString *)sourceApplication
           annotation:(id)annotation {
  SEL methodSelector = @selector(application:openURL:sourceApplication:annotation:);

  // Call the real implementation if the real App Delegate has any.
  NSValue *openURLSourceAppAnnotationIMPPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealOpenURLSourceApplicationAnnotationIMP openURLSourceApplicationAnnotationIMP =
      [openURLSourceAppAnnotationIMPPointer pointerValue];

  __block BOOL returnedValue = NO;
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
                                    returnedValue |= [interceptor application:application
                                                                      openURL:url
                                                            sourceApplication:sourceApplication
                                                                   annotation:annotation];
#pragma clang diagnostic pop
                                  }];
  if (openURLSourceApplicationAnnotationIMP) {
    returnedValue |= openURLSourceApplicationAnnotationIMP(self, methodSelector, application, url,
                                                           sourceApplication, annotation);
  }
  return returnedValue;
}

#endif  // TARGET_OS_IOS

#pragma mark - [Donor Methods] Network overridden handler methods

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wstrict-prototypes"
- (void)application:(UIApplication *)application
    handleEventsForBackgroundURLSession:(NSString *)identifier
                      completionHandler:(void (^)())completionHandler API_AVAILABLE(ios(7.0)) {
#pragma clang diagnostic pop
  SEL methodSelector = @selector(application:
         handleEventsForBackgroundURLSession:completionHandler:);
  NSValue *handleBackgroundSessionPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealHandleEventsForBackgroundURLSessionIMP handleBackgroundSessionIMP =
      [handleBackgroundSessionPointer pointerValue];

  // Notify interceptors.
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
                                    [interceptor application:application
                                        handleEventsForBackgroundURLSession:identifier
                                                          completionHandler:completionHandler];
                                  }];
  // Call the real implementation if the real App Delegate has any.
  if (handleBackgroundSessionIMP) {
    handleBackgroundSessionIMP(self, methodSelector, application, identifier, completionHandler);
  }
}

#pragma mark - [Donor Methods] User Activities overridden handler methods

// This is needed to for the library to be warning free on iOS versions < 8.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
- (BOOL)application:(UIApplication *)application
    continueUserActivity:(NSUserActivity *)userActivity
      restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler {
  SEL methodSelector = @selector(application:continueUserActivity:restorationHandler:);
  NSValue *continueUserActivityIMPPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealContinueUserActivityIMP continueUserActivityIMP =
      continueUserActivityIMPPointer.pointerValue;

  __block BOOL returnedValue = NO;
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
                                    returnedValue |= [interceptor application:application
                                                         continueUserActivity:userActivity
                                                           restorationHandler:restorationHandler];
                                  }];
  // Call the real implementation if the real App Delegate has any.
  if (continueUserActivityIMP) {
    returnedValue |= continueUserActivityIMP(self, methodSelector, application, userActivity,
                                             restorationHandler);
  }
  return returnedValue;
}
#pragma clang diagnostic pop

#pragma mark - [Donor Methods] Remote Notifications

- (void)application:(UIApplication *)application
    donor_didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  SEL methodSelector = NSSelectorFromString(kGULDidRegisterForRemoteNotificationsSEL);

  NSValue *didRegisterForRemoteNotificationsIMPPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealDidRegisterForRemoteNotificationsIMP didRegisterForRemoteNotificationsIMP =
      [didRegisterForRemoteNotificationsIMPPointer pointerValue];

  // Notify interceptors.
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
                                    NSInvocation *invocation = [GULAppDelegateSwizzler
                                        appDelegateInvocationForSelector:methodSelector];
                                    [invocation setTarget:interceptor];
                                    [invocation setSelector:methodSelector];
                                    [invocation setArgument:(void *)(&application) atIndex:2];
                                    [invocation setArgument:(void *)(&deviceToken) atIndex:3];
                                    [invocation invoke];
                                  }];
  // Call the real implementation if the real App Delegate has any.
  if (didRegisterForRemoteNotificationsIMP) {
    didRegisterForRemoteNotificationsIMP(self, methodSelector, application, deviceToken);
  }
}

- (void)application:(UIApplication *)application
    donor_didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  SEL methodSelector = NSSelectorFromString(kGULDidFailToRegisterForRemoteNotificationsSEL);
  NSValue *didFailToRegisterForRemoteNotificationsIMPPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealDidFailToRegisterForRemoteNotificationsIMP didFailToRegisterForRemoteNotificationsIMP =
      [didFailToRegisterForRemoteNotificationsIMPPointer pointerValue];

  // Notify interceptors.
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
                                    NSInvocation *invocation = [GULAppDelegateSwizzler
                                        appDelegateInvocationForSelector:methodSelector];
                                    [invocation setTarget:interceptor];
                                    [invocation setSelector:methodSelector];
                                    [invocation setArgument:(void *)(&application) atIndex:2];
                                    [invocation setArgument:(void *)(&error) atIndex:3];
                                    [invocation invoke];
                                  }];
  // Call the real implementation if the real App Delegate has any.
  if (didFailToRegisterForRemoteNotificationsIMP) {
    didFailToRegisterForRemoteNotificationsIMP(self, methodSelector, application, error);
  }
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 70000
// This is needed to for the library to be warning free on iOS versions < 7.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
- (void)application:(UIApplication *)application
    donor_didReceiveRemoteNotification:(NSDictionary *)userInfo
                fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  SEL methodSelector = NSSelectorFromString(kGULDidReceiveRemoteNotificationWithCompletionSEL);
  NSValue *didReceiveRemoteNotificationWithCompletionIMPPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealDidReceiveRemoteNotificationWithCompletionIMP
      didReceiveRemoteNotificationWithCompletionIMP =
          [didReceiveRemoteNotificationWithCompletionIMPPointer pointerValue];

  // Notify interceptors.
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
                                    NSInvocation *invocation = [GULAppDelegateSwizzler
                                        appDelegateInvocationForSelector:methodSelector];
                                    [invocation setTarget:interceptor];
                                    [invocation setSelector:methodSelector];
                                    [invocation setArgument:(void *)(&application) atIndex:2];
                                    [invocation setArgument:(void *)(&userInfo) atIndex:3];
                                    [invocation setArgument:(void *)(&completionHandler) atIndex:4];
                                    [invocation invoke];
                                  }];
  // Call the real implementation if the real App Delegate has any.
  if (didReceiveRemoteNotificationWithCompletionIMP) {
    didReceiveRemoteNotificationWithCompletionIMP(self, methodSelector, application, userInfo,
                                                  completionHandler);
  }
}
#pragma clang diagnostic pop
#endif  // __IPHONE_OS_VERSION_MAX_ALLOWED >= 70000

- (void)application:(UIApplication *)application
    donor_didReceiveRemoteNotification:(NSDictionary *)userInfo {
  SEL methodSelector = NSSelectorFromString(kGULDidReceiveRemoteNotificationSEL);
  NSValue *didReceiveRemoteNotificationIMPPointer =
      [GULAppDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
  GULRealDidReceiveRemoteNotificationIMP didReceiveRemoteNotificationIMP =
      [didReceiveRemoteNotificationIMPPointer pointerValue];

  // Notify interceptors.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [GULAppDelegateSwizzler
      notifyInterceptorsWithMethodSelector:methodSelector
                                  callback:^(id<UIApplicationDelegate> interceptor) {
                                    NSInvocation *invocation = [GULAppDelegateSwizzler
                                        appDelegateInvocationForSelector:methodSelector];
                                    [invocation setTarget:interceptor];
                                    [invocation setSelector:methodSelector];
                                    [invocation setArgument:(void *)(&application) atIndex:2];
                                    [invocation setArgument:(void *)(&userInfo) atIndex:3];
                                    [invocation invoke];
                                  }];
#pragma clang diagnostic pop
  // Call the real implementation if the real App Delegate has any.
  if (didReceiveRemoteNotificationIMP) {
    didReceiveRemoteNotificationIMP(self, methodSelector, application, userInfo);
  }
}

+ (nullable NSInvocation *)appDelegateInvocationForSelector:(SEL)selector {
  struct objc_method_description methodDescription =
      protocol_getMethodDescription(@protocol(UIApplicationDelegate), selector, NO, YES);
  if (methodDescription.types == NULL) {
    return nil;
  }

  NSMethodSignature *signature = [NSMethodSignature signatureWithObjCTypes:methodDescription.types];
  return [NSInvocation invocationWithMethodSignature:signature];
}

+ (void)proxyAppDelegate:(id<UIApplicationDelegate>)appDelegate {
  if (![appDelegate conformsToProtocol:@protocol(UIApplicationDelegate)]) {
    GULLogNotice(
        kGULLoggerSwizzler, NO,
        [NSString
            stringWithFormat:@"I-SWZ%06ld",
                             (long)kGULSwizzlerMessageCodeAppDelegateSwizzlingInvalidAppDelegate],
        @"App Delegate does not conform to UIApplicationDelegate protocol. %@",
        [GULAppDelegateSwizzler correctAlternativeWhenAppDelegateProxyNotCreated]);
    return;
  }

  id<UIApplicationDelegate> originalDelegate = appDelegate;
  // Do not create a subclass if it is not enabled.
  if (![GULAppDelegateSwizzler isAppDelegateProxyEnabled]) {
    GULLogNotice(kGULLoggerSwizzler, NO,
                 [NSString stringWithFormat:@"I-SWZ%06ld",
                                            (long)kGULSwizzlerMessageCodeAppDelegateSwizzling011],
                 @"App Delegate Proxy is disabled. %@",
                 [GULAppDelegateSwizzler correctAlternativeWhenAppDelegateProxyNotCreated]);
    return;
  }
  // Do not accept nil delegate.
  if (!originalDelegate) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling012],
                @"Cannot create App Delegate Proxy because App Delegate instance is nil. %@",
                [GULAppDelegateSwizzler correctAlternativeWhenAppDelegateProxyNotCreated]);
    return;
  }

  @try {
    gOriginalAppDelegateClass = [originalDelegate class];
    gAppDelegateSubclass = [self createSubclassWithObject:originalDelegate];
    [self reassignAppDelegate];
  } @catch (NSException *exception) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling013],
                @"Cannot create App Delegate Proxy. %@",
                [GULAppDelegateSwizzler correctAlternativeWhenAppDelegateProxyNotCreated]);
    return;
  }
}

#pragma mark - Methods to print correct debug logs

+ (NSString *)correctAppDelegateProxyKey {
  return NSClassFromString(@"FIRCore") ? kGULFirebaseAppDelegateProxyEnabledPlistKey
                                       : kGULGoogleUtilitiesAppDelegateProxyEnabledPlistKey;
}

+ (NSString *)correctAlternativeWhenAppDelegateProxyNotCreated {
  return NSClassFromString(@"FIRCore")
             ? @"To log deep link campaigns manually, call the methods in "
               @"FIRAnalytics+AppDelegate.h."
             : @"";
}

#pragma mark - Private Methods for Testing

#ifdef GUL_APP_DELEGATE_TESTING

+ (void)clearInterceptors {
  [[self interceptors] removeAllObjects];
}

+ (void)resetProxyOriginalDelegateOnceToken {
  sProxyAppDelegateOnceToken = 0;
  sProxyAppDelegateRemoteNotificationOnceToken = 0;
}

+ (id<UIApplicationDelegate>)originalDelegate {
  return gOriginalAppDelegate;
}

#endif  // GUL_APP_DELEGATE_TESTING

@end

#endif  // TARGET_OS_IOS || TARGET_OS_TV
