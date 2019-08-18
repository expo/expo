//
//  Fabric+FABKits.h
//  Fabric
//
//  Copyright (C) 2015 Twitter, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

#import "Fabric.h"

@protocol FABKit;
// Use this category for methods that kits can call on Fabric.
@interface Fabric (FABKits)

/**
 *  Returns a dictionary containing the kit configuration info for the provided kit.
 *  The configuration information is parsed from the application's Info.plist. This
 *  method is primarily intended to be used by kits to retrieve their configuration.
 *
 *  @param kitClass The class of the kit whose configuration should be returned. 
 *  It should conform to the FABKit protocol.
 *
 *  @return A dictionary containing kit specific configuration information or nil if none exists.
 */
+ (fab_nonnull NSDictionary *)configurationDictionaryForKitClass:(fab_nonnull Class)kitClass;

@end
