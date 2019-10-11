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

#import "GDTLibrary/Private/GDTStorage.h"
#import "GDTLibrary/Private/GDTStorage_Private.h"

#import <GoogleDataTransport/GDTAssert.h>
#import <GoogleDataTransport/GDTConsoleLogger.h>
#import <GoogleDataTransport/GDTLifecycle.h>
#import <GoogleDataTransport/GDTPrioritizer.h>
#import <GoogleDataTransport/GDTStoredEvent.h>

#import "GDTLibrary/Private/GDTEvent_Private.h"
#import "GDTLibrary/Private/GDTRegistrar_Private.h"
#import "GDTLibrary/Private/GDTUploadCoordinator.h"

/** Creates and/or returns a singleton NSString that is the shared storage path.
 *
 * @return The SDK event storage path.
 */
static NSString *GDTStoragePath() {
  static NSString *storagePath;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *cachePath =
        NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES)[0];
    storagePath = [NSString stringWithFormat:@"%@/google-sdks-events", cachePath];
  });
  return storagePath;
}

@implementation GDTStorage

+ (NSString *)archivePath {
  static NSString *archivePath;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    archivePath = [GDTStoragePath() stringByAppendingPathComponent:@"GDTStorageArchive"];
  });
  return archivePath;
}

+ (instancetype)sharedInstance {
  static GDTStorage *sharedStorage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedStorage = [[GDTStorage alloc] init];
  });
  return sharedStorage;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _storageQueue = dispatch_queue_create("com.google.GDTStorage", DISPATCH_QUEUE_SERIAL);
    _targetToEventSet = [[NSMutableDictionary alloc] init];
    _storedEvents = [[NSMutableOrderedSet alloc] init];
    _uploadCoordinator = [GDTUploadCoordinator sharedInstance];
  }
  return self;
}

- (void)storeEvent:(GDTEvent *)event {
  if (event == nil) {
    return;
  }

  [self createEventDirectoryIfNotExists];

  __block GDTBackgroundIdentifier bgID = GDTBackgroundIdentifierInvalid;
  if (_runningInBackground) {
    bgID = [[GDTApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
      if (bgID != GDTBackgroundIdentifierInvalid) {
        [[GDTApplication sharedApplication] endBackgroundTask:bgID];
        bgID = GDTBackgroundIdentifierInvalid;
      }
    }];
  }

  dispatch_async(_storageQueue, ^{
    // Check that a backend implementation is available for this target.
    NSInteger target = event.target;

    // Check that a prioritizer is available for this target.
    id<GDTPrioritizer> prioritizer = [GDTRegistrar sharedInstance].targetToPrioritizer[@(target)];
    GDTAssert(prioritizer, @"There's no prioritizer registered for the given target.");

    // Write the transport bytes to disk, get a filename.
    GDTAssert(event.dataObjectTransportBytes, @"The event should have been serialized to bytes");
    NSURL *eventFile = [self saveEventBytesToDisk:event.dataObjectTransportBytes
                                        eventHash:event.hash];
    GDTDataFuture *dataFuture = [[GDTDataFuture alloc] initWithFileURL:eventFile];
    GDTStoredEvent *storedEvent = [event storedEventWithDataFuture:dataFuture];

    // Add event to tracking collections.
    [self addEventToTrackingCollections:storedEvent];

    // Have the prioritizer prioritize the event.
    [prioritizer prioritizeEvent:storedEvent];

    // Check the QoS, if it's high priority, notify the target that it has a high priority event.
    if (event.qosTier == GDTEventQoSFast) {
      [self.uploadCoordinator forceUploadForTarget:target];
    }

    // Write state to disk.
    if (self->_runningInBackground) {
      if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
        NSData *data = [NSKeyedArchiver archivedDataWithRootObject:self
                                             requiringSecureCoding:YES
                                                             error:nil];
        [data writeToFile:[GDTStorage archivePath] atomically:YES];
      } else {
#if !defined(TARGET_OS_MACCATALYST)
        [NSKeyedArchiver archiveRootObject:self toFile:[GDTStorage archivePath]];
#endif
      }
    }

    // If running in the background, save state to disk and end the associated background task.
    if (bgID != GDTBackgroundIdentifierInvalid) {
      [[GDTApplication sharedApplication] endBackgroundTask:bgID];
      bgID = GDTBackgroundIdentifierInvalid;
    }
  });
}

