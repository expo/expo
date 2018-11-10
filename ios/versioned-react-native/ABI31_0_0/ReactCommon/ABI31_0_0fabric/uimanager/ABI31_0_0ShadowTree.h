// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>

#include <ABI31_0_0fabric/ABI31_0_0components/root/RootShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutConstraints.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ReactABI31_0_0Primitives.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0uimanager/ShadowTreeDelegate.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ShadowTree;

using SharedShadowTree = std::shared_ptr<ShadowTree>;

/*
 * Represents the shadow tree and its lifecycle.
 */
class ShadowTree final:
  public std::enable_shared_from_this<ShadowTree> {

public:

  /*
   * Creates a new shadow tree instance with given `rootTag`.
   */
  ShadowTree(Tag rootTag);

  /*
   * Returns the rootTag associated with the shadow tree (the tag of the
   * root shadow node).
   */
  Tag getRootTag() const;

#pragma mark - Layout

  /*
   * Measures the shadow tree with given `layoutConstraints` and `layoutContext`.
   * Can be called from any thread, side-effect-less.
   */
  Size measure(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const;

  /*
   * Applies given `layoutConstraints` and `layoutContext` and commit
   * the new shadow tree.
   * Can be called from any thread.
   */
  void constraintLayout(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext);

#pragma mark - Application

  /*
   * Create a new shadow tree with given `rootChildNodes` and commit.
   * Can be called from any thread.
   */
  void complete(const SharedShadowNodeUnsharedList &rootChildNodes);

#pragma mark - Delegate

  /*
   * Sets and gets the delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(ShadowTreeDelegate *delegate);
  ShadowTreeDelegate *getDelegate() const;

private:

  UnsharedRootShadowNode cloneRootShadowNode(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const;
  void complete(UnsharedRootShadowNode newRootShadowNode);
  bool commit(const SharedRootShadowNode &oldRootShadowNode, const SharedRootShadowNode &newRootShadowNode);
  void emitLayoutEvents(const TreeMutationInstructionList &instructions);

  const Tag rootTag_;
  SharedRootShadowNode rootShadowNode_;
  ShadowTreeDelegate *delegate_;
  mutable std::mutex commitMutex_;
};

} // namespace ReactABI31_0_0
} // namespace facebook
