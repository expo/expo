/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTComponentViewDescriptor.h>
#import "ABI43_0_0RCTMountingTransactionObserverCoordinator.h"

#import <better/map.h>
#import <better/set.h>

#import <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingTransactionMetadata.h>

class ABI43_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI43_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI43_0_0facebook::ABI43_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI43_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI43_0_0facebook::ABI43_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI43_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI43_0_0facebook::ABI43_0_0React::MountingTransactionMetadata const &metadata) const;
  void notifyObserversMountingTransactionDidMount(
      ABI43_0_0facebook::ABI43_0_0React::MountingTransactionMetadata const &metadata) const;

 private:
  ABI43_0_0facebook::better::map<
      ABI43_0_0facebook::ABI43_0_0React::SurfaceId,
      ABI43_0_0facebook::better::set<ABI43_0_0RCTComponentViewDescriptor>>
      registry_;
};