- (void)removeEvents:(NSSet<GDTStoredEvent *> *)events {
  NSSet<GDTStoredEvent *> *eventsToRemove = [events copy];
  dispatch_async(_storageQueue, ^{
    for (GDTStoredEvent *event in eventsToRemove) {
      // Remove from disk, first and foremost.
      NSError *error;
      if (event.dataFuture.fileURL) {
        NSURL *fileURL = event.dataFuture.fileURL;
        [[NSFileManager defaultManager] removeItemAtURL:fileURL error:&error];
        GDTAssert(error == nil, @"There was an error removing an event file: %@", error);
      }

      // Remove from the tracking collections.
      [self.storedEvents removeObject:event];
      [self.targetToEventSet[event.target] removeObject:event];
    }
  });
}

#pragma mark - Private helper methods

/** Creates the storage directory if it does not exist. */
- (void)createEventDirectoryIfNotExists {
  NSError *error;
  BOOL result = [[NSFileManager defaultManager] createDirectoryAtPath:GDTStoragePath()
                                          withIntermediateDirectories:YES
                                                           attributes:0
                                                                error:&error];
  if (!result || error) {
    GDTLogError(GDTMCEDirectoryCreationError, @"Error creating the directory: %@", error);
  }
}

/** Saves the event's dataObjectTransportBytes to a file using NSData mechanisms.
 *
 * @note This method should only be called from a method within a block on _storageQueue to maintain
 * thread safety.
 *
 * @param transportBytes The transport bytes of the event.
 * @param eventHash The hash value of the event.
 * @return The filename
 */
- (NSURL *)saveEventBytesToDisk:(NSData *)transportBytes eventHash:(NSUInteger)eventHash {
  NSString *storagePath = GDTStoragePath();
  NSString *event = [NSString stringWithFormat:@"event-%lu", (unsigned long)eventHash];
  NSURL *eventFilePath = [NSURL fileURLWithPath:[storagePath stringByAppendingPathComponent:event]];

  GDTAssert(![[NSFileManager defaultManager] fileExistsAtPath:eventFilePath.path],
            @"An event shouldn't already exist at this path: %@", eventFilePath.path);

  BOOL writingSuccess = [transportBytes writeToURL:eventFilePath atomically:YES];
  if (!writingSuccess) {
    GDTLogError(GDTMCEFileWriteError, @"An event file could not be written: %@", eventFilePath);
  }

  return eventFilePath;
}

/** Adds the event to internal tracking collections.
 *
 * @note This method should only be called from a method within a block on _storageQueue to maintain
 * thread safety.
 *
 * @param event The event to track.
 */
- (void)addEventToTrackingCollections:(GDTStoredEvent *)event {
  [_storedEvents addObject:event];
  NSMutableSet<GDTStoredEvent *> *events = self.targetToEventSet[event.target];
  events = events ? events : [[NSMutableSet alloc] init];
  [events addObject:event];
  _targetToEventSet[event.target] = events;
}

#pragma mark - GDTLifecycleProtocol

- (void)appWillForeground:(GDTApplication *)app {
  if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
    NSData *data = [NSData dataWithContentsOfFile:[GDTStorage archivePath]];
    [NSKeyedUnarchiver unarchivedObjectOfClass:[GDTStorage class] fromData:data error:nil];
  } else {
#if !defined(TARGET_OS_MACCATALYST)
    [NSKeyedUnarchiver unarchiveObjectWithFile:[GDTStorage archivePath]];
#endif
  }
}

