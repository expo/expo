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

#import "GDTCORLibrary/Private/GDTCORTransformer.h"
#import "GDTCORLibrary/Private/GDTCORTransformer_Private.h"

#import <GoogleDataTransport/GDTCORAssert.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCOREventTransformer.h>
#import <GoogleDataTransport/GDTCORLifecycle.h>

#import "GDTCORLibrary/Private/GDTCORStorage.h"

@implementation GDTCORTransformer

+ (instancetype)sharedInstance {
  static GDTCORTransformer *eventTransformer;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    eventTransformer = [[self alloc] init];
  });
  return eventTransformer;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _eventWritingQueue =
        dispatch_queue_create("com.google.GDTCORTransformer", DISPATCH_QUEUE_SERIAL);
    _storageInstance = [GDTCORStorage sharedInstance];
  }
  return self;
}

- (void)transformEvent:(GDTCOREvent *)event
      withTransformers:(NSArray<id<GDTCOREventTransformer>> *)transformers {
  GDTCORAssert(event, @"You can't write a nil event");

  __block GDTCORBackgroundIdentifier bgID = GDTCORBackgroundIdentifierInvalid;
  if (_runningInBackground) {
    bgID = [[GDTCORApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
      if (bgID != GDTCORBackgroundIdentifierInvalid) {
        [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
        bgID = GDTCORBackgroundIdentifierInvalid;
      }
    }];
  }
  dispatch_async(_eventWritingQueue, ^{
    GDTCOREvent *transformedEvent = event;
    for (id<GDTCOREventTransformer> transformer in transformers) {
      if ([transformer respondsToSelector:@selector(transform:)]) {
        transformedEvent = [transformer transform:transformedEvent];
        if (!transformedEvent) {
          return;
        }
      } else {
        GDTCORLogError(GDTCORMCETransformerDoesntImplementTransform,
                       @"Transformer doesn't implement transform: %@", transformer);
        return;
      }
    }
    [self.storageInstance storeEvent:transformedEvent];
    if (self->_runningInBackground) {
      [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
      bgID = GDTCORBackgroundIdentifierInvalid;
    }
  });
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillForeground:(GDTCORApplication *)app {
  dispatch_async(_eventWritingQueue, ^{
    self->_runningInBackground = NO;
  });
}

- (void)appWillBackground:(GDTCORApplication *)app {
  // Create an immediate background task to run until the end of the current queue of work.
  __block GDTCORBackgroundIdentifier bgID = [app beginBackgroundTaskWithExpirationHandler:^{
    if (bgID != GDTCORBackgroundIdentifierInvalid) {
      [app endBackgroundTask:bgID];
      bgID = GDTCORBackgroundIdentifierInvalid;
    }
  }];
  dispatch_async(_eventWritingQueue, ^{
    if (bgID != GDTCORBackgroundIdentifierInvalid) {
      [app endBackgroundTask:bgID];
      bgID = GDTCORBackgroundIdentifierInvalid;
    }
  });
}

- (void)appWillTerminate:(GDTCORApplication *)application {
  // Flush the queue immediately.
  dispatch_sync(_eventWritingQueue, ^{
                });
}

@end
