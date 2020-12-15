/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "SKRequestInfo.h"
#import "SKResponseInfo.h"

@protocol SKNetworkReporterDelegate

- (void)didObserveRequest:(SKRequestInfo*)request;
- (void)didObserveResponse:(SKResponseInfo*)response;

@end

@protocol SKNetworkAdapterDelegate

@property(weak, nonatomic) id<SKNetworkReporterDelegate> delegate;

@end
