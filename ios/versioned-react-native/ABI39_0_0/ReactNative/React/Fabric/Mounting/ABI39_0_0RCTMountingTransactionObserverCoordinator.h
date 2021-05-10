/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTComponentViewDescriptor.h>
#import "ABI39_0_0RCTMountingTransactionObserverCoordinator.h"

#import <better/map.h>
#import <better/set.h>

#import <ABI39_0_0React/mounting/MountingTransactionMetadata.h>

class ABI39_0_0RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      ABI39_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI39_0_0facebook::ABI39_0_0React::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      ABI39_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
      ABI39_0_0facebook::ABI39_0_0React::SurfaceId surfaceId);

  /*
   * To be called from `ABI39_0_0RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      ABI39_0_0facebook::ABI39_0_0React::MountingTransactionMetadata const &metadata) const;
  void notifyObserversMountingTransactionDidMount(
      ABI39_0_0facebook::ABI39_0_0React::MountingTransactionMetadata const &metadata) const;

 private:
  ABI39_0_0facebook::better::map<
      ABI39_0_0facebook::ABI39_0_0React::SurfaceId,
      ABI39_0_0facebook::better::set<ABI39_0_0RCTComponentViewDescriptor>>
      registry_;
};
