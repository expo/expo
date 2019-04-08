// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "Private/FIRAppAssociationRegistration.h"

#import <objc/runtime.h>

@implementation FIRAppAssociationRegistration

+ (nullable id)registeredObjectWithHost:(id)host
                                    key:(NSString *)key
                          creationBlock:(id _Nullable (^)(void))creationBlock {
  @synchronized(self) {
    SEL dictKey = @selector(registeredObjectWithHost:key:creationBlock:);
    NSMutableDictionary<NSString *, id> *objectsByKey = objc_getAssociatedObject(host, dictKey);
    if (!objectsByKey) {
      objectsByKey = [[NSMutableDictionary alloc] init];
      objc_setAssociatedObject(host, dictKey, objectsByKey, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
    id obj = objectsByKey[key];
    NSValue *creationBlockBeingCalled = [NSValue valueWithPointer:dictKey];
    if (obj) {
      if ([creationBlockBeingCalled isEqual:obj]) {
        [NSException raise:@"Reentering registeredObjectWithHost:key:creationBlock: not allowed"
                    format:@"host: %@ key: %@", host, key];
      }
      return obj;
    }
    objectsByKey[key] = creationBlockBeingCalled;
    obj = creationBlock();
    objectsByKey[key] = obj;
    return obj;
  }
}

@end
