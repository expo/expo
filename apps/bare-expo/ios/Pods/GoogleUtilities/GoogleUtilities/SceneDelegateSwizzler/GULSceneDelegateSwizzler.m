// Copyright 2019 Google LLC
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

#import <GoogleUtilities/GULAppDelegateSwizzler.h>
#import <GoogleUtilities/GULAppEnvironmentUtil.h>
#import <GoogleUtilities/GULLogger.h>
#import <GoogleUtilities/GULMutableDictionary.h>
#import <GoogleUtilities/GULSceneDelegateSwizzler.h>
#import "GoogleUtilities/Common/GULLoggerCodes.h"
#import "GoogleUtilities/SceneDelegateSwizzler/Internal/GULSceneDelegateSwizzler_Private.h"

#import <objc/runtime.h>

#if UISCENE_SUPPORTED
API_AVAILABLE(ios(13.0), tvos(13.0))
typedef void (*GULOpenURLContextsIMP)(id, SEL, UIScene *, NSSet<UIOpenURLContext *> *);

API_AVAILABLE(ios(13.0), tvos(13.0))
typedef void (^GULSceneDelegateInterceptorCallback)(id<UISceneDelegate>);

// The strings below are the keys for associated objects.
static char const *const kGULRealIMPBySelectorKey = "GUL_realIMPBySelector";
static char const *const kGULRealClassKey = "GUL_realClass";
#endif  // UISCENE_SUPPORTED

static GULLoggerService kGULLoggerSwizzler = @"[GoogleUtilities/SceneDelegateSwizzler]";

// Since Firebase SDKs also use this for app delegate proxying, in order to not be a breaking change
// we disable App Delegate proxying when either of these two flags are set to NO.

/** Plist key that allows Firebase developers to disable App and Scene Delegate Proxying. */
static NSString *const kGULFirebaseSceneDelegateProxyEnabledPlistKey =
    @"FirebaseAppDelegateProxyEnabled";

/** Plist key that allows developers not using Firebase to disable App and Scene Delegate Proxying.
 */
static NSString *const kGULGoogleUtilitiesSceneDelegateProxyEnabledPlistKey =
    @"GoogleUtilitiesAppDelegateProxyEnabled";

/** The prefix of the Scene Delegate. */
static NSString *const kGULSceneDelegatePrefix = @"GUL_";

/**
 * This class is necessary to store the delegates in an NSArray without retaining them.
 * [NSValue valueWithNonRetainedObject] also provides this functionality, but does not provide a
 * zeroing pointer. This will cause EXC_BAD_ACCESS when trying to access the object after it is
 * dealloced. Instead, this container stores a weak, zeroing reference to the object, which
 * automatically is set to nil by the runtime when the object is dealloced.
 */
@interface GULSceneZeroingWeakContainer : NSObject

/** Stores a weak object. */
@property(nonatomic, weak) id object;

@end

@implementation GULSceneZeroingWeakContainer
@end

@implementation GULSceneDelegateSwizzler

#pragma mark - Public methods

+ (BOOL)isSceneDelegateProxyEnabled {
  return [GULAppDelegateSwizzler isAppDelegateProxyEnabled];
}

+ (void)proxyOriginalSceneDelegate {
#if UISCENE_SUPPORTED
  if ([GULAppEnvironmentUtil isAppExtension]) {
    return;
  }

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if (@available(iOS 13.0, tvOS 13.0, *)) {
      if (![GULSceneDelegateSwizzler isSceneDelegateProxyEnabled]) {
        return;
      }
      [[NSNotificationCenter defaultCenter]
          addObserver:self
             selector:@selector(handleSceneWillConnectToNotification:)
                 name:UISceneWillConnectNotification
               object:nil];
    }
  });
#endif  // UISCENE_SUPPORTED
}

#if UISCENE_SUPPORTED
+ (GULSceneDelegateInterceptorID)registerSceneDelegateInterceptor:(id<UISceneDelegate>)interceptor {
  NSAssert(interceptor, @"SceneDelegateProxy cannot add nil interceptor");
  NSAssert([interceptor conformsToProtocol:@protocol(UISceneDelegate)],
           @"SceneDelegateProxy interceptor does not conform to UIApplicationDelegate");

  if (!interceptor) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeSceneDelegateSwizzling000],
                @"SceneDelegateProxy cannot add nil interceptor.");
    return nil;
  }
  if (![interceptor conformsToProtocol:@protocol(UISceneDelegate)]) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeSceneDelegateSwizzling001],
                @"SceneDelegateProxy interceptor does not conform to UIApplicationDelegate");
    return nil;
  }

  // The ID should be the same given the same interceptor object.
  NSString *interceptorID =
      [NSString stringWithFormat:@"%@%p", kGULSceneDelegatePrefix, interceptor];
  if (!interceptorID.length) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeSceneDelegateSwizzling002],
                @"SceneDelegateProxy cannot create Interceptor ID.");
    return nil;
  }
  GULSceneZeroingWeakContainer *weakObject = [[GULSceneZeroingWeakContainer alloc] init];
  weakObject.object = interceptor;
  [GULSceneDelegateSwizzler interceptors][interceptorID] = weakObject;
  return interceptorID;
}

