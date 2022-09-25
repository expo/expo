/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTComponentViewDescriptor.h>
#import "ABI45_0_0RCTMountingTransactionObserverCoordinator.h"

#import <butter/map.h>
#import <butter/set.h>

#import <ABI45_0_0React/ABI45_0_0renderer/mounting/MountingTransactionMetadata.h>

class ABI45_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI45_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI45_0_0facebook::ABI45_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI45_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI45_0_0facebook::ABI45_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI45_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI45_0_0facebook::ABI45_0_0React::MountingTransactionMetadata const &metadata) const;
  void notifyObserversMountingTransactionDidMount(
      ABI45_0_0facebook::ABI45_0_0React::MountingTransactionMetadata const &metadata) const;

 private:
  ABI45_0_0facebook::butter::map<
      ABI45_0_0facebook::ABI45_0_0React::SurfaceId,
      ABI45_0_0facebook::butter::set<ABI45_0_0RCTComponentViewDescriptor>>
      registry_;
};
