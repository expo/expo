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

#import "Private/FIRComponent.h"

#import "Private/FIRComponentContainer.h"
#import "Private/FIRDependency.h"

@interface FIRComponent ()

- (instancetype)initWithProtocol:(Protocol *)protocol
             instantiationTiming:(FIRInstantiationTiming)instantiationTiming
                    dependencies:(NSArray<FIRDependency *> *)dependencies
                   creationBlock:(FIRComponentCreationBlock)creationBlock;

@end

@implementation FIRComponent

+ (instancetype)componentWithProtocol:(Protocol *)protocol
                        creationBlock:(FIRComponentCreationBlock)creationBlock {
  return [[FIRComponent alloc] initWithProtocol:protocol
                            instantiationTiming:FIRInstantiationTimingLazy
                                   dependencies:@[]
                                  creationBlock:creationBlock];
}

+ (instancetype)componentWithProtocol:(Protocol *)protocol
                  instantiationTiming:(FIRInstantiationTiming)instantiationTiming
                         dependencies:(NSArray<FIRDependency *> *)dependencies
                        creationBlock:(FIRComponentCreationBlock)creationBlock {
  return [[FIRComponent alloc] initWithProtocol:protocol
                            instantiationTiming:instantiationTiming
                                   dependencies:dependencies
                                  creationBlock:creationBlock];
}

- (instancetype)initWithProtocol:(Protocol *)protocol
             instantiationTiming:(FIRInstantiationTiming)instantiationTiming
                    dependencies:(NSArray<FIRDependency *> *)dependencies
                   creationBlock:(FIRComponentCreationBlock)creationBlock {
  self = [super init];
  if (self) {
    _protocol = protocol;
    _instantiationTiming = instantiationTiming;
    _dependencies = [dependencies copy];
    _creationBlock = creationBlock;
  }
  return self;
}

@end
