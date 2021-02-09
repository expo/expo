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

#import "FIRInstanceIDCombinedHandler.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^FIRInstanseIDHandler)(id _Nullable result, NSError *_Nullable error);

@interface FIRInstanceIDCombinedHandler <ResultType>()
@property(atomic, readonly, strong) NSMutableArray<FIRInstanseIDHandler> *handlers;
@end

NS_ASSUME_NONNULL_END

@implementation FIRInstanceIDCombinedHandler

- (instancetype)init {
  self = [super init];
  if (self) {
    _handlers = [NSMutableArray array];
  }
  return self;
}

- (void)addHandler:(FIRInstanseIDHandler)handler {
  if (!handler) {
    return;
  }

  @synchronized(self) {
    [self.handlers addObject:handler];
  }
}

- (FIRInstanseIDHandler)combinedHandler {
  FIRInstanseIDHandler combinedHandler = nil;

  @synchronized(self) {
    NSArray<FIRInstanseIDHandler> *handlers = [self.handlers copy];
    combinedHandler = ^(id result, NSError *error) {
      for (FIRInstanseIDHandler handler in handlers) {
        handler(result, error);
      }
    };
  }

  return combinedHandler;
}

@end
