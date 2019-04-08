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

#if TARGET_OS_IOS

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

typedef void (^GULAppDelegateInterceptorCallback)(id<UIApplicationDelegate>);

// The strings below are the keys for associated objects.
static char const *const kGULContinueUserActivityIMPKey = "GUL_continueUserActivityIMP";
static char const *const kGULHandleBackgroundSessionIMPKey = "GUL_handleBackgroundSessionIMP";
static char const *const kGULOpenURLOptionsIMPKey = "GUL_openURLOptionsIMP";
static char const *const kGULOpenURLOptionsSourceAnnotationsIMPKey =
    "GUL_openURLSourceApplicationAnnotationIMP";
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
  dispatch_once(&sProxyAppDelegateOnceToken, ^{
    id<UIApplicationDelegate> originalDelegate =
        [GULAppDelegateSwizzler sharedApplication].delegate;
    [GULAppDelegateSwizzler proxyAppDelegate:originalDelegate];
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
 *  @param anObject The object to which you want to isa swizzle. This has to conform to the
 *      UIApplicationDelegate subclass.
 */
+ (void)createSubclassWithObject:(id<UIApplicationDelegate>)anObject {
  Class realClass = [anObject class];

  // Create GUL_<RealAppDelegate>_<timestampMs>
  NSString *classNameWithPrefix =
      [kGULAppDelegatePrefix stringByAppendingString:NSStringFromClass(realClass)];
  NSTimeInterval timestamp = [NSDate date].timeIntervalSince1970;
  NSString *newClassName =
      [NSString stringWithFormat:@"%@-%0.0f", classNameWithPrefix, timestamp * 1000];

  if (NSClassFromString(newClassName)) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling005],
                @"Cannot create a proxy for App Delegate. Subclass already exists. Original Class: "
                @"%@, subclass: %@",
                NSStringFromClass(realClass), newClassName);
    return;
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
    return;
  }

  // Add the following methods from GULAppDelegate class, and store the real implementation so it
  // can forward to the real one.
  // For application:openURL:options:
  NSValue *openURLOptionsIMPPointer;
  SEL applicationOpenURLOptionsSEL = @selector(application:openURL:options:);
  if ([anObject respondsToSelector:applicationOpenURLOptionsSEL]) {
    // Only add the application:openURL:options: method if the original AppDelegate implements it.
    // This fixes a bug if an app only implements application:openURL:sourceApplication:annotation:
    // (if we add the `options` method, iOS sees that one exists and does not call the
    // `sourceApplication` method, which in this case is the only one the app implements).

    [GULAppDelegateSwizzler addInstanceMethodWithSelector:applicationOpenURLOptionsSEL
                                                fromClass:[GULAppDelegateSwizzler class]
                                                  toClass:appDelegateSubClass];
    GULRealOpenURLOptionsIMP openURLOptionsIMP = (GULRealOpenURLOptionsIMP)
        [GULAppDelegateSwizzler implementationOfMethodSelector:applicationOpenURLOptionsSEL
                                                     fromClass:realClass];
    openURLOptionsIMPPointer = [NSValue valueWithPointer:openURLOptionsIMP];
  }

  // For application:continueUserActivity:restorationHandler:
  SEL continueUserActivitySEL = @selector(application:continueUserActivity:restorationHandler:);
  [GULAppDelegateSwizzler addInstanceMethodWithSelector:continueUserActivitySEL
                                              fromClass:[GULAppDelegateSwizzler class]
                                                toClass:appDelegateSubClass];
  GULRealContinueUserActivityIMP continueUserActivityIMP = (GULRealContinueUserActivityIMP)
      [GULAppDelegateSwizzler implementationOfMethodSelector:continueUserActivitySEL
                                                   fromClass:realClass];
  NSValue *continueUserActivityIMPPointer = [NSValue valueWithPointer:continueUserActivityIMP];

  // For application:openURL:sourceApplication:annotation:
  SEL openURLSourceApplicationAnnotationSEL = @selector(application:
                                                            openURL:sourceApplication:annotation:);
  [GULAppDelegateSwizzler addInstanceMethodWithSelector:openURLSourceApplicationAnnotationSEL
                                              fromClass:[GULAppDelegateSwizzler class]
                                                toClass:appDelegateSubClass];
  GULRealOpenURLSourceApplicationAnnotationIMP openURLSourceApplicationAnnotationIMP =
      (GULRealOpenURLSourceApplicationAnnotationIMP)[GULAppDelegateSwizzler
          implementationOfMethodSelector:openURLSourceApplicationAnnotationSEL
                               fromClass:realClass];
  NSValue *openURLSourceAppAnnotationIMPPointer =
      [NSValue valueWithPointer:openURLSourceApplicationAnnotationIMP];

  // For application:handleEventsForBackgroundURLSession:completionHandler:
  SEL handleEventsForBackgroundURLSessionSEL = @selector(application:
                                 handleEventsForBackgroundURLSession:completionHandler:);
  [GULAppDelegateSwizzler addInstanceMethodWithSelector:handleEventsForBackgroundURLSessionSEL
                                              fromClass:[GULAppDelegateSwizzler class]
                                                toClass:appDelegateSubClass];
  GULRealHandleEventsForBackgroundURLSessionIMP handleBackgroundSessionIMP =
      (GULRealHandleEventsForBackgroundURLSessionIMP)[GULAppDelegateSwizzler
          implementationOfMethodSelector:handleEventsForBackgroundURLSessionSEL
                               fromClass:realClass];
  NSValue *handleBackgroundSessionIMPPointer =
      [NSValue valueWithPointer:handleBackgroundSessionIMP];

  // Override the description too so the custom class name will not show up.
  [GULAppDelegateSwizzler addInstanceMethodWithDestinationSelector:@selector(description)
                              withImplementationFromSourceSelector:@selector(fakeDescription)
                                                         fromClass:[self class]
                                                           toClass:appDelegateSubClass];

  // Create fake properties for the real app delegate object.
  objc_setAssociatedObject(anObject, &kGULContinueUserActivityIMPKey,
                           continueUserActivityIMPPointer, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  objc_setAssociatedObject(anObject, &kGULHandleBackgroundSessionIMPKey,
                           handleBackgroundSessionIMPPointer, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  if (openURLOptionsIMPPointer) {
    objc_setAssociatedObject(anObject, &kGULOpenURLOptionsIMPKey, openURLOptionsIMPPointer,
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  objc_setAssociatedObject(anObject, &kGULOpenURLOptionsSourceAnnotationsIMPKey,
                           openURLSourceAppAnnotationIMPPointer, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  objc_setAssociatedObject(anObject, &kGULRealClassKey, realClass,
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
    return;
  }

  // Make the newly created class to be the subclass of the real App Delegate class.
  objc_registerClassPair(appDelegateSubClass);
  if (object_setClass(anObject, appDelegateSubClass)) {
    GULLogDebug(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeAppDelegateSwizzling008],
                @"Successfully created App Delegate Proxy automatically. To disable the "
                @"proxy, set the flag %@ to NO (Boolean) in the Info.plist",
                [GULAppDelegateSwizzler correctAppDelegateProxyKey]);
  }

  // We have to do this to invalidate the cache that caches the original respondsToSelector of
  // openURL handlers. Without this, it won't call the default implementations because the system
  // checks and caches them.
  // Register KVO only once. Otherwise, the observing method will be called as many times as
  // being registered.
  id<UIApplicationDelegate> delegate = [GULAppDelegateSwizzler sharedApplication].delegate;
  [GULAppDelegateSwizzler sharedApplication].delegate = nil;
  [GULAppDelegateSwizzler sharedApplication].delegate = delegate;
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
  // Call the real implementation if the real App Delegate has any.
  NSValue *openURLIMPPointer = objc_getAssociatedObject(self, &kGULOpenURLOptionsIMPKey);
  GULRealOpenURLOptionsIMP openURLOptionsIMP = [openURLIMPPointer pointerValue];

  __block BOOL returnedValue = NO;
  SEL methodSelector = @selector(application:openURL:options:);

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

- (BOOL)application:(UIApplication *)application
              openURL:(NSURL *)url
    sourceApplication:(NSString *)sourceApplication
           annotation:(id)annotation {
  // Call the real implementation if the real App Delegate has any.
  NSValue *openURLSourceAppAnnotationIMPPointer =
      objc_getAssociatedObject(self, &kGULOpenURLOptionsSourceAnnotationsIMPKey);
  GULRealOpenURLSourceApplicationAnnotationIMP openURLSourceApplicationAnnotationIMP =
      [openURLSourceAppAnnotationIMPPointer pointerValue];

  __block BOOL returnedValue = NO;
  SEL methodSelector = @selector(application:openURL:sourceApplication:annotation:);
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

#pragma mark - [Donor Methods] Network overridden handler methods

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wstrict-prototypes"
- (void)application:(UIApplication *)application
    handleEventsForBackgroundURLSession:(NSString *)identifier
                      completionHandler:(void (^)())completionHandler API_AVAILABLE(ios(7.0)) {
#pragma clang diagnostic pop
  NSValue *handleBackgroundSessionPointer =
      objc_getAssociatedObject(self, &kGULHandleBackgroundSessionIMPKey);
  GULRealHandleEventsForBackgroundURLSessionIMP handleBackgroundSessionIMP =
      [handleBackgroundSessionPointer pointerValue];

  // Notify interceptors.
  SEL methodSelector = @selector(application:
         handleEventsForBackgroundURLSession:completionHandler:);
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
  NSValue *continueUserActivityIMPPointer =
      objc_getAssociatedObject(self, &kGULContinueUserActivityIMPKey);
  GULRealContinueUserActivityIMP continueUserActivityIMP =
      continueUserActivityIMPPointer.pointerValue;

  __block BOOL returnedValue = NO;
  SEL methodSelector = @selector(application:continueUserActivity:restorationHandler:);
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

+ (void)proxyAppDelegate:(id<UIApplicationDelegate>)appDelegate {
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
    [self createSubclassWithObject:originalDelegate];
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
}

+ (id<UIApplicationDelegate>)originalDelegate {
  return gOriginalAppDelegate;
}

#endif  // GUL_APP_DELEGATE_TESTING

@end

#endif  // TARGET_OS_IOS
