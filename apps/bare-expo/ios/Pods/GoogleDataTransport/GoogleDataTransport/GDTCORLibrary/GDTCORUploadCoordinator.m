/*
 * Copyright 2018 Google
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

#import "GDTCORLibrary/Private/GDTCORUploadCoordinator.h"

#import <GoogleDataTransport/GDTCORAssert.h>
#import <GoogleDataTransport/GDTCORClock.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>

#import "GDTCORLibrary/Private/GDTCORReachability.h"
#import "GDTCORLibrary/Private/GDTCORRegistrar_Private.h"
#import "GDTCORLibrary/Private/GDTCORStorage.h"

@implementation GDTCORUploadCoordinator

+ (instancetype)sharedInstance {
  static GDTCORUploadCoordinator *sharedUploader;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedUploader = [[GDTCORUploadCoordinator alloc] init];
    [sharedUploader startTimer];
  });
  return sharedUploader;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _coordinationQueue =
        dispatch_queue_create("com.google.GDTCORUploadCoordinator", DISPATCH_QUEUE_SERIAL);
    _registrar = [GDTCORRegistrar sharedInstance];
    _timerInterval = 30 * NSEC_PER_SEC;
    _timerLeeway = 5 * NSEC_PER_SEC;
    _targetToInFlightPackages = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)forceUploadForTarget:(GDTCORTarget)target {
  dispatch_async(_coordinationQueue, ^{
    GDTCORUploadConditions conditions = [self uploadConditions];
    conditions |= GDTCORUploadConditionHighPriority;
    [self uploadTargets:@[ @(target) ] conditions:conditions];
  });
}

#pragma mark - Property overrides

// GDTCORStorage and GDTCORUploadCoordinator +sharedInstance methods call each other, so this breaks
// the loop.
- (GDTCORStorage *)storage {
  if (!_storage) {
    _storage = [GDTCORStorage sharedInstance];
  }
  return _storage;
}

#pragma mark - Private helper methods

/** Starts a timer that checks whether or not events can be uploaded at regular intervals. It will
 * check the next-upload clocks of all targets to determine if an upload attempt can be made.
 */
- (void)startTimer {
  dispatch_sync(_coordinationQueue, ^{
    self->_timer =
        dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, self->_coordinationQueue);
    dispatch_source_set_timer(self->_timer, DISPATCH_TIME_NOW, self->_timerInterval,
                              self->_timerLeeway);
    dispatch_source_set_event_handler(self->_timer, ^{
      if (![[GDTCORApplication sharedApplication] isRunningInBackground]) {
        GDTCORUploadConditions conditions = [self uploadConditions];
        [self uploadTargets:[self.registrar.targetToUploader allKeys] conditions:conditions];
      }
    });
    dispatch_resume(self->_timer);
  });
}

/** Stops the currently running timer. */
- (void)stopTimer {
  if (_timer) {
    dispatch_source_cancel(_timer);
  }
}

/** Triggers the uploader implementations for the given targets to upload.
 *
 * @param targets An array of targets to trigger.
 * @param conditions The set of upload conditions.
 */
- (void)uploadTargets:(NSArray<NSNumber *> *)targets conditions:(GDTCORUploadConditions)conditions {
  dispatch_async(_coordinationQueue, ^{
    if ((conditions & GDTCORUploadConditionNoNetwork) == GDTCORUploadConditionNoNetwork) {
      return;
    }
    for (NSNumber *target in targets) {
      // Don't trigger uploads for targets that have an in-flight package already.
      if (self->_targetToInFlightPackages[target]) {
        continue;
      }
      // Ask the uploader if they can upload and do so, if it can.
      id<GDTCORUploader> uploader = self.registrar.targetToUploader[target];
      if ([uploader readyToUploadWithConditions:conditions]) {
        id<GDTCORPrioritizer> prioritizer = self.registrar.targetToPrioritizer[target];
        GDTCORUploadPackage *package = [prioritizer uploadPackageWithConditions:conditions];
        if (package.events.count) {
          self->_targetToInFlightPackages[target] = package;
          [uploader uploadPackage:package];
        } else {
          [package completeDelivery];
        }
      }
    }
  });
}

/** Returns the current upload conditions after making determinations about the network connection.
 *
 * @return The current upload conditions.
 */
