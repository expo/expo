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

#import <GoogleDataTransport/GDTCORUploadPackage.h>

#import <GoogleDataTransport/GDTCORClock.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCORStoredEvent.h>

#import "GDTCORLibrary/Private/GDTCORStorage_Private.h"
#import "GDTCORLibrary/Private/GDTCORUploadCoordinator.h"
#import "GDTCORLibrary/Private/GDTCORUploadPackage_Private.h"

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
    _storage = [GDTCORStorage sharedInstance];
    _deliverByTime = [GDTCORClock clockSnapshotInTheFuture:180000];
    _handler = [GDTCORUploadCoordinator sharedInstance];
    _expirationTimer = [NSTimer scheduledTimerWithTimeInterval:5.0
                                                        target:self
                                                      selector:@selector(checkIfPackageIsExpired:)
                                                      userInfo:nil
                                                       repeats:YES];
  }
  return self;
}

- (instancetype)copy {
  GDTCORUploadPackage *newPackage = [[GDTCORUploadPackage alloc] initWithTarget:_target];
  newPackage->_events = [_events copy];
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

- (void)setStorage:(GDTCORStorage *)storage {
  if (storage != _storage) {
    _storage = storage;
  }
}

- (void)completeDelivery {
  if (_isDelivered) {
    GDTCORLogError(GDTCORMCEDeliverTwice, @"%@",
                   @"It's an API violation to call -completeDelivery twice.");
  }
  _isDelivered = YES;
  if (!_isHandled && _handler &&
      [_handler respondsToSelector:@selector(packageDelivered:successful:)]) {
    [_expirationTimer invalidate];
    _isHandled = YES;
    [_handler packageDelivered:self successful:YES];
  }
}

- (void)retryDeliveryInTheFuture {
  if (!_isHandled && _handler &&
      [_handler respondsToSelector:@selector(packageDelivered:successful:)]) {
    [_expirationTimer invalidate];
    _isHandled = YES;
    [_handler packageDelivered:self successful:NO];
  }
}

- (void)checkIfPackageIsExpired:(NSTimer *)timer {
  if ([[GDTCORClock snapshot] isAfter:_deliverByTime]) {
    if (_handler && [_handler respondsToSelector:@selector(packageExpired:)]) {
      _isHandled = YES;
      [_expirationTimer invalidate];
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
  GDTCORTarget target = [aDecoder decodeIntegerForKey:kTargetKey];
  self = [self initWithTarget:target];
  if (self) {
    NSSet *classes = [NSSet setWithObjects:[NSSet class], [GDTCORStoredEvent class], nil];
    _events = [aDecoder decodeObjectOfClasses:classes forKey:kEventsKey];
    _deliverByTime = [aDecoder decodeObjectOfClass:[GDTCORClock class] forKey:kDeliverByTimeKey];
    _isHandled = [aDecoder decodeBoolForKey:kIsHandledKey];
    // _handler isn't technically NSSecureCoding, because we don't know the class of this object.
    // but it gets decoded anyway.
  }
  return self;
}

@end
