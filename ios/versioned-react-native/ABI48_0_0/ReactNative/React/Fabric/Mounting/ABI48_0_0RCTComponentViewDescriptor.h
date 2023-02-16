/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Holds a native view instance and a set of attributes associated with it.
 * Mounting infrastructure uses these objects to bookkeep views and cache their
 * attributes for efficient access.
 */
class ABI48_0_0RCTComponentViewDescriptor final {
 public:
  /*
   * Associated (and owned) native view instance.
   */
  __strong UIView<ABI48_0_0RCTComponentViewProtocol> *view = nil;

  /*
   * Indicates a requirement to call on the view methods from
   * `ABI48_0_0RCTMountingTransactionObserving` protocol.
   */
  bool observesMountingTransactionWillMount{false};
  bool observesMountingTransactionDidMount{false};
};

inline bool operator==(ABI48_0_0RCTComponentViewDescriptor const &lhs, ABI48_0_0RCTComponentViewDescriptor const &rhs)
{
  return lhs.view == rhs.view;
}

inline bool operator!=(ABI48_0_0RCTComponentViewDescriptor const &lhs, ABI48_0_0RCTComponentViewDescriptor const &rhs)
{
  return lhs.view != rhs.view;
}

template <>
struct std::hash<ABI48_0_0RCTComponentViewDescriptor> {
  size_t operator()(ABI48_0_0RCTComponentViewDescriptor const &componentViewDescriptor) const
  {
    return std::hash<void *>()((__bridge void *)componentViewDescriptor.view);
  }
};

NS_ASSUME_NONNULL_END
