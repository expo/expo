/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

/**
 * This class provides a collection of conversion functions for mapping
 * JSON objects to cxx types. Extensible via categories.
 * Convert methods are expected to return cxx objects wrapped in ABI49_0_0RCTManagedPointer.
 */

@interface ABI49_0_0RCTCxxConvert : NSObject

@end
