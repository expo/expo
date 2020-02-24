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

#import "GDTCORLibrary/Private/GDTCORStorage.h"
#import "GDTCORLibrary/Private/GDTCORStorage_Private.h"

#import <GoogleDataTransport/GDTCORAssert.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCORLifecycle.h>
#import <GoogleDataTransport/GDTCORPrioritizer.h>
#import <GoogleDataTransport/GDTCORStoredEvent.h>

#import "GDTCORLibrary/Private/GDTCOREvent_Private.h"
#import "GDTCORLibrary/Private/GDTCORRegistrar_Private.h"
#import "GDTCORLibrary/Private/GDTCORUploadCoordinator.h"

/** Creates and/or returns a singleton NSString that is the shared storage path.
 *
 * @return The SDK event storage path.
 */
static NSString *GDTCORStoragePath() {
  static NSString *storagePath;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *cachePath =
        NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES)[0];
    storagePath = [NSString stringWithFormat:@"%@/google-sdks-events", cachePath];
  });
  return storagePath;
}

@implementation GDTCORStorage

+ (NSString *)archivePath {
  static NSString *archivePath;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    archivePath = [GDTCORStoragePath() stringByAppendingPathComponent:@"GDTCORStorageArchive"];
  });
  return archivePath;
}

+ (instancetype)sharedInstance {
  static GDTCORStorage *sharedStorage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedStorage = [[GDTCORStorage alloc] init];
  });
  return sharedStorage;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _storageQueue = dispatch_queue_create("com.google.GDTCORStorage", DISPATCH_QUEUE_SERIAL);
    _targetToEventSet = [[NSMutableDictionary alloc] init];
    _storedEvents = [[NSMutableOrderedSet alloc] init];
    _uploadCoordinator = [GDTCORUploadCoordinator sharedInstance];
  }
  return self;
}

