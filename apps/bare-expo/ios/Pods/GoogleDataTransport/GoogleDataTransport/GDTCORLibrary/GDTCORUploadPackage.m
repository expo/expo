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

#import "GDTCORLibrary/Public/GDTCORUploadPackage.h"

#import <GoogleDataTransport/GDTCORClock.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>

#import "GDTCORLibrary/Private/GDTCORRegistrar_Private.h"
#import "GDTCORLibrary/Private/GDTCORUploadCoordinator.h"
#import "GDTCORLibrary/Private/GDTCORUploadPackage_Private.h"

/** A class that holds a weak reference to an upload package, for use by the package's NSTimer. */
@interface GDTCORUploadPackageTimerHolder : NSObject

/** The upload package. */
@property(weak, nonatomic) GDTCORUploadPackage *package;

@end

@implementation GDTCORUploadPackageTimerHolder

/** Calls checkIfPackageIsExpired on the package if non-nil. Invalidates if the package is nil.
 *
 * @param timer The timer instance calling this method.
 */
- (void)timerFired:(NSTimer *)timer {
  if (_package) {
    [_package checkIfPackageIsExpired];
  } else {
    [timer invalidate];
  }
}

@end

@implementation GDTCORUploadPackage {
  /** If YES, the package's -completeDelivery method has been called. */
  BOOL _isDelivered;

  /** If YES, is being handled by the handler. */
  BOOL _isHandled;

  /** A timer that will regularly check to see whether this package has expired or not. */
  NSTimer *_expirationTimer;
}

- (instancetype)initWithTarget:(GDTCORTarget)target {
  self = [super init];
  if (self) {
    _target = target;
    _storage = [GDTCORRegistrar sharedInstance].targetToStorage[@(target)];
    _deliverByTime = [GDTCORClock clockSnapshotInTheFuture:180000];
    _handler = [GDTCORUploadCoordinator sharedInstance];
    GDTCORUploadPackageTimerHolder *holder = [[GDTCORUploadPackageTimerHolder alloc] init];
    holder.package = self;
    _expirationTimer = [NSTimer scheduledTimerWithTimeInterval:5.0
                                                        target:holder
                                                      selector:@selector(timerFired:)
                                                      userInfo:nil
                                                       repeats:YES];
  }
  GDTCORLogDebug(@"Upload package created %@", self);
  return self;
}

- (instancetype)copy {
  GDTCORUploadPackage *newPackage = [[GDTCORUploadPackage alloc] init];
  newPackage->_target = _target;
  newPackage->_storage = _storage;
  newPackage->_deliverByTime = _deliverByTime;
  newPackage->_handler = _handler;
  GDTCORUploadPackageTimerHolder *holder = [[GDTCORUploadPackageTimerHolder alloc] init];
  holder.package = newPackage;
  newPackage->_expirationTimer = [NSTimer scheduledTimerWithTimeInterval:5.0
                                                                  target:holder
                                                                selector:@selector(timerFired:)
                                                                userInfo:nil
                                                                 repeats:YES];
  newPackage->_events = [_events copy];
  GDTCORLogDebug(@"Copying UploadPackage %@ to %@", self, newPackage);
  return newPackage;
}

- (NSUInteger)hash {
  return [_events hash];
}

- (BOOL)isEqual:(id)object {
  return [self hash] == [object hash];
}

- (void)dealloc {
  [_expirationTimer invalidate];
}

- (void)completeDelivery {
  if (_isDelivered) {
    GDTCORLogError(GDTCORMCEDeliverTwice, @"%@",
                   @"It's an API violation to call -completeDelivery twice.");
  }
  _isDelivered = YES;
  [_expirationTimer invalidate];
  if (!_isHandled && _handler &&
      [_handler respondsToSelector:@selector(packageDelivered:successful:)]) {
    _isHandled = YES;
    [_handler packageDelivered:[self copy] successful:YES];
  }
  GDTCORLogDebug(@"Upload package delivered: %@", self);
}

- (void)retryDeliveryInTheFuture {
  [_expirationTimer invalidate];
  if (!_isHandled && _handler &&
      [_handler respondsToSelector:@selector(packageDelivered:successful:)]) {
    _isHandled = YES;
    [_handler packageDelivered:[self copy] successful:NO];
  }
  GDTCORLogDebug(@"Upload package will retry in the future: %@", self);
}

- (void)checkIfPackageIsExpired {
  if ([[GDTCORClock snapshot] isAfter:_deliverByTime]) {
    [_expirationTimer invalidate];
    if (_handler && [_handler respondsToSelector:@selector(packageExpired:)]) {
      _isHandled = YES;
      GDTCORLogDebug(@"Upload package expired: %@", self);
      [_handler packageExpired:self];
    }
  }
}

#pragma mark - NSSecureCoding

/** The keyed archiver key for the events property. */
static NSString *const kEventsKey = @"GDTCORUploadPackageEventsKey";

/** The keyed archiver key for the _isHandled property. */
static NSString *const kDeliverByTimeKey = @"GDTCORUploadPackageDeliveryByTimeKey";

/** The keyed archiver key for the _isHandled ivar. */
static NSString *const kIsHandledKey = @"GDTCORUploadPackageIsHandledKey";

/** The keyed archiver key for the handler property. */
static NSString *const kHandlerKey = @"GDTCORUploadPackageHandlerKey";

/** The keyed archiver key for the target property. */
static NSString *const kTargetKey = @"GDTCORUploadPackageTargetKey";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (void)encodeWithCoder:(nonnull NSCoder *)aCoder {
  [aCoder encodeObject:_events forKey:kEventsKey];
  [aCoder encodeObject:_deliverByTime forKey:kDeliverByTimeKey];
  [aCoder encodeBool:_isHandled forKey:kIsHandledKey];
  [aCoder encodeObject:_handler forKey:kHandlerKey];
  [aCoder encodeInteger:_target forKey:kTargetKey];
}

- (nullable instancetype)initWithCoder:(nonnull NSCoder *)aDecoder {
  // Sets a global translation mapping to decode GDTCORStoredEvent objects encoded as instances of
  // GDTCOREvent instead.
  [NSKeyedUnarchiver setClass:[GDTCOREvent class] forClassName:@"GDTCORStoredEvent"];

  GDTCORTarget target = [aDecoder decodeIntegerForKey:kTargetKey];
  self = [self initWithTarget:target];
  if (self) {
    NSSet *classes = [NSSet setWithObjects:[NSSet class], [GDTCOREvent class], nil];
    _events = [aDecoder decodeObjectOfClasses:classes forKey:kEventsKey];
    _deliverByTime = [aDecoder decodeObjectOfClass:[GDTCORClock class] forKey:kDeliverByTimeKey];
    _isHandled = [aDecoder decodeBoolForKey:kIsHandledKey];
    // _handler isn't technically NSSecureCoding, because we don't know the class of this object.
    // but it gets decoded anyway.
  }
  return self;
}

@end
