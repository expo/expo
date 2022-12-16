/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTComponentViewDescriptor.h>
#import "ABI46_0_0RCTMountingTransactionObserverCoordinator.h"

#import <butter/map.h>
#import <butter/set.h>

#include <ABI46_0_0React/ABI46_0_0renderer/mounting/MountingTransaction.h>

class ABI46_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI46_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI46_0_0facebook::ABI46_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI46_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI46_0_0facebook::ABI46_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI46_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI46_0_0facebook::ABI46_0_0React::MountingTransaction const &transaction,
      ABI46_0_0facebook::ABI46_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;
  void notifyObserversMountingTransactionDidMount(
      ABI46_0_0facebook::ABI46_0_0React::MountingTransaction const &transaction,
      ABI46_0_0facebook::ABI46_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;

 private:
  ABI46_0_0facebook::butter::map<
      ABI46_0_0facebook::ABI46_0_0React::SurfaceId,
      ABI46_0_0facebook::butter::set<ABI46_0_0RCTComponentViewDescriptor>>
      registry_;
};
