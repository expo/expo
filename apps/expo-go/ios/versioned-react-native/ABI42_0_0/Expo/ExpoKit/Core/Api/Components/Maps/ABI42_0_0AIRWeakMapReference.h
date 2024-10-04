/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import "ABI42_0_0AIRMap.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0AIRWeakMapReference : NSObject

@property (nonatomic, weak) ABI42_0_0AIRMap *mapView;

- (instancetype)initWithMapView:(ABI42_0_0AIRMap *)mapView;


@end

NS_ASSUME_NONNULL_END
