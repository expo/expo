/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTComponentViewDescriptor.h>
#import "ABI42_0_0RCTMountingTransactionObserverCoordinator.h"

#import <better/map.h>
#import <better/set.h>

#import <ABI42_0_0React/mounting/MountingTransactionMetadata.h>

class ABI42_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI42_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI42_0_0facebook::ABI42_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI42_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI42_0_0facebook::ABI42_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI42_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI42_0_0facebook::ABI42_0_0React::MountingTransactionMetadata const &metadata) const;
  void notifyObserversMountingTransactionDidMount(
      ABI42_0_0facebook::ABI42_0_0React::MountingTransactionMetadata const &metadata) const;

 private:
  ABI42_0_0facebook::better::map<
      ABI42_0_0facebook::ABI42_0_0React::SurfaceId,
      ABI42_0_0facebook::better::set<ABI42_0_0RCTComponentViewDescriptor>>
      registry_;
};
