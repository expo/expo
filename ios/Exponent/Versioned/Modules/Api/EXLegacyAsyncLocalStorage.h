// Copyright 2015-present 650 Industries. All rights reserved.

// Read-only access to legacy (unscoped) `RCTAsyncLocalStorage` backing for
// access to legacy data, now that the new one we use in our fork is scoped
// per-app

// This code is basically based on react-native's built-in
// `RCTAsyncLocalStorage.{h,m}` except made to be read-only and with
// naming changes to `EXLegacyAsyncLocalStorage` for the Objective-C class
// and `ExponentLegacyAsyncLocalStorage` for the native module name


/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>

/**
 * A simple, asynchronous, persistent, key-value storage system designed as a
 * backend to the AsyncStorage JS module, which is modeled after LocalStorage.
 *
 * Current implementation stores small values in serialized dictionary and
 * larger values in separate files. Since we use a serial file queue
 * `RKFileQueue`, reading/writing from multiple threads should be perceived as
 * being atomic, unless someone bypasses the `RCTAsyncLocalStorage` API.
 *
 * Keys and values must always be strings or an error is returned.
 */
@interface EXLegacyAsyncLocalStorage : NSObject <RCTBridgeModule,RCTInvalidating>

@property (nonatomic, readonly, getter=isValid) BOOL valid;

@end