- (void)appWillBackground:(GDTApplication *)app {
  self->_runningInBackground = YES;
  dispatch_async(_storageQueue, ^{
    if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
      NSData *data = [NSKeyedArchiver archivedDataWithRootObject:self
                                           requiringSecureCoding:YES
                                                           error:nil];
      [data writeToFile:[GDTStorage archivePath] atomically:YES];
    } else {
#if !defined(TARGET_OS_MACCATALYST)
      [NSKeyedArchiver archiveRootObject:self toFile:[GDTStorage archivePath]];
#endif
    }
  });

  // Create an immediate background task to run until the end of the current queue of work.
  __block GDTBackgroundIdentifier bgID = [app beginBackgroundTaskWithExpirationHandler:^{
    if (bgID != GDTBackgroundIdentifierInvalid) {
      [app endBackgroundTask:bgID];
      bgID = GDTBackgroundIdentifierInvalid;
    }
  }];
  dispatch_async(_storageQueue, ^{
    if (bgID != GDTBackgroundIdentifierInvalid) {
      [app endBackgroundTask:bgID];
      bgID = GDTBackgroundIdentifierInvalid;
    }
  });
}

- (void)appWillTerminate:(GDTApplication *)application {
  if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
    NSData *data = [NSKeyedArchiver archivedDataWithRootObject:self
                                         requiringSecureCoding:YES
                                                         error:nil];
    [data writeToFile:[GDTStorage archivePath] atomically:YES];
  } else {
#if !defined(TARGET_OS_MACCATALYST)
    [NSKeyedArchiver archiveRootObject:self toFile:[GDTStorage archivePath]];
#endif
  }
}

#pragma mark - NSSecureCoding

/** The NSKeyedCoder key for the storedEvents property. */
static NSString *const kGDTStorageStoredEventsKey = @"GDTStorageStoredEventsKey";

/** The NSKeyedCoder key for the targetToEventSet property. */
static NSString *const kGDTStorageTargetToEventSetKey = @"GDTStorageTargetToEventSetKey";

/** The NSKeyedCoder key for the uploadCoordinator property. */
static NSString *const kGDTStorageUploadCoordinatorKey = @"GDTStorageUploadCoordinatorKey";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  // Create the singleton and populate its ivars.
  GDTStorage *sharedInstance = [self.class sharedInstance];
  dispatch_sync(sharedInstance.storageQueue, ^{
    NSSet *classes =
        [NSSet setWithObjects:[NSMutableOrderedSet class], [GDTStoredEvent class], nil];
    sharedInstance->_storedEvents = [aDecoder decodeObjectOfClasses:classes
                                                             forKey:kGDTStorageStoredEventsKey];
    classes = [NSSet setWithObjects:[NSMutableDictionary class], [NSMutableSet class],
                                    [GDTStoredEvent class], nil];
    sharedInstance->_targetToEventSet =
        [aDecoder decodeObjectOfClasses:classes forKey:kGDTStorageTargetToEventSetKey];
    sharedInstance->_uploadCoordinator =
        [aDecoder decodeObjectOfClass:[GDTUploadCoordinator class]
                               forKey:kGDTStorageUploadCoordinatorKey];
  });
  return sharedInstance;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  GDTStorage *sharedInstance = [self.class sharedInstance];
  NSMutableOrderedSet<GDTStoredEvent *> *storedEvents = sharedInstance->_storedEvents;
  if (storedEvents) {
    [aCoder encodeObject:storedEvents forKey:kGDTStorageStoredEventsKey];
  }
  NSMutableDictionary<NSNumber *, NSMutableSet<GDTStoredEvent *> *> *targetToEventSet =
      sharedInstance->_targetToEventSet;
  if (targetToEventSet) {
    [aCoder encodeObject:targetToEventSet forKey:kGDTStorageTargetToEventSetKey];
  }
  GDTUploadCoordinator *uploadCoordinator = sharedInstance->_uploadCoordinator;
  if (uploadCoordinator) {
    [aCoder encodeObject:uploadCoordinator forKey:kGDTStorageUploadCoordinatorKey];
  }
}

@end
