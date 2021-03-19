/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTComponentViewDescriptor.h>
#import "ABI41_0_0RCTMountingTransactionObserverCoordinator.h"

#import <better/map.h>
#import <better/set.h>

#import <ABI41_0_0React/mounting/MountingTransactionMetadata.h>

class ABI41_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI41_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI41_0_0facebook::ABI41_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI41_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI41_0_0facebook::ABI41_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI41_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI41_0_0facebook::ABI41_0_0React::MountingTransactionMetadata const &metadata) const;
  void notifyObserversMountingTransactionDidMount(
      ABI41_0_0facebook::ABI41_0_0React::MountingTransactionMetadata const &metadata) const;

 private:
  ABI41_0_0facebook::better::map<
      ABI41_0_0facebook::ABI41_0_0React::SurfaceId,
      ABI41_0_0facebook::better::set<ABI41_0_0RCTComponentViewDescriptor>>
      registry_;
};
