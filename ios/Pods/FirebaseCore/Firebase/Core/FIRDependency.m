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

#import "Private/FIRDependency.h"

@interface FIRDependency ()

- (instancetype)initWithProtocol:(Protocol *)protocol isRequired:(BOOL)required;

@end

@implementation FIRDependency

+ (instancetype)dependencyWithProtocol:(Protocol *)protocol {
  return [[self alloc] initWithProtocol:protocol isRequired:YES];
}

+ (instancetype)dependencyWithProtocol:(Protocol *)protocol isRequired:(BOOL)required {
  return [[self alloc] initWithProtocol:protocol isRequired:required];
}

- (instancetype)initWithProtocol:(Protocol *)protocol isRequired:(BOOL)required {
  self = [super init];
  if (self) {
    _protocol = protocol;
    _isRequired = required;
  }
  return self;
}

@end
