/**
 Copyright 2018 Google Inc. All rights reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at:

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

#import "FBLPromisePrivate.h"

/** All states a promise can be in. */
typedef NS_ENUM(NSInteger, FBLPromiseState) {
  FBLPromiseStatePending = 0,
  FBLPromiseStateFulfilled,
  FBLPromiseStateRejected,
};

typedef void (^FBLPromiseObserver)(FBLPromiseState state, id __nullable resolution);

static dispatch_queue_t gFBLPromiseDefaultDispatchQueue;

@implementation FBLPromise {
  /** Current state of the promise. */
  FBLPromiseState _state;
  /**
   Set of arbitrary objects to keep strongly while the promise is pending.
   Becomes nil after the promise has been resolved.
   */
  NSMutableSet *__nullable _pendingObjects;
  /**
   Value to fulfill the promise with.
   Can be nil if the promise is still pending, was resolved with nil or after it has been rejected.
   */
  id __nullable _value;
  /**
   Error to reject the promise with.
   Can be nil if the promise is still pending or after it has been fulfilled.
   */
  NSError *__nullable _error;
  /** List of observers to notify when the promise gets resolved. */
  NSMutableArray<FBLPromiseObserver> *_observers;
}

+ (void)initialize {
  if (self == [FBLPromise class]) {
    gFBLPromiseDefaultDispatchQueue = dispatch_get_main_queue();
  }
}

+ (dispatch_queue_t)defaultDispatchQueue {
  @synchronized(self) {
    return gFBLPromiseDefaultDispatchQueue;
  }
}

+ (void)setDefaultDispatchQueue:(dispatch_queue_t)queue {
  NSParameterAssert(queue);

  @synchronized(self) {
    gFBLPromiseDefaultDispatchQueue = queue;
  }
}

+ (instancetype)pendingPromise {
  return [[self alloc] initPending];
}

+ (instancetype)resolvedWith:(nullable id)resolution {
  return [[self alloc] initWithResolution:resolution];
}

- (void)fulfill:(nullable id)value {
  if ([value isKindOfClass:[NSError class]]) {
    [self reject:(NSError *)value];
  } else {
    @synchronized(self) {
      if (_state == FBLPromiseStatePending) {
        _state = FBLPromiseStateFulfilled;
        _value = value;
        _pendingObjects = nil;
        for (FBLPromiseObserver observer in _observers) {
          observer(_state, _value);
        }
        _observers = nil;
        dispatch_group_leave(FBLPromise.dispatchGroup);
      }
    }
  }
}

- (void)reject:(NSError *)error {
  NSAssert([error isKindOfClass:[NSError class]], @"Invalid error type.");

  if (![error isKindOfClass:[NSError class]]) {
    // Give up on invalid error type in Release mode.
    @throw error;  // NOLINT
  }
  @synchronized(self) {
    if (_state == FBLPromiseStatePending) {
      _state = FBLPromiseStateRejected;
      _error = error;
      _pendingObjects = nil;
      for (FBLPromiseObserver observer in _observers) {
        observer(_state, _error);
      }
      _observers = nil;
      dispatch_group_leave(FBLPromise.dispatchGroup);
    }
  }
}

#pragma mark - NSObject

- (NSString *)description {
  if (self.isFulfilled) {
    return [NSString stringWithFormat:@"<%@ %p> Fulfilled: %@", NSStringFromClass([self class]),
                                      self, self.value];
  }
  if (self.isRejected) {
    return [NSString stringWithFormat:@"<%@ %p> Rejected: %@", NSStringFromClass([self class]),
                                      self, self.error];
  }
  return [NSString stringWithFormat:@"<%@ %p> Pending", NSStringFromClass([self class]), self];
}

#pragma mark - Private

- (instancetype)initPending {
  self = [super init];
  if (self) {
    dispatch_group_enter(FBLPromise.dispatchGroup);
  }
  return self;
}

