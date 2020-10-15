/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import <FlipperKitNetworkPlugin/SKNetworkReporter.h>
#import <Foundation/Foundation.h>

@interface SKIOSNetworkAdapter : NSObject<SKNetworkAdapterDelegate>
- (instancetype)init NS_DESIGNATED_INITIALIZER;
@property(weak, nonatomic) id<SKNetworkReporterDelegate> delegate;

@end

#endif
