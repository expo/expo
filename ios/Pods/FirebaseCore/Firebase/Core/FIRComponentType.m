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

#import "Private/FIRComponentType.h"

#import "Private/FIRComponentContainerInternal.h"

@implementation FIRComponentType

+ (id)instanceForProtocol:(Protocol *)protocol inContainer:(FIRComponentContainer *)container {
  // Forward the call to the container.
  return [container instanceForProtocol:protocol];
}

@end
