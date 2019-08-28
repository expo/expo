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

#import "GDTLibrary/Private/GDTUploadCoordinator.h"

#import <GoogleDataTransport/GDTClock.h>
#import <GoogleDataTransport/GDTConsoleLogger.h>

#import "GDTLibrary/Private/GDTAssert.h"
#import "GDTLibrary/Private/GDTReachability.h"
#import "GDTLibrary/Private/GDTRegistrar_Private.h"
#import "GDTLibrary/Private/GDTStorage.h"

@implementation GDTUploadCoordinator

+ (instancetype)sharedInstance {
  static GDTUploadCoordinator *sharedUploader;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedUploader = [[GDTUploadCoordinator alloc] init];
    [sharedUploader startTimer];
  });
  return sharedUploader;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _coordinationQueue =
        dispatch_queue_create("com.google.GDTUploadCoordinator", DISPATCH_QUEUE_SERIAL);
    _registrar = [GDTRegistrar sharedInstance];
    _timerInterval = 30 * NSEC_PER_SEC;
    _timerLeeway = 5 * NSEC_PER_SEC;
    _targetToInFlightPackages = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)forceUploadForTarget:(GDTTarget)target {
  dispatch_async(_coordinationQueue, ^{
    GDTUploadConditions conditions = [self uploadConditions];
    conditions |= GDTUploadConditionHighPriority;
    [self uploadTargets:@[ @(target) ] conditions:conditions];
  });
}

#pragma mark - Property overrides

// GDTStorage and GDTUploadCoordinator +sharedInstance methods call each other, so this breaks
// the loop.
- (GDTStorage *)storage {
  if (!_storage) {
    _storage = [GDTStorage sharedInstance];
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
      if (!self->_runningInBackground) {
        GDTUploadConditions conditions = [self uploadConditions];
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
- (void)uploadTargets:(NSArray<NSNumber *> *)targets conditions:(GDTUploadConditions)conditions {
  dispatch_async(_coordinationQueue, ^{
    if ((conditions & GDTUploadConditionNoNetwork) == GDTUploadConditionNoNetwork) {
      return;
    }
    for (NSNumber *target in targets) {
      // Don't trigger uploads for targets that have an in-flight package already.
      if (self->_targetToInFlightPackages[target]) {
        continue;
      }
      // Ask the uploader if they can upload and do so, if it can.
      id<GDTUploader> uploader = self.registrar.targetToUploader[target];
      if ([uploader readyToUploadWithConditions:conditions]) {
        id<GDTPrioritizer> prioritizer = self.registrar.targetToPrioritizer[target];
        GDTUploadPackage *package = [prioritizer uploadPackageWithConditions:conditions];
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
- (GDTUploadConditions)uploadConditions {
  SCNetworkReachabilityFlags currentFlags = [GDTReachability currentFlags];
  BOOL reachable =
      (currentFlags & kSCNetworkReachabilityFlagsReachable) == kSCNetworkReachabilityFlagsReachable;
  BOOL connectionRequired = (currentFlags & kSCNetworkReachabilityFlagsConnectionRequired) ==
                            kSCNetworkReachabilityFlagsConnectionRequired;
  BOOL networkConnected = reachable && !connectionRequired;

  if (!networkConnected) {
    return GDTUploadConditionNoNetwork;
  }

  BOOL isWWAN = GDTReachabilityFlagsContainWWAN(currentFlags);
  if (isWWAN) {
    return GDTUploadConditionMobileData;
  } else {
    return GDTUploadConditionWifiData;
  }
}

#pragma mark - NSSecureCoding support

/** The NSKeyedCoder key for the targetToInFlightPackages property. */
static NSString *const ktargetToInFlightPackagesKey =
    @"GDTUploadCoordinatortargetToInFlightPackages";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  GDTUploadCoordinator *sharedCoordinator = [GDTUploadCoordinator sharedInstance];
  sharedCoordinator->_targetToInFlightPackages =
      [aDecoder decodeObjectOfClass:[NSMutableDictionary class]
                             forKey:ktargetToInFlightPackagesKey];
  return sharedCoordinator;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  // All packages that have been given to uploaders need to be tracked so that their expiration
  // timers can be called.
  [aCoder encodeObject:_targetToInFlightPackages forKey:ktargetToInFlightPackagesKey];
}

#pragma mark - GDTLifecycleProtocol

- (void)appWillForeground:(GDTApplication *)app {
  // Not entirely thread-safe, but it should be fine.
  self->_runningInBackground = NO;
  [self startTimer];
}

- (void)appWillBackground:(GDTApplication *)app {
  // Not entirely thread-safe, but it should be fine.
  self->_runningInBackground = YES;

  // Should be thread-safe. If it ends up not being, put this in a dispatch_sync.
  [self stopTimer];

  // Create an immediate background task to run until the end of the current queue of work.
  __block GDTBackgroundIdentifier bgID = [app beginBackgroundTaskWithExpirationHandler:^{
    [app endBackgroundTask:bgID];
  }];
  dispatch_async(_coordinationQueue, ^{
    [app endBackgroundTask:bgID];
  });
}

- (void)appWillTerminate:(GDTApplication *)application {
  dispatch_sync(_coordinationQueue, ^{
    [self stopTimer];
  });
}

#pragma mark - GDTUploadPackageProtocol

- (void)packageDelivered:(GDTUploadPackage *)package successful:(BOOL)successful {
  if (!_coordinationQueue) {
    return;
  }
  dispatch_async(_coordinationQueue, ^{
    NSNumber *targetNumber = @(package.target);
    NSMutableDictionary<NSNumber *, GDTUploadPackage *> *targetToInFlightPackages =
        self->_targetToInFlightPackages;
    GDTRegistrar *registrar = self->_registrar;
    if (targetToInFlightPackages) {
      [targetToInFlightPackages removeObjectForKey:targetNumber];
    }
    if (registrar) {
      id<GDTPrioritizer> prioritizer = registrar.targetToPrioritizer[targetNumber];
      if (!prioritizer) {
        GDTLogError(GDTMCEPrioritizerError,
                    @"A prioritizer should be registered for this target: %@", targetNumber);
      }
      if ([prioritizer respondsToSelector:@selector(packageDelivered:successful:)]) {
        [prioritizer packageDelivered:package successful:successful];
      }
    }
    [self.storage removeEvents:package.events];
  });
}

- (void)packageExpired:(GDTUploadPackage *)package {
  if (!_coordinationQueue) {
    return;
  }
  dispatch_async(_coordinationQueue, ^{
    NSNumber *targetNumber = @(package.target);
    NSMutableDictionary<NSNumber *, GDTUploadPackage *> *targetToInFlightPackages =
        self->_targetToInFlightPackages;
    GDTRegistrar *registrar = self->_registrar;
    if (targetToInFlightPackages) {
      [targetToInFlightPackages removeObjectForKey:targetNumber];
    }
    if (registrar) {
      id<GDTPrioritizer> prioritizer = registrar.targetToPrioritizer[targetNumber];
      id<GDTUploader> uploader = registrar.targetToUploader[targetNumber];
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
