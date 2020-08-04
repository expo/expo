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

#import "GDTCORLibrary/Public/GDTCORLifecycle.h"

#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCOREvent.h>

#import "GDTCORLibrary/Private/GDTCORRegistrar_Private.h"
#import "GDTCORLibrary/Private/GDTCORTransformer_Private.h"
#import "GDTCORLibrary/Private/GDTCORUploadCoordinator.h"

@implementation GDTCORLifecycle

+ (void)load {
  [self sharedInstance];
}

/** Creates/returns the singleton instance of this class.
 *
 * @return The singleton instance of this class.
 */
+ (instancetype)sharedInstance {
  static GDTCORLifecycle *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTCORLifecycle alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter addObserver:self
                           selector:@selector(applicationDidEnterBackground:)
                               name:kGDTCORApplicationDidEnterBackgroundNotification
                             object:nil];
    [notificationCenter addObserver:self
                           selector:@selector(applicationWillEnterForeground:)
                               name:kGDTCORApplicationWillEnterForegroundNotification
                             object:nil];

    NSString *name = kGDTCORApplicationWillTerminateNotification;
    [notificationCenter addObserver:self
                           selector:@selector(applicationWillTerminate:)
                               name:name
                             object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)applicationDidEnterBackground:(NSNotification *)notification {
  GDTCORApplication *application = [GDTCORApplication sharedApplication];
  if ([[GDTCORTransformer sharedInstance] respondsToSelector:@selector(appWillBackground:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORTransformer that the app is backgrounding.");
    [[GDTCORTransformer sharedInstance] appWillBackground:application];
  }
  if ([[GDTCORUploadCoordinator sharedInstance] respondsToSelector:@selector(appWillBackground:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORUploadCoordinator that the app is backgrounding.");
    [[GDTCORUploadCoordinator sharedInstance] appWillBackground:application];
  }
  if ([[GDTCORRegistrar sharedInstance] respondsToSelector:@selector(appWillBackground:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORRegistrar that the app is backgrounding.");
    [[GDTCORRegistrar sharedInstance] appWillBackground:application];
  }
}

- (void)applicationWillEnterForeground:(NSNotification *)notification {
  GDTCORApplication *application = [GDTCORApplication sharedApplication];
  if ([[GDTCORTransformer sharedInstance] respondsToSelector:@selector(appWillForeground:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORTransformer that the app is foregrounding.");
    [[GDTCORTransformer sharedInstance] appWillForeground:application];
  }
  if ([[GDTCORUploadCoordinator sharedInstance] respondsToSelector:@selector(appWillForeground:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORUploadCoordinator that the app is foregrounding.");
    [[GDTCORUploadCoordinator sharedInstance] appWillForeground:application];
  }
  if ([[GDTCORRegistrar sharedInstance] respondsToSelector:@selector(appWillForeground:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORRegistrar that the app is foregrounding.");
    [[GDTCORRegistrar sharedInstance] appWillForeground:application];
  }
}

- (void)applicationWillTerminate:(NSNotification *)notification {
  GDTCORApplication *application = [GDTCORApplication sharedApplication];
  if ([[GDTCORTransformer sharedInstance] respondsToSelector:@selector(appWillTerminate:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORTransformer that the app is terminating.");
    [[GDTCORTransformer sharedInstance] appWillTerminate:application];
  }
  if ([[GDTCORUploadCoordinator sharedInstance] respondsToSelector:@selector(appWillTerminate:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORUploadCoordinator that the app is terminating.");
    [[GDTCORUploadCoordinator sharedInstance] appWillTerminate:application];
  }
  if ([[GDTCORRegistrar sharedInstance] respondsToSelector:@selector(appWillTerminate:)]) {
    GDTCORLogDebug(@"%@", @"Signaling GDTCORRegistrar that the app is terminating.");
    [[GDTCORRegistrar sharedInstance] appWillTerminate:application];
  }
}

@end