- (instancetype)initWithResolution:(nullable id)resolution {
  self = [super init];
  if (self) {
    if ([resolution isKindOfClass:[NSError class]]) {
      _state = FBLPromiseStateRejected;
      _error = (NSError *)resolution;
    } else {
      _state = FBLPromiseStateFulfilled;
      _value = resolution;
    }
  }
  return self;
}

- (void)dealloc {
  if (_state == FBLPromiseStatePending) {
    dispatch_group_leave(FBLPromise.dispatchGroup);
  }
}

- (BOOL)isPending {
  @synchronized(self) {
    return _state == FBLPromiseStatePending;
  }
}

- (BOOL)isFulfilled {
  @synchronized(self) {
    return _state == FBLPromiseStateFulfilled;
  }
}

- (BOOL)isRejected {
  @synchronized(self) {
    return _state == FBLPromiseStateRejected;
  }
}

- (nullable id)value {
  @synchronized(self) {
    return _value;
  }
}

- (NSError *__nullable)error {
  @synchronized(self) {
    return _error;
  }
}

- (NSMutableSet *__nullable)pendingObjects {
  @synchronized(self) {
    if (_state == FBLPromiseStatePending) {
      if (!_pendingObjects) {
        _pendingObjects = [[NSMutableSet alloc] init];
      }
    }
    return _pendingObjects;
  }
}

- (void)observeOnQueue:(dispatch_queue_t)queue
               fulfill:(FBLPromiseOnFulfillBlock)onFulfill
                reject:(FBLPromiseOnRejectBlock)onReject {
  NSParameterAssert(queue);
  NSParameterAssert(onFulfill);
  NSParameterAssert(onReject);

  @synchronized(self) {
    switch (_state) {
      case FBLPromiseStatePending: {
        if (!_observers) {
          _observers = [[NSMutableArray alloc] init];
        }
        [_observers addObject:^(FBLPromiseState state, id __nullable resolution) {
          dispatch_group_async(FBLPromise.dispatchGroup, queue, ^{
            switch (state) {
              case FBLPromiseStatePending:
                break;
              case FBLPromiseStateFulfilled:
                onFulfill(resolution);
                break;
              case FBLPromiseStateRejected:
                onReject(resolution);
                break;
            }
          });
        }];
        break;
      }
      case FBLPromiseStateFulfilled: {
        dispatch_group_async(FBLPromise.dispatchGroup, queue, ^{
          onFulfill(self->_value);
        });
        break;
      }
      case FBLPromiseStateRejected: {
        dispatch_group_async(FBLPromise.dispatchGroup, queue, ^{
          onReject(self->_error);
        });
        break;
      }
    }
  }
}

- (FBLPromise *)chainOnQueue:(dispatch_queue_t)queue
              chainedFulfill:(FBLPromiseChainedFulfillBlock)chainedFulfill
               chainedReject:(FBLPromiseChainedRejectBlock)chainedReject {
  NSParameterAssert(queue);

  FBLPromise *promise = [[FBLPromise alloc] initPending];
  __auto_type resolver = ^(id __nullable value) {
    if ([value isKindOfClass:[FBLPromise class]]) {
      [(FBLPromise *)value observeOnQueue:queue
          fulfill:^(id __nullable value) {
            [promise fulfill:value];
          }
          reject:^(NSError *error) {
            [promise reject:error];
          }];
    } else {
      [promise fulfill:value];
    }
  };
  [self observeOnQueue:queue
      fulfill:^(id __nullable value) {
        value = chainedFulfill ? chainedFulfill(value) : value;
        resolver(value);
      }
      reject:^(NSError *error) {
        id value = chainedReject ? chainedReject(error) : error;
        resolver(value);
      }];
  return promise;
}

@end

@implementation FBLPromise (DotSyntaxAdditions)

+ (instancetype (^)(void))pending {
  return ^(void) {
    return [self pendingPromise];
  };
}

+ (instancetype (^)(id __nullable))resolved {
  return ^(id resolution) {
    return [self resolvedWith:resolution];
  };
}

@end
