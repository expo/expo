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

#import "GDTLibrary/Public/GDTLifecycle.h"

#import <GoogleDataTransport/GDTEvent.h>

#import "GDTLibrary/Private/GDTRegistrar_Private.h"
#import "GDTLibrary/Private/GDTStorage_Private.h"
#import "GDTLibrary/Private/GDTTransformer_Private.h"
#import "GDTLibrary/Private/GDTUploadCoordinator.h"

@implementation GDTLifecycle

+ (void)load {
  [self sharedInstance];
}

/** Creates/returns the singleton instance of this class.
 *
 * @return The singleton instance of this class.
 */
+ (instancetype)sharedInstance {
  static GDTLifecycle *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTLifecycle alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];
    [notificationCenter addObserver:self
                           selector:@selector(applicationDidEnterBackground:)
                               name:kGDTApplicationDidEnterBackgroundNotification
                             object:nil];
    [notificationCenter addObserver:self
                           selector:@selector(applicationWillEnterForeground:)
                               name:kGDTApplicationWillEnterForegroundNotification
                             object:nil];

    NSString *name = kGDTApplicationWillTerminateNotification;
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
  GDTApplication *application = [GDTApplication sharedApplication];
  if ([[GDTTransformer sharedInstance] respondsToSelector:@selector(appWillBackground:)]) {
    [[GDTTransformer sharedInstance] appWillBackground:application];
  }
  if ([[GDTStorage sharedInstance] respondsToSelector:@selector(appWillBackground:)]) {
    [[GDTStorage sharedInstance] appWillBackground:application];
  }
  if ([[GDTUploadCoordinator sharedInstance] respondsToSelector:@selector(appWillBackground:)]) {
    [[GDTUploadCoordinator sharedInstance] appWillBackground:application];
  }
  if ([[GDTRegistrar sharedInstance] respondsToSelector:@selector(appWillBackground:)]) {
    [[GDTRegistrar sharedInstance] appWillBackground:application];
  }
}

- (void)applicationWillEnterForeground:(NSNotification *)notification {
  GDTApplication *application = [GDTApplication sharedApplication];
  if ([[GDTTransformer sharedInstance] respondsToSelector:@selector(appWillForeground:)]) {
    [[GDTTransformer sharedInstance] appWillForeground:application];
  }
  if ([[GDTStorage sharedInstance] respondsToSelector:@selector(appWillForeground:)]) {
    [[GDTStorage sharedInstance] appWillForeground:application];
  }
  if ([[GDTUploadCoordinator sharedInstance] respondsToSelector:@selector(appWillForeground:)]) {
    [[GDTUploadCoordinator sharedInstance] appWillForeground:application];
  }
  if ([[GDTRegistrar sharedInstance] respondsToSelector:@selector(appWillForeground:)]) {
    [[GDTRegistrar sharedInstance] appWillForeground:application];
  }
}

- (void)applicationWillTerminate:(NSNotification *)notification {
  GDTApplication *application = [GDTApplication sharedApplication];
  if ([[GDTTransformer sharedInstance] respondsToSelector:@selector(appWillTerminate:)]) {
    [[GDTTransformer sharedInstance] appWillTerminate:application];
  }
  if ([[GDTStorage sharedInstance] respondsToSelector:@selector(appWillTerminate:)]) {
    [[GDTStorage sharedInstance] appWillTerminate:application];
  }
  if ([[GDTUploadCoordinator sharedInstance] respondsToSelector:@selector(appWillTerminate:)]) {
    [[GDTUploadCoordinator sharedInstance] appWillTerminate:application];
  }
  if ([[GDTRegistrar sharedInstance] respondsToSelector:@selector(appWillTerminate:)]) {
    [[GDTRegistrar sharedInstance] appWillTerminate:application];
  }
}

@end
