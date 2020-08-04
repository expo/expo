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

#import <Foundation/Foundation.h>

/**
 *  Parsing utility for InstanceID Library versions. InstanceID lib follows semantic versioning.
 *  This provides utilities to parse the library versions to enable features and do
 *  updates based on appropriate library versions.
 *
 *  Some example semantic versions are 1.0.1, 2.1.0, 2.1.1, 2.2.0-alpha1, 2.2.1-beta1
 */

FOUNDATION_EXPORT NSString *FIRInstanceIDCurrentLibraryVersion(void);
/// Returns the current Major version of GCM library.
FOUNDATION_EXPORT int FIRInstanceIDCurrentLibraryVersionMajor(void);
/// Returns the current Minor version of GCM library.
FOUNDATION_EXPORT int FIRInstanceIDCurrentLibraryVersionMinor(void);
/// Returns the current Patch version of GCM library.
FOUNDATION_EXPORT int FIRInstanceIDCurrentLibraryVersionPatch(void);
/// Returns YES if current library version is `beta` else NO.
FOUNDATION_EXPORT BOOL FIRInstanceIDCurrentLibraryVersionIsBeta(void);