- (void)storeEvent:(GDTCOREvent *)event {
  if (event == nil) {
    return;
  }

  [self createEventDirectoryIfNotExists];

  __block GDTCORBackgroundIdentifier bgID = GDTCORBackgroundIdentifierInvalid;
  bgID = [[GDTCORApplication sharedApplication]
      beginBackgroundTaskWithName:@"GDTStorage"
                expirationHandler:^{
                  // End the background task if it's still valid.
                  [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
                  bgID = GDTCORBackgroundIdentifierInvalid;
                }];

  dispatch_async(_storageQueue, ^{
    // Check that a backend implementation is available for this target.
    NSInteger target = event.target;

    // Check that a prioritizer is available for this target.
    id<GDTCORPrioritizer> prioritizer =
        [GDTCORRegistrar sharedInstance].targetToPrioritizer[@(target)];
    GDTCORAssert(prioritizer, @"There's no prioritizer registered for the given target.");

    // Write the transport bytes to disk, get a filename.
    GDTCORAssert(event.dataObjectTransportBytes, @"The event should have been serialized to bytes");
    NSURL *eventFile = [self saveEventBytesToDisk:event.dataObjectTransportBytes
                                        eventHash:event.hash];
    GDTCORDataFuture *dataFuture = [[GDTCORDataFuture alloc] initWithFileURL:eventFile];
    GDTCORStoredEvent *storedEvent = [event storedEventWithDataFuture:dataFuture];

    // Add event to tracking collections.
    [self addEventToTrackingCollections:storedEvent];

    // Have the prioritizer prioritize the event.
    [prioritizer prioritizeEvent:storedEvent];

    // Check the QoS, if it's high priority, notify the target that it has a high priority event.
    if (event.qosTier == GDTCOREventQoSFast) {
      [self.uploadCoordinator forceUploadForTarget:target];
    }

    // Write state to disk if we're in the background.
    if ([[GDTCORApplication sharedApplication] isRunningInBackground]) {
      if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
        NSError *error;
        NSData *data = [NSKeyedArchiver archivedDataWithRootObject:self
                                             requiringSecureCoding:YES
                                                             error:&error];
        [data writeToFile:[GDTCORStorage archivePath] atomically:YES];
      } else {
#if !TARGET_OS_MACCATALYST
        [NSKeyedArchiver archiveRootObject:self toFile:[GDTCORStorage archivePath]];
#endif
      }
    }

    // Cancel or end the associated background task if it's still valid.
    [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
    bgID = GDTCORBackgroundIdentifierInvalid;
  });
}

- (void)removeEvents:(NSSet<GDTCORStoredEvent *> *)events {
  NSSet<GDTCORStoredEvent *> *eventsToRemove = [events copy];
  dispatch_async(_storageQueue, ^{
    for (GDTCORStoredEvent *event in eventsToRemove) {
      // Remove from disk, first and foremost.
      NSError *error;
      if (event.dataFuture.fileURL) {
        NSURL *fileURL = event.dataFuture.fileURL;
        [[NSFileManager defaultManager] removeItemAtURL:fileURL error:&error];
        GDTCORAssert(error == nil, @"There was an error removing an event file: %@", error);
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
  BOOL result = [[NSFileManager defaultManager] createDirectoryAtPath:GDTCORStoragePath()
                                          withIntermediateDirectories:YES
                                                           attributes:0
                                                                error:&error];
  if (!result || error) {
    GDTCORLogError(GDTCORMCEDirectoryCreationError, @"Error creating the directory: %@", error);
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
  NSString *storagePath = GDTCORStoragePath();
  NSString *event = [NSString stringWithFormat:@"event-%lu", (unsigned long)eventHash];
  NSURL *eventFilePath = [NSURL fileURLWithPath:[storagePath stringByAppendingPathComponent:event]];

  GDTCORAssert(![[NSFileManager defaultManager] fileExistsAtPath:eventFilePath.path],
               @"An event shouldn't already exist at this path: %@", eventFilePath.path);

  BOOL writingSuccess = [transportBytes writeToURL:eventFilePath atomically:YES];
  if (!writingSuccess) {
    GDTCORLogError(GDTCORMCEFileWriteError, @"An event file could not be written: %@",
                   eventFilePath);
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
- (void)addEventToTrackingCollections:(GDTCORStoredEvent *)event {
  [_storedEvents addObject:event];
  NSMutableSet<GDTCORStoredEvent *> *events = self.targetToEventSet[event.target];
  events = events ? events : [[NSMutableSet alloc] init];
  [events addObject:event];
  _targetToEventSet[event.target] = events;
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillForeground:(GDTCORApplication *)app {
  if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
    NSError *error;
    NSData *data = [NSData dataWithContentsOfFile:[GDTCORStorage archivePath]];
    if (data) {
      [NSKeyedUnarchiver unarchivedObjectOfClass:[GDTCORStorage class] fromData:data error:&error];
    }
  } else {
#if !TARGET_OS_MACCATALYST
    [NSKeyedUnarchiver unarchiveObjectWithFile:[GDTCORStorage archivePath]];
#endif
  }
}

- (void)appWillBackground:(GDTCORApplication *)app {
  dispatch_async(_storageQueue, ^{
    // Immediately request a background task to run until the end of the current queue of work, and
    // cancel it once the work is done.
    __block GDTCORBackgroundIdentifier bgID =
        [app beginBackgroundTaskWithName:@"GDTStorage"
                       expirationHandler:^{
                         [app endBackgroundTask:bgID];
                         bgID = GDTCORBackgroundIdentifierInvalid;
                       }];

    if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
      NSError *error;
      NSData *data = [NSKeyedArchiver archivedDataWithRootObject:self
                                           requiringSecureCoding:YES
                                                           error:&error];
      [data writeToFile:[GDTCORStorage archivePath] atomically:YES];
    } else {
#if !TARGET_OS_MACCATALYST
      [NSKeyedArchiver archiveRootObject:self toFile:[GDTCORStorage archivePath]];
#endif
    }

    // End the background task if it's still valid.
    [app endBackgroundTask:bgID];
    bgID = GDTCORBackgroundIdentifierInvalid;
  });
}

- (void)appWillTerminate:(GDTCORApplication *)application {
  if (@available(macOS 10.13, iOS 11.0, tvOS 11.0, *)) {
    NSError *error;
    NSData *data = [NSKeyedArchiver archivedDataWithRootObject:self
                                         requiringSecureCoding:YES
                                                         error:&error];
    [data writeToFile:[GDTCORStorage archivePath] atomically:YES];
  } else {
#if !TARGET_OS_MACCATALYST
    [NSKeyedArchiver archiveRootObject:self toFile:[GDTCORStorage archivePath]];
#endif
  }
}

#pragma mark - NSSecureCoding

/** The NSKeyedCoder key for the storedEvents property. */
static NSString *const kGDTCORStorageStoredEventsKey = @"GDTCORStorageStoredEventsKey";

/** The NSKeyedCoder key for the targetToEventSet property. */
static NSString *const kGDTCORStorageTargetToEventSetKey = @"GDTCORStorageTargetToEventSetKey";

/** The NSKeyedCoder key for the uploadCoordinator property. */
static NSString *const kGDTCORStorageUploadCoordinatorKey = @"GDTCORStorageUploadCoordinatorKey";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  // Create the singleton and populate its ivars.
  GDTCORStorage *sharedInstance = [self.class sharedInstance];
  dispatch_sync(sharedInstance.storageQueue, ^{
    NSSet *classes =
        [NSSet setWithObjects:[NSMutableOrderedSet class], [GDTCORStoredEvent class], nil];
    sharedInstance->_storedEvents = [aDecoder decodeObjectOfClasses:classes
                                                             forKey:kGDTCORStorageStoredEventsKey];
    classes = [NSSet setWithObjects:[NSMutableDictionary class], [NSMutableSet class],
                                    [GDTCORStoredEvent class], nil];
    sharedInstance->_targetToEventSet =
        [aDecoder decodeObjectOfClasses:classes forKey:kGDTCORStorageTargetToEventSetKey];
    sharedInstance->_uploadCoordinator =
        [aDecoder decodeObjectOfClass:[GDTCORUploadCoordinator class]
                               forKey:kGDTCORStorageUploadCoordinatorKey];
  });
  return sharedInstance;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  GDTCORStorage *sharedInstance = [self.class sharedInstance];
  NSMutableOrderedSet<GDTCORStoredEvent *> *storedEvents = sharedInstance->_storedEvents;
  if (storedEvents) {
    [aCoder encodeObject:storedEvents forKey:kGDTCORStorageStoredEventsKey];
  }
  NSMutableDictionary<NSNumber *, NSMutableSet<GDTCORStoredEvent *> *> *targetToEventSet =
      sharedInstance->_targetToEventSet;
  if (targetToEventSet) {
    [aCoder encodeObject:targetToEventSet forKey:kGDTCORStorageTargetToEventSetKey];
  }
  GDTCORUploadCoordinator *uploadCoordinator = sharedInstance->_uploadCoordinator;
  if (uploadCoordinator) {
    [aCoder encodeObject:uploadCoordinator forKey:kGDTCORStorageUploadCoordinatorKey];
  }
}

@end
