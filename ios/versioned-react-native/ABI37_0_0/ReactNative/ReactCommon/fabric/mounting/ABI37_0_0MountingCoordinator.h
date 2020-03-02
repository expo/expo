/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>

#include <ABI37_0_0React/mounting/MountingTransaction.h>
#include <ABI37_0_0React/mounting/ShadowTreeRevision.h>

#ifdef ABI37_0_0RN_SHADOW_TREE_INTROSPECTION
#include <ABI37_0_0React/mounting/stubs.h>
#endif

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

/*
 * Stores inside all non-mounted yet revisions of a shadow tree and coordinates
 * mounting. The object stores the most recent mounted revision and the most
 * recent committed one. Then when a new mounting transaction is requested the
 * object generates mutation instructions and returns it as a
 * `MountingTransaction`.
 */
class MountingCoordinator final {
 public:
  using Shared = std::shared_ptr<MountingCoordinator const>;

  /*
   * The constructor is ment to be used only inside `ShadowTree`, and it's
   * `public` only to enable using with `std::make_shared<>`.
   */
  MountingCoordinator(ShadowTreeRevision baseRevision);

  /*
   * Returns the id of the surface that the coordinator belongs to.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Computes a consequent mounting transaction and returns it.
   * The returning transaction can accumulate multiple recent revisions of a
   * shadow tree. Returns empty optional if there no new shadow tree revision to
   * mount.
   * The method is thread-safe and can be called from any thread.
   * However, a consumer should always call it on the same thread (e.g. on the
   * main thread) or ensure sequentiality of mount transaction separately.
   */
  better::optional<MountingTransaction> pullTransaction() const;

 private:
  friend class ShadowTree;

  /*
   * Methods from this section are meant to be used by `ShadowTree` only.
   */
  void push(ShadowTreeRevision &&revision) const;

 private:
  SurfaceId const surfaceId_;

  mutable std::mutex mutex_;
  mutable ShadowTreeRevision baseRevision_;
  mutable better::optional<ShadowTreeRevision> lastRevision_{};
  mutable MountingTransaction::Number number_{0};

#ifdef ABI37_0_0RN_SHADOW_TREE_INTROSPECTION
  mutable StubViewTree stubViewTree_; // Protected by `mutex_`.
#endif
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
