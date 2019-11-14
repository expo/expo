/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <GoogleDataTransport/GDTCORPlatform.h>

#import <GoogleDataTransport/GDTCORAssert.h>

const GDTCORBackgroundIdentifier GDTCORBackgroundIdentifierInvalid = 0;

NSString *const kGDTCORApplicationDidEnterBackgroundNotification =
    @"GDTCORApplicationDidEnterBackgroundNotification";

NSString *const kGDTCORApplicationWillEnterForegroundNotification =
    @"GDTCORApplicationWillEnterForegroundNotification";

NSString *const kGDTCORApplicationWillTerminateNotification =
    @"GDTCORApplicationWillTerminateNotification";

BOOL GDTCORReachabilityFlagsContainWWAN(SCNetworkReachabilityFlags flags) {
#if TARGET_OS_IOS
  return (flags & kSCNetworkReachabilityFlagsIsWWAN) == kSCNetworkReachabilityFlagsIsWWAN;
#else
  return NO;
#endif  // TARGET_OS_IOS
}

@implementation GDTCORApplication

+ (void)load {
#if TARGET_OS_IOS || TARGET_OS_TV
  // If this asserts, please file a bug at https://github.com/firebase/firebase-ios-sdk/issues.
  GDTCORFatalAssert(
      GDTCORBackgroundIdentifierInvalid == UIBackgroundTaskInvalid,
      @"GDTCORBackgroundIdentifierInvalid and UIBackgroundTaskInvalid should be the same.");
#endif
  [self sharedApplication];
}

+ (nullable GDTCORApplication *)sharedApplication {
  static GDTCORApplication *application;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    application = [[GDTCORApplication alloc] init];
  });
  return application;
}

- (instancetype)init {
  self = [super init];
  if (self) {
#if TARGET_OS_IOS || TARGET_OS_TV
    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter addObserver:self
                           selector:@selector(iOSApplicationDidEnterBackground:)
                               name:UIApplicationDidEnterBackgroundNotification
                             object:nil];
    [notificationCenter addObserver:self
                           selector:@selector(iOSApplicationWillEnterForeground:)
                               name:UIApplicationWillEnterForegroundNotification
                             object:nil];

    NSString *name = UIApplicationWillTerminateNotification;
    [notificationCenter addObserver:self
                           selector:@selector(iOSApplicationWillTerminate:)
                               name:name
                             object:nil];

#if defined(__IPHONE_13_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    if (@available(iOS 13, tvOS 13.0, *)) {
      [notificationCenter addObserver:self
                             selector:@selector(iOSApplicationWillEnterForeground:)
                                 name:UISceneWillEnterForegroundNotification
                               object:nil];
      [notificationCenter addObserver:self
                             selector:@selector(iOSApplicationDidEnterBackground:)
                                 name:UISceneWillDeactivateNotification
                               object:nil];
    }
#endif  // defined(__IPHONE_13_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000

#elif TARGET_OS_OSX
    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter addObserver:self
                           selector:@selector(macOSApplicationWillTerminate:)
                               name:NSApplicationWillTerminateNotification
                             object:nil];
#endif  // TARGET_OS_IOS || TARGET_OS_TV
  }
  return self;
}

- (GDTCORBackgroundIdentifier)beginBackgroundTaskWithExpirationHandler:(void (^)(void))handler {
  return
      [[self sharedApplicationForBackgroundTask] beginBackgroundTaskWithExpirationHandler:handler];
}

- (void)endBackgroundTask:(GDTCORBackgroundIdentifier)bgID {
  if (bgID != GDTCORBackgroundIdentifierInvalid) {
    [[self sharedApplicationForBackgroundTask] endBackgroundTask:bgID];
  }
}

#pragma mark - App environment helpers

- (BOOL)isAppExtension {
#if TARGET_OS_IOS || TARGET_OS_TV
  BOOL appExtension = [[[NSBundle mainBundle] bundlePath] hasSuffix:@".appex"];
  return appExtension;
#elif TARGET_OS_OSX
  return NO;
#endif
}

/** Returns a UIApplication instance if on the appropriate platform.
 *
 * @return The shared UIApplication if on the appropriate platform.
 */
#if TARGET_OS_IOS || TARGET_OS_TV
- (nullable UIApplication *)sharedApplicationForBackgroundTask {
#else
- (nullable id)sharedApplicationForBackgroundTask {
#endif
  if ([self isAppExtension]) {
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

#pragma mark - UIApplicationDelegate

#if TARGET_OS_IOS || TARGET_OS_TV
- (void)iOSApplicationDidEnterBackground:(NSNotification *)notif {
  NSNotificationCenter *notifCenter = [NSNotificationCenter defaultCenter];
  [notifCenter postNotificationName:kGDTCORApplicationDidEnterBackgroundNotification object:nil];
}

- (void)iOSApplicationWillEnterForeground:(NSNotification *)notif {
  NSNotificationCenter *notifCenter = [NSNotificationCenter defaultCenter];
  [notifCenter postNotificationName:kGDTCORApplicationWillEnterForegroundNotification object:nil];
}

- (void)iOSApplicationWillTerminate:(NSNotification *)notif {
  NSNotificationCenter *notifCenter = [NSNotificationCenter defaultCenter];
  [notifCenter postNotificationName:kGDTCORApplicationWillTerminateNotification object:nil];
}
#endif  // TARGET_OS_IOS || TARGET_OS_TV

#pragma mark - NSApplicationDelegate

#if TARGET_OS_OSX
- (void)macOSApplicationWillTerminate:(NSNotification *)notif {
  NSNotificationCenter *notifCenter = [NSNotificationCenter defaultCenter];
  [notifCenter postNotificationName:kGDTCORApplicationWillTerminateNotification object:nil];
}
#endif  // TARGET_OS_OSX

@end
