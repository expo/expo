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

#import "GDTCORLibrary/Public/GDTCORRegistrar.h"
#import "GDTCORLibrary/Private/GDTCORRegistrar_Private.h"

#import "GDTCORLibrary/Public/GDTCORConsoleLogger.h"

id<GDTCORStorageProtocol> _Nullable GDTCORStorageInstanceForTarget(GDTCORTarget target) {
  return [GDTCORRegistrar sharedInstance].targetToStorage[@(target)];
}

@implementation GDTCORRegistrar {
  /** Backing ivar for targetToUploader property. */
  NSMutableDictionary<NSNumber *, id<GDTCORUploader>> *_targetToUploader;

  /** Backing ivar for targetToPrioritizer property. */
  NSMutableDictionary<NSNumber *, id<GDTCORPrioritizer>> *_targetToPrioritizer;

  /** Backing ivar for targetToStorage property. */
  NSMutableDictionary<NSNumber *, id<GDTCORStorageProtocol>> *_targetToStorage;
}

+ (instancetype)sharedInstance {
  static GDTCORRegistrar *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTCORRegistrar alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _registrarQueue = dispatch_queue_create("com.google.GDTCORRegistrar", DISPATCH_QUEUE_SERIAL);
    _targetToPrioritizer = [[NSMutableDictionary alloc] init];
    _targetToUploader = [[NSMutableDictionary alloc] init];
    _targetToStorage = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)registerUploader:(id<GDTCORUploader>)backend target:(GDTCORTarget)target {
  __weak GDTCORRegistrar *weakSelf = self;
  dispatch_async(_registrarQueue, ^{
    GDTCORRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      GDTCORLogDebug(@"Registered an uploader: %@ for target:%ld", backend, (long)target);
      strongSelf->_targetToUploader[@(target)] = backend;
    }
  });
}

- (void)registerStorage:(id<GDTCORStorageProtocol>)storage target:(GDTCORTarget)target {
  __weak GDTCORRegistrar *weakSelf = self;
  dispatch_async(_registrarQueue, ^{
    GDTCORRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      GDTCORLogDebug(@"Registered storage: %@ for target:%ld", storage, (long)target);
      strongSelf->_targetToStorage[@(target)] = storage;
    }
  });
}

- (void)registerPrioritizer:(id<GDTCORPrioritizer>)prioritizer target:(GDTCORTarget)target {
  __weak GDTCORRegistrar *weakSelf = self;
  dispatch_async(_registrarQueue, ^{
    GDTCORRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      GDTCORLogDebug(@"Registered a prioritizer: %@ for target:%ld", prioritizer, (long)target);
      strongSelf->_targetToPrioritizer[@(target)] = prioritizer;
    }
  });
}

- (NSMutableDictionary<NSNumber *, id<GDTCORUploader>> *)targetToUploader {
  __block NSMutableDictionary<NSNumber *, id<GDTCORUploader>> *targetToUploader;
  __weak GDTCORRegistrar *weakSelf = self;
  dispatch_sync(_registrarQueue, ^{
    GDTCORRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      targetToUploader = strongSelf->_targetToUploader;
    }
  });
  return targetToUploader;
}

- (NSMutableDictionary<NSNumber *, id<GDTCORPrioritizer>> *)targetToPrioritizer {
  __block NSMutableDictionary<NSNumber *, id<GDTCORPrioritizer>> *targetToPrioritizer;
  __weak GDTCORRegistrar *weakSelf = self;
  dispatch_sync(_registrarQueue, ^{
    GDTCORRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      targetToPrioritizer = strongSelf->_targetToPrioritizer;
    }
  });
  return targetToPrioritizer;
}

- (NSMutableDictionary<NSNumber *, id<GDTCORStorageProtocol>> *)targetToStorage {
  __block NSMutableDictionary<NSNumber *, id<GDTCORStorageProtocol>> *targetToStorage;
  __weak GDTCORRegistrar *weakSelf = self;
  dispatch_sync(_registrarQueue, ^{
    GDTCORRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      targetToStorage = strongSelf->_targetToStorage;
    }
  });
  return targetToStorage;
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillBackground:(nonnull GDTCORApplication *)app {
  NSArray<id<GDTCORUploader>> *uploaders = [self.targetToUploader allValues];
  for (id<GDTCORUploader> uploader in uploaders) {
    if ([uploader respondsToSelector:@selector(appWillBackground:)]) {
      [uploader appWillBackground:app];
    }
  }
  NSArray<id<GDTCORPrioritizer>> *prioritizers = [self.targetToPrioritizer allValues];
  for (id<GDTCORPrioritizer> prioritizer in prioritizers) {
    if ([prioritizer respondsToSelector:@selector(appWillBackground:)]) {
      [prioritizer appWillBackground:app];
    }
  }
  NSArray<id<GDTCORStorageProtocol>> *storages = [self.targetToStorage allValues];
  for (id<GDTCORStorageProtocol> storage in storages) {
    if ([storage respondsToSelector:@selector(appWillBackground:)]) {
      [storage appWillBackground:app];
    }
  }
}

- (void)appWillForeground:(nonnull GDTCORApplication *)app {
  NSArray<id<GDTCORUploader>> *uploaders = [self.targetToUploader allValues];
  for (id<GDTCORUploader> uploader in uploaders) {
    if ([uploader respondsToSelector:@selector(appWillForeground:)]) {
      [uploader appWillForeground:app];
    }
  }
  NSArray<id<GDTCORPrioritizer>> *prioritizers = [self.targetToPrioritizer allValues];
  for (id<GDTCORPrioritizer> prioritizer in prioritizers) {
    if ([prioritizer respondsToSelector:@selector(appWillForeground:)]) {
      [prioritizer appWillForeground:app];
    }
  }
  NSArray<id<GDTCORStorageProtocol>> *storages = [self.targetToStorage allValues];
  for (id<GDTCORStorageProtocol> storage in storages) {
    if ([storage respondsToSelector:@selector(appWillForeground:)]) {
      [storage appWillForeground:app];
    }
  }
}

- (void)appWillTerminate:(nonnull GDTCORApplication *)app {
  NSArray<id<GDTCORUploader>> *uploaders = [self.targetToUploader allValues];
  for (id<GDTCORUploader> uploader in uploaders) {
    if ([uploader respondsToSelector:@selector(appWillTerminate:)]) {
      [uploader appWillTerminate:app];
    }
  }
  NSArray<id<GDTCORPrioritizer>> *prioritizers = [self.targetToPrioritizer allValues];
  for (id<GDTCORPrioritizer> prioritizer in prioritizers) {
    if ([prioritizer respondsToSelector:@selector(appWillTerminate:)]) {
      [prioritizer appWillTerminate:app];
    }
  }
  NSArray<id<GDTCORStorageProtocol>> *storages = [self.targetToStorage allValues];
  for (id<GDTCORStorageProtocol> storage in storages) {
    if ([storage respondsToSelector:@selector(appWillTerminate:)]) {
      [storage appWillTerminate:app];
    }
  }
}

@end
