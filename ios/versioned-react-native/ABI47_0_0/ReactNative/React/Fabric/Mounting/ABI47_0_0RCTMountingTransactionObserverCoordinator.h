/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTComponentViewDescriptor.h>
#import "ABI47_0_0RCTMountingTransactionObserverCoordinator.h"

#import <butter/map.h>
#import <butter/set.h>

#include <ABI47_0_0React/ABI47_0_0renderer/mounting/MountingTransaction.h>

class ABI47_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI47_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI47_0_0facebook::ABI47_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI47_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI47_0_0facebook::ABI47_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI47_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI47_0_0facebook::ABI47_0_0React::MountingTransaction const &transaction,
      ABI47_0_0facebook::ABI47_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;
  void notifyObserversMountingTransactionDidMount(
      ABI47_0_0facebook::ABI47_0_0React::MountingTransaction const &transaction,
      ABI47_0_0facebook::ABI47_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;

 private:
  ABI47_0_0facebook::butter::map<
      ABI47_0_0facebook::ABI47_0_0React::SurfaceId,
      ABI47_0_0facebook::butter::set<ABI47_0_0RCTComponentViewDescriptor>>
      registry_;
};
