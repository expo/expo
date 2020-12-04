/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

//
//  FLEXNetworkObserver.h
//  Derived from:
//
//  PDAFNetworkDomainController.h
//  PonyDebugger
//
//  Created by Mike Lewis on 2/27/12.
//
//  Licensed to Square, Inc. under one or more contributor license agreements.
//  See the LICENSE file distributed with this work for the terms under
//  which Square, Inc. licenses this file to you.
//

#import <Foundation/Foundation.h>

FOUNDATION_EXTERN NSString* const
    kFLEXNetworkObserverEnabledStateChangedNotification;

/// This class swizzles NSURLConnection and NSURLSession delegate methods to
/// observe events in the URL loading system. High level network events are sent
/// to the default FLEXNetworkRecorder instance which maintains the request
/// history and caches response bodies.
@interface FLEXNetworkObserver : NSObject

+ (void)start;

@end
