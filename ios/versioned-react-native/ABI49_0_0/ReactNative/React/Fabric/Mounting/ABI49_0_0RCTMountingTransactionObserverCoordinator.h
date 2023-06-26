/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTComponentViewDescriptor.h>
#import "ABI49_0_0RCTMountingTransactionObserverCoordinator.h"

#import <ABI49_0_0butter/ABI49_0_0map.h>
#import <ABI49_0_0butter/ABI49_0_0set.h>

#include <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingTransaction.h>

class ABI49_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI49_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI49_0_0facebook::ABI49_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI49_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI49_0_0facebook::ABI49_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI49_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI49_0_0facebook::ABI49_0_0React::MountingTransaction const &transaction,
      ABI49_0_0facebook::ABI49_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;
  void notifyObserversMountingTransactionDidMount(
      ABI49_0_0facebook::ABI49_0_0React::MountingTransaction const &transaction,
      ABI49_0_0facebook::ABI49_0_0React::SurfaceTelemetry const &surfaceTelemetry) const;

 private:
  ABI49_0_0facebook::butter::map<
      ABI49_0_0facebook::ABI49_0_0React::SurfaceId,
      ABI49_0_0facebook::butter::set<ABI49_0_0RCTComponentViewDescriptor>>
      registry_;
};
