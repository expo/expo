/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

/*
 A hash function is needed in order to use NSObject classes
 as keys in C++ STL
 */
class SKObjectHash {
 public:
  size_t operator()(const NSObject* x) const {
    return (size_t)[x hash];
  }
};
