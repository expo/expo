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

#import "GDTLibrary/Public/GDTRegistrar.h"

#import "GDTLibrary/Private/GDTRegistrar_Private.h"

@implementation GDTRegistrar {
  /** Backing ivar for targetToUploader property. */
  NSMutableDictionary<NSNumber *, id<GDTUploader>> *_targetToUploader;

  /** Backing ivar for targetToPrioritizer property. */
  NSMutableDictionary<NSNumber *, id<GDTPrioritizer>> *_targetToPrioritizer;
}

+ (instancetype)sharedInstance {
  static GDTRegistrar *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTRegistrar alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _registrarQueue = dispatch_queue_create("com.google.GDTRegistrar", DISPATCH_QUEUE_CONCURRENT);
    _targetToPrioritizer = [[NSMutableDictionary alloc] init];
    _targetToUploader = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)registerUploader:(id<GDTUploader>)backend target:(GDTTarget)target {
  __weak GDTRegistrar *weakSelf = self;
  dispatch_barrier_async(_registrarQueue, ^{
    GDTRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf->_targetToUploader[@(target)] = backend;
    }
  });
}

- (void)registerPrioritizer:(id<GDTPrioritizer>)prioritizer target:(GDTTarget)target {
  __weak GDTRegistrar *weakSelf = self;
  dispatch_barrier_async(_registrarQueue, ^{
    GDTRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf->_targetToPrioritizer[@(target)] = prioritizer;
    }
  });
}

- (NSMutableDictionary<NSNumber *, id<GDTUploader>> *)targetToUploader {
  __block NSMutableDictionary<NSNumber *, id<GDTUploader>> *targetToUploader;
  __weak GDTRegistrar *weakSelf = self;
  dispatch_sync(_registrarQueue, ^{
    GDTRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      targetToUploader = strongSelf->_targetToUploader;
    }
  });
  return targetToUploader;
}

- (NSMutableDictionary<NSNumber *, id<GDTPrioritizer>> *)targetToPrioritizer {
  __block NSMutableDictionary<NSNumber *, id<GDTPrioritizer>> *targetToPrioritizer;
  __weak GDTRegistrar *weakSelf = self;
  dispatch_sync(_registrarQueue, ^{
    GDTRegistrar *strongSelf = weakSelf;
    if (strongSelf) {
      targetToPrioritizer = strongSelf->_targetToPrioritizer;
    }
  });
  return targetToPrioritizer;
}

#pragma mark - GDTLifecycleProtocol

- (void)appWillBackground:(nonnull GDTApplication *)app {
  dispatch_async(_registrarQueue, ^{
    for (id<GDTUploader> uploader in [self->_targetToUploader allValues]) {
      if ([uploader respondsToSelector:@selector(appWillBackground:)]) {
        [uploader appWillBackground:app];
      }
    }
    for (id<GDTPrioritizer> prioritizer in [self->_targetToPrioritizer allValues]) {
      if ([prioritizer respondsToSelector:@selector(appWillBackground:)]) {
        [prioritizer appWillBackground:app];
      }
    }
  });
}

- (void)appWillForeground:(nonnull GDTApplication *)app {
  dispatch_async(_registrarQueue, ^{
    for (id<GDTUploader> uploader in [self->_targetToUploader allValues]) {
      if ([uploader respondsToSelector:@selector(appWillForeground:)]) {
        [uploader appWillForeground:app];
      }
    }
    for (id<GDTPrioritizer> prioritizer in [self->_targetToPrioritizer allValues]) {
      if ([prioritizer respondsToSelector:@selector(appWillForeground:)]) {
        [prioritizer appWillForeground:app];
      }
    }
  });
}

- (void)appWillTerminate:(nonnull GDTApplication *)app {
  dispatch_sync(_registrarQueue, ^{
    for (id<GDTUploader> uploader in [self->_targetToUploader allValues]) {
      if ([uploader respondsToSelector:@selector(appWillTerminate:)]) {
        [uploader appWillTerminate:app];
      }
    }
    for (id<GDTPrioritizer> prioritizer in [self->_targetToPrioritizer allValues]) {
      if ([prioritizer respondsToSelector:@selector(appWillTerminate:)]) {
        [prioritizer appWillTerminate:app];
      }
    }
  });
}

@end