- (GDTCORUploadConditions)uploadConditions {
  SCNetworkReachabilityFlags currentFlags = [GDTCORReachability currentFlags];
  BOOL reachable =
      (currentFlags & kSCNetworkReachabilityFlagsReachable) == kSCNetworkReachabilityFlagsReachable;
  BOOL connectionRequired = (currentFlags & kSCNetworkReachabilityFlagsConnectionRequired) ==
                            kSCNetworkReachabilityFlagsConnectionRequired;
  BOOL networkConnected = reachable && !connectionRequired;

  if (!networkConnected) {
    return GDTCORUploadConditionNoNetwork;
  }

  BOOL isWWAN = GDTCORReachabilityFlagsContainWWAN(currentFlags);
  if (isWWAN) {
    return GDTCORUploadConditionMobileData;
  } else {
    return GDTCORUploadConditionWifiData;
  }
}

#pragma mark - NSSecureCoding support

/** The NSKeyedCoder key for the targetToInFlightPackages property. */
static NSString *const ktargetToInFlightPackagesKey =
    @"GDTCORUploadCoordinatortargetToInFlightPackages";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  GDTCORUploadCoordinator *sharedCoordinator = [GDTCORUploadCoordinator sharedInstance];
  dispatch_sync(sharedCoordinator->_coordinationQueue, ^{
    @try {
      sharedCoordinator->_targetToInFlightPackages =
          [aDecoder decodeObjectOfClass:[NSMutableDictionary class]
                                 forKey:ktargetToInFlightPackagesKey];

    } @catch (NSException *exception) {
      sharedCoordinator->_targetToInFlightPackages = [NSMutableDictionary dictionary];
    }
  });
  return sharedCoordinator;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  dispatch_sync(_coordinationQueue, ^{
    // All packages that have been given to uploaders need to be tracked so that their expiration
    // timers can be called.
    if (self->_targetToInFlightPackages.count > 0) {
      [aCoder encodeObject:self->_targetToInFlightPackages forKey:ktargetToInFlightPackagesKey];
    }
  });
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillForeground:(GDTCORApplication *)app {
  // Not entirely thread-safe, but it should be fine.
  [self startTimer];
}

- (void)appWillBackground:(GDTCORApplication *)app {
  // Should be thread-safe. If it ends up not being, put this in a dispatch_sync.
  [self stopTimer];
}

- (void)appWillTerminate:(GDTCORApplication *)application {
  dispatch_sync(_coordinationQueue, ^{
    [self stopTimer];
  });
}

#pragma mark - GDTCORUploadPackageProtocol

- (void)packageDelivered:(GDTCORUploadPackage *)package successful:(BOOL)successful {
  if (!_coordinationQueue) {
    return;
  }
  dispatch_async(_coordinationQueue, ^{
    NSNumber *targetNumber = @(package.target);
    NSMutableDictionary<NSNumber *, GDTCORUploadPackage *> *targetToInFlightPackages =
        self->_targetToInFlightPackages;
    GDTCORRegistrar *registrar = self->_registrar;
    if (targetToInFlightPackages) {
      [targetToInFlightPackages removeObjectForKey:targetNumber];
    }
    if (registrar) {
      id<GDTCORPrioritizer> prioritizer = registrar.targetToPrioritizer[targetNumber];
      if (!prioritizer) {
        GDTCORLogError(GDTCORMCEPrioritizerError,
                       @"A prioritizer should be registered for this target: %@", targetNumber);
      }
      if ([prioritizer respondsToSelector:@selector(packageDelivered:successful:)]) {
        [prioritizer packageDelivered:package successful:successful];
      }
    }
    if (package.events != nil) {
      [self.storage removeEvents:package.events];
    }
  });
}

- (void)packageExpired:(GDTCORUploadPackage *)package {
  if (!_coordinationQueue) {
    return;
  }
  dispatch_async(_coordinationQueue, ^{
    NSNumber *targetNumber = @(package.target);
    NSMutableDictionary<NSNumber *, GDTCORUploadPackage *> *targetToInFlightPackages =
        self->_targetToInFlightPackages;
    GDTCORRegistrar *registrar = self->_registrar;
    if (targetToInFlightPackages) {
      [targetToInFlightPackages removeObjectForKey:targetNumber];
    }
    if (registrar) {
      id<GDTCORPrioritizer> prioritizer = registrar.targetToPrioritizer[targetNumber];
      id<GDTCORUploader> uploader = registrar.targetToUploader[targetNumber];
      if ([prioritizer respondsToSelector:@selector(packageExpired:)]) {
        [prioritizer packageExpired:package];
      }
      if ([uploader respondsToSelector:@selector(packageExpired:)]) {
        [uploader packageExpired:package];
      }
    }
  });
}

@end
