/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTComponentViewDescriptor.h>
#import "ABI48_0_0RCTMountingTransactionObserverCoordinator.h"

#import <ABI48_0_0butter/ABI48_0_0map.h>
#import <ABI48_0_0butter/ABI48_0_0set.h>

#include <ABI48_0_0React/ABI48_0_0renderer/mounting/MountingTransaction.h>

class ABI48_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI48_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI48_0_0facebook::ABI48_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI48_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI48_0_0facebook::ABI48_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI48_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI48_0_0facebook::ABI48_0_0React::MountingTransaction const &transaction,
      ABI48_0_0facebook::ABI48_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;
  void notifyObserversMountingTransactionDidMount(
      ABI48_0_0facebook::ABI48_0_0React::MountingTransaction const &transaction,
      ABI48_0_0facebook::ABI48_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;

 private:
  ABI48_0_0facebook::butter::map<
      ABI48_0_0facebook::ABI48_0_0React::SurfaceId,
      ABI48_0_0facebook::butter::set<ABI48_0_0RCTComponentViewDescriptor>>
      registry_;
};
