/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTComponentViewDescriptor.h>
#import "ABI40_0_0RCTMountingTransactionObserverCoordinator.h"

#import <better/map.h>
#import <better/set.h>

#import <ABI40_0_0React/mounting/MountingTransactionMetadata.h>

class ABI40_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI40_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI40_0_0facebook::ABI40_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI40_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI40_0_0facebook::ABI40_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI40_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI40_0_0facebook::ABI40_0_0React::MountingTransactionMetadata const &metadata) const;
  void notifyObserversMountingTransactionDidMount(
      ABI40_0_0facebook::ABI40_0_0React::MountingTransactionMetadata const &metadata) const;

 private:
  ABI40_0_0facebook::better::map<
      ABI40_0_0facebook::ABI40_0_0React::SurfaceId,
      ABI40_0_0facebook::better::set<ABI40_0_0RCTComponentViewDescriptor>>
      registry_;
};
