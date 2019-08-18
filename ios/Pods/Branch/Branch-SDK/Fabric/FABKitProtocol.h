//
//  FABKitProtocol.h
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

#import <Foundation/Foundation.h>

/**
 *  Protocol that a class in a Fabric Kit must conform to to provide information to Fabric at runtime.
 */
@protocol FABKit <NSObject>

@required

/**
 *  Required. The globally unique identifier of the Kit.
 *  We encourage the use of reverse-DNS notation.
 *  Example: @"io.fabric.sdk.ios"
 */
+ (NSString *)bundleIdentifier;

/**
 *  Required. Must return the current version of the Kit that is being used at runtime.
 *  We encourage the use of semantic versioning (http://semver.org/), without prefixing the version with a "v".
 *  This is commonly referred to as the "marketing version".
 *  Example: @"1.2.3"
 */
+ (NSString *)kitDisplayVersion;

@optional

/**
 *  The build version of the kit. Should be monotonically increasing and unique.
 *  Example: 137
 */
+ (NSString *)kitBuildVersion;

/**
 *  Perform any necessary initialization.
 *  This method will be invoked on the Kit when the user calls +[Fabric initializeKits].
 *  @note This method being called does not necessarily imply that the developer has started using the Kit yet.
 */
+ (void)initializeIfNeeded;

@end
