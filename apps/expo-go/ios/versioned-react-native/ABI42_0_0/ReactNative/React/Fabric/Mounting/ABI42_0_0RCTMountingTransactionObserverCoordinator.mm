/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTMountingTransactionObserverCoordinator.h"

#import "ABI42_0_0RCTMountingTransactionObserving.h"

using namespace ABI42_0_0facebook::ABI42_0_0React;

void ABI42_0_0RCTMountingTransactionObserverCoordinator::registerViewComponentDescriptor(
    ABI42_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
    SurfaceId surfaceId)
{
  if (!componentViewDescriptor.observesMountingTransactionWillMount &&
      !componentViewDescriptor.observesMountingTransactionDidMount) {
    return;
  }

  auto &surfaceRegistry = registry_[surfaceId];
  assert(surfaceRegistry.count(componentViewDescriptor) == 0);
  surfaceRegistry.insert(componentViewDescriptor);
}

void ABI42_0_0RCTMountingTransactionObserverCoordinator::unregisterViewComponentDescriptor(
    ABI42_0_0RCTComponentViewDescriptor const &componentViewDescriptor,
    SurfaceId surfaceId)
{
  if (!componentViewDescriptor.observesMountingTransactionWillMount &&
      !componentViewDescriptor.observesMountingTransactionDidMount) {
    return;
  }

  auto &surfaceRegistry = registry_[surfaceId];
  assert(surfaceRegistry.count(componentViewDescriptor) == 1);
  surfaceRegistry.erase(componentViewDescriptor);
}

void ABI42_0_0RCTMountingTransactionObserverCoordinator::notifyObserversMountingTransactionWillMount(
    MountingTransactionMetadata const &metadata) const
{
  auto surfaceId = metadata.surfaceId;
  auto surfaceRegistryIterator = registry_.find(surfaceId);
  if (surfaceRegistryIterator == registry_.end()) {
    return;
  }
  auto &surfaceRegistry = surfaceRegistryIterator->second;
  for (auto const &componentViewDescriptor : surfaceRegistry) {
    if (componentViewDescriptor.observesMountingTransactionWillMount) {
      [(id<ABI42_0_0RCTMountingTransactionObserving>)componentViewDescriptor.view
          mountingTransactionWillMountWithMetadata:metadata];
    }
  }
}

void ABI42_0_0RCTMountingTransactionObserverCoordinator::notifyObserversMountingTransactionDidMount(
    MountingTransactionMetadata const &metadata) const
{
  auto surfaceId = metadata.surfaceId;
  auto surfaceRegistryIterator = registry_.find(surfaceId);
  if (surfaceRegistryIterator == registry_.end()) {
    return;
  }
  auto &surfaceRegistry = surfaceRegistryIterator->second;
  for (auto const &componentViewDescriptor : surfaceRegistry) {
    if (componentViewDescriptor.observesMountingTransactionDidMount) {
      [(id<ABI42_0_0RCTMountingTransactionObserving>)componentViewDescriptor.view
          mountingTransactionDidMountWithMetadata:metadata];
    }
  }
}