+ (void)unregisterSceneDelegateInterceptorWithID:(GULSceneDelegateInterceptorID)interceptorID {
  NSAssert(interceptorID, @"SceneDelegateProxy cannot unregister nil interceptor ID.");
  NSAssert(((NSString *)interceptorID).length != 0,
           @"SceneDelegateProxy cannot unregister empty interceptor ID.");

  if (!interceptorID) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeSceneDelegateSwizzling003],
                @"SceneDelegateProxy cannot unregister empty interceptor ID.");
    return;
  }

  GULSceneZeroingWeakContainer *weakContainer =
      [GULSceneDelegateSwizzler interceptors][interceptorID];
  if (!weakContainer.object) {
    GULLogError(kGULLoggerSwizzler, NO,
                [NSString stringWithFormat:@"I-SWZ%06ld",
                                           (long)kGULSwizzlerMessageCodeSceneDelegateSwizzling004],
                @"SceneDelegateProxy cannot unregister interceptor that was not registered. "
                 "Interceptor ID %@",
                interceptorID);
    return;
  }

  [[GULSceneDelegateSwizzler interceptors] removeObjectForKey:interceptorID];
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

+ (void)clearInterceptors {
  [[self interceptors] removeAllObjects];
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
      [GULSceneDelegateSwizzler implementationOfMethodSelector:destinationSelector
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
    GULLogWarning(
        kGULLoggerSwizzler, NO,
        [NSString
            stringWithFormat:@"I-SWZ%06ld", (long)kGULSwizzlerMessageCodeSceneDelegateSwizzling009],
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
 *  GULSceneDelegateInterceptorCallback with the interceptor.
 *
 *  @param methodSelector The SEL to check if an interceptor responds to.
 *  @param callback the GULSceneDelegateInterceptorCallback.
 */
+ (void)notifyInterceptorsWithMethodSelector:(SEL)methodSelector
                                    callback:(GULSceneDelegateInterceptorCallback)callback
    API_AVAILABLE(ios(13.0)) {
  if (!callback) {
    return;
  }

  NSDictionary *interceptors = [GULSceneDelegateSwizzler interceptors].dictionary;
  [interceptors enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    GULSceneZeroingWeakContainer *interceptorContainer = obj;
    id interceptor = interceptorContainer.object;
    if (!interceptor) {
      GULLogWarning(
          kGULLoggerSwizzler, NO,
          [NSString stringWithFormat:@"I-SWZ%06ld",
                                     (long)kGULSwizzlerMessageCodeSceneDelegateSwizzling010],
          @"SceneDelegateProxy cannot find interceptor with ID %@. Removing the interceptor.", key);
      [[GULSceneDelegateSwizzler interceptors] removeObjectForKey:key];
      return;
    }
    if ([interceptor respondsToSelector:methodSelector]) {
      callback(interceptor);
    }
  }];
}

+ (void)handleSceneWillConnectToNotification:(NSNotification *)notification {
  if (@available(iOS 13.0, tvOS 13.0, *)) {
    if ([notification.object isKindOfClass:[UIScene class]]) {
      UIScene *scene = (UIScene *)notification.object;
      [GULSceneDelegateSwizzler proxySceneDelegateIfNeeded:scene];
    }
  }
}

#pragma mark - [Donor Methods] UISceneDelegate URL handler

- (void)scene:(UIScene *)scene
    openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts API_AVAILABLE(ios(13.0), tvos(13.0)) {
  if (@available(iOS 13.0, tvOS 13.0, *)) {
    SEL methodSelector = @selector(scene:openURLContexts:);
    // Call the real implementation if the real Scene Delegate has any.
    NSValue *openURLContextsIMPPointer =
        [GULSceneDelegateSwizzler originalImplementationForSelector:methodSelector object:self];
    GULOpenURLContextsIMP openURLContextsIMP = [openURLContextsIMPPointer pointerValue];

    [GULSceneDelegateSwizzler
        notifyInterceptorsWithMethodSelector:methodSelector
                                    callback:^(id<UISceneDelegate> interceptor) {
                                      if ([interceptor
                                              conformsToProtocol:@protocol(UISceneDelegate)]) {
                                        id<UISceneDelegate> sceneInterceptor =
                                            (id<UISceneDelegate>)interceptor;
                                        [sceneInterceptor scene:scene openURLContexts:URLContexts];
                                      }
                                    }];

    if (openURLContextsIMP) {
      openURLContextsIMP(self, methodSelector, scene, URLContexts);
    }
  }
}

+ (void)proxySceneDelegateIfNeeded:(UIScene *)scene {
  Class realClass = [scene.delegate class];
  NSString *className = NSStringFromClass(realClass);

  // Skip proxying if failed to get the delegate class name for some reason (e.g. `delegate == nil`)
  // or the class has a prefix of kGULAppDelegatePrefix, which means it has been proxied before.
  if (className == nil || [className hasPrefix:kGULSceneDelegatePrefix]) {
    return;
  }

  NSString *classNameWithPrefix = [kGULSceneDelegatePrefix stringByAppendingString:className];
  NSString *newClassName =
      [NSString stringWithFormat:@"%@-%@", classNameWithPrefix, [NSUUID UUID].UUIDString];

  if (NSClassFromString(newClassName)) {
    GULLogError(
        kGULLoggerSwizzler, NO,
        [NSString
            stringWithFormat:@"I-SWZ%06ld",
                             (long)
                                 kGULSwizzlerMessageCodeSceneDelegateSwizzlingInvalidSceneDelegate],
        @"Cannot create a proxy for Scene Delegate. Subclass already exists. Original Class"
        @": %@, subclass: %@",
        className, newClassName);
    return;
  }

  // Register the new class as subclass of the real one. Do not allocate more than the real class
  // size.
  Class sceneDelegateSubClass = objc_allocateClassPair(realClass, newClassName.UTF8String, 0);
  if (sceneDelegateSubClass == Nil) {
    GULLogError(
        kGULLoggerSwizzler, NO,
        [NSString
            stringWithFormat:@"I-SWZ%06ld",
                             (long)
                                 kGULSwizzlerMessageCodeSceneDelegateSwizzlingInvalidSceneDelegate],
        @"Cannot create a proxy for Scene Delegate. Subclass already exists. Original Class"
        @": %@, subclass: Nil",
        className);
    return;
  }

  NSMutableDictionary<NSString *, NSValue *> *realImplementationsBySelector =
      [[NSMutableDictionary alloc] init];

  // For scene:openURLContexts:
  SEL openURLContextsSEL = @selector(scene:openURLContexts:);
  [self proxyDestinationSelector:openURLContextsSEL
      implementationsFromSourceSelector:openURLContextsSEL
                              fromClass:[GULSceneDelegateSwizzler class]
                                toClass:sceneDelegateSubClass
                              realClass:realClass
       storeDestinationImplementationTo:realImplementationsBySelector];

  // Store original implementations to a fake property of the original delegate.
  objc_setAssociatedObject(scene.delegate, &kGULRealIMPBySelectorKey,
                           [realImplementationsBySelector copy], OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  objc_setAssociatedObject(scene.delegate, &kGULRealClassKey, realClass,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  // The subclass size has to be exactly the same size with the original class size. The subclass
  // cannot have more ivars/properties than its superclass since it will cause an offset in memory
  // that can lead to overwriting the isa of an object in the next frame.
  if (class_getInstanceSize(realClass) != class_getInstanceSize(sceneDelegateSubClass)) {
    GULLogError(
        kGULLoggerSwizzler, NO,
        [NSString
            stringWithFormat:@"I-SWZ%06ld",
                             (long)
                                 kGULSwizzlerMessageCodeSceneDelegateSwizzlingInvalidSceneDelegate],
        @"Cannot create subclass of Scene Delegate, because the created subclass is not the "
        @"same size. %@",
        className);
    NSAssert(NO, @"Classes must be the same size to swizzle isa");
    return;
  }

  // Make the newly created class to be the subclass of the real Scene Delegate class.
  objc_registerClassPair(sceneDelegateSubClass);
  if (object_setClass(scene.delegate, sceneDelegateSubClass)) {
    GULLogDebug(
        kGULLoggerSwizzler, NO,
        [NSString
            stringWithFormat:@"I-SWZ%06ld",
                             (long)
                                 kGULSwizzlerMessageCodeSceneDelegateSwizzlingInvalidSceneDelegate],
        @"Successfully created Scene Delegate Proxy automatically. To disable the "
        @"proxy, set the flag %@ to NO (Boolean) in the Info.plist",
        [GULSceneDelegateSwizzler correctSceneDelegateProxyKey]);
  }
}

+ (NSString *)correctSceneDelegateProxyKey {
  return NSClassFromString(@"FIRCore") ? kGULFirebaseSceneDelegateProxyEnabledPlistKey
                                       : kGULGoogleUtilitiesSceneDelegateProxyEnabledPlistKey;
}

#endif  // UISCENE_SUPPORTED

@end
