/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0Yoga.h"
#include "ABI43_0_0log.h"
#include <float.h>
#include <string.h>
#include <algorithm>
#include <atomic>
#include <memory>
#include "ABI43_0_0Utils.h"
#include "ABI43_0_0YGNode.h"
#include "ABI43_0_0YGNodePrint.h"
#include "ABI43_0_0Yoga-internal.h"
#include "event/ABI43_0_0event.h"
#ifdef _MSC_VER
#include <float.h>

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
#endif
#endif

using namespace ABI43_0_0facebook::yoga;
using detail::Log;

#ifdef ANDROID
static int ABI43_0_0YGAndroidLog(
    const ABI43_0_0YGConfigRef config,
    const ABI43_0_0YGNodeRef node,
    ABI43_0_0YGLogLevel level,
    const char* format,
    va_list args);
#else
static int ABI43_0_0YGDefaultLog(
    const ABI43_0_0YGConfigRef config,
    const ABI43_0_0YGNodeRef node,
    ABI43_0_0YGLogLevel level,
    const char* format,
    va_list args);
#endif

#ifdef ANDROID
#include <android/log.h>
static int ABI43_0_0YGAndroidLog(
    const ABI43_0_0YGConfigRef config,
    const ABI43_0_0YGNodeRef node,
    ABI43_0_0YGLogLevel level,
    const char* format,
    va_list args) {
  int androidLevel = ABI43_0_0YGLogLevelDebug;
  switch (level) {
    case ABI43_0_0YGLogLevelFatal:
      androidLevel = ANDROID_LOG_FATAL;
      break;
    case ABI43_0_0YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case ABI43_0_0YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case ABI43_0_0YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case ABI43_0_0YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case ABI43_0_0YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
  }
  const int result = __android_log_vprint(androidLevel, "yoga", format, args);
  return result;
}
#else
#define ABI43_0_0YG_UNUSED(x) (void) (x);

static int ABI43_0_0YGDefaultLog(
    const ABI43_0_0YGConfigRef config,
    const ABI43_0_0YGNodeRef node,
    ABI43_0_0YGLogLevel level,
    const char* format,
    va_list args) {
  ABI43_0_0YG_UNUSED(config);
  ABI43_0_0YG_UNUSED(node);
  switch (level) {
    case ABI43_0_0YGLogLevelError:
    case ABI43_0_0YGLogLevelFatal:
      return vfprintf(stderr, format, args);
    case ABI43_0_0YGLogLevelWarn:
    case ABI43_0_0YGLogLevelInfo:
    case ABI43_0_0YGLogLevelDebug:
    case ABI43_0_0YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}

#undef ABI43_0_0YG_UNUSED
#endif

YOGA_EXPORT bool ABI43_0_0YGFloatIsUndefined(const float value) {
  return ABI43_0_0facebook::yoga::isUndefined(value);
}

detail::CompactValue ABI43_0_0YGComputedEdgeValue(
    const ABI43_0_0YGStyle::Edges& edges,
    ABI43_0_0YGEdge edge,
    detail::CompactValue defaultValue) {
  if (!edges[edge].isUndefined()) {
    return edges[edge];
  }

  if ((edge == ABI43_0_0YGEdgeTop || edge == ABI43_0_0YGEdgeBottom) &&
      !edges[ABI43_0_0YGEdgeVertical].isUndefined()) {
    return edges[ABI43_0_0YGEdgeVertical];
  }

  if ((edge == ABI43_0_0YGEdgeLeft || edge == ABI43_0_0YGEdgeRight || edge == ABI43_0_0YGEdgeStart ||
       edge == ABI43_0_0YGEdgeEnd) &&
      !edges[ABI43_0_0YGEdgeHorizontal].isUndefined()) {
    return edges[ABI43_0_0YGEdgeHorizontal];
  }

  if (!edges[ABI43_0_0YGEdgeAll].isUndefined()) {
    return edges[ABI43_0_0YGEdgeAll];
  }

  if (edge == ABI43_0_0YGEdgeStart || edge == ABI43_0_0YGEdgeEnd) {
    return detail::CompactValue::ofUndefined();
  }

  return defaultValue;
}

YOGA_EXPORT void* ABI43_0_0YGNodeGetContext(ABI43_0_0YGNodeRef node) {
  return node->getContext();
}

YOGA_EXPORT void ABI43_0_0YGNodeSetContext(ABI43_0_0YGNodeRef node, void* context) {
  return node->setContext(context);
}

YOGA_EXPORT bool ABI43_0_0YGNodeHasMeasureFunc(ABI43_0_0YGNodeRef node) {
  return node->hasMeasureFunc();
}

YOGA_EXPORT void ABI43_0_0YGNodeSetMeasureFunc(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGMeasureFunc measureFunc) {
  node->setMeasureFunc(measureFunc);
}

YOGA_EXPORT bool ABI43_0_0YGNodeHasBaselineFunc(ABI43_0_0YGNodeRef node) {
  return node->hasBaselineFunc();
}

YOGA_EXPORT void ABI43_0_0YGNodeSetBaselineFunc(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGBaselineFunc baselineFunc) {
  node->setBaselineFunc(baselineFunc);
}

YOGA_EXPORT ABI43_0_0YGDirtiedFunc ABI43_0_0YGNodeGetDirtiedFunc(ABI43_0_0YGNodeRef node) {
  return node->getDirtied();
}

YOGA_EXPORT void ABI43_0_0YGNodeSetDirtiedFunc(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGDirtiedFunc dirtiedFunc) {
  node->setDirtiedFunc(dirtiedFunc);
}

YOGA_EXPORT void ABI43_0_0YGNodeSetPrintFunc(ABI43_0_0YGNodeRef node, ABI43_0_0YGPrintFunc printFunc) {
  node->setPrintFunc(printFunc);
}

YOGA_EXPORT bool ABI43_0_0YGNodeGetHasNewLayout(ABI43_0_0YGNodeRef node) {
  return node->getHasNewLayout();
}

YOGA_EXPORT void ABI43_0_0YGConfigSetPrintTreeFlag(ABI43_0_0YGConfigRef config, bool enabled) {
  config->printTree = enabled;
}

YOGA_EXPORT void ABI43_0_0YGNodeSetHasNewLayout(ABI43_0_0YGNodeRef node, bool hasNewLayout) {
  node->setHasNewLayout(hasNewLayout);
}

YOGA_EXPORT ABI43_0_0YGNodeType ABI43_0_0YGNodeGetNodeType(ABI43_0_0YGNodeRef node) {
  return node->getNodeType();
}

YOGA_EXPORT void ABI43_0_0YGNodeSetNodeType(ABI43_0_0YGNodeRef node, ABI43_0_0YGNodeType nodeType) {
  return node->setNodeType(nodeType);
}

YOGA_EXPORT bool ABI43_0_0YGNodeIsDirty(ABI43_0_0YGNodeRef node) {
  return node->isDirty();
}

YOGA_EXPORT bool ABI43_0_0YGNodeLayoutGetDidUseLegacyFlag(const ABI43_0_0YGNodeRef node) {
  return node->didUseLegacyFlag();
}

YOGA_EXPORT void ABI43_0_0YGNodeMarkDirtyAndPropogateToDescendants(
    const ABI43_0_0YGNodeRef node) {
  return node->markDirtyAndPropogateDownwards();
}

int32_t gConfigInstanceCount = 0;

YOGA_EXPORT WIN_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeNewWithConfig(const ABI43_0_0YGConfigRef config) {
  const ABI43_0_0YGNodeRef node = new ABI43_0_0YGNode{config};
  ABI43_0_0YGAssertWithConfig(
      config, node != nullptr, "Could not allocate memory for node");
  Event::publish<Event::NodeAllocation>(node, {config});

  return node;
}

YOGA_EXPORT ABI43_0_0YGConfigRef ABI43_0_0YGConfigGetDefault() {
  static ABI43_0_0YGConfigRef defaultConfig = ABI43_0_0YGConfigNew();
  return defaultConfig;
}

YOGA_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeNew(void) {
  return ABI43_0_0YGNodeNewWithConfig(ABI43_0_0YGConfigGetDefault());
}

YOGA_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeClone(ABI43_0_0YGNodeRef oldNode) {
  ABI43_0_0YGNodeRef node = new ABI43_0_0YGNode(*oldNode);
  ABI43_0_0YGAssertWithConfig(
      oldNode->getConfig(),
      node != nullptr,
      "Could not allocate memory for node");
  Event::publish<Event::NodeAllocation>(node, {node->getConfig()});
  node->setOwner(nullptr);
  return node;
}

static ABI43_0_0YGConfigRef ABI43_0_0YGConfigClone(const ABI43_0_0YGConfig& oldConfig) {
  const ABI43_0_0YGConfigRef config = new ABI43_0_0YGConfig(oldConfig);
  ABI43_0_0YGAssert(config != nullptr, "Could not allocate memory for config");
  gConfigInstanceCount++;
  return config;
}

static ABI43_0_0YGNodeRef ABI43_0_0YGNodeDeepClone(ABI43_0_0YGNodeRef oldNode) {
  auto config = ABI43_0_0YGConfigClone(*oldNode->getConfig());
  auto node = new ABI43_0_0YGNode{*oldNode, config};
  node->setOwner(nullptr);
  Event::publish<Event::NodeAllocation>(node, {node->getConfig()});

  ABI43_0_0YGVector vec = ABI43_0_0YGVector();
  vec.reserve(oldNode->getChildren().size());
  ABI43_0_0YGNodeRef childNode = nullptr;
  for (auto* item : oldNode->getChildren()) {
    childNode = ABI43_0_0YGNodeDeepClone(item);
    childNode->setOwner(node);
    vec.push_back(childNode);
  }
  node->setChildren(vec);

  return node;
}

YOGA_EXPORT void ABI43_0_0YGNodeFree(const ABI43_0_0YGNodeRef node) {
  if (ABI43_0_0YGNodeRef owner = node->getOwner()) {
    owner->removeChild(node);
    node->setOwner(nullptr);
  }

  const uint32_t childCount = ABI43_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI43_0_0YGNodeRef child = ABI43_0_0YGNodeGetChild(node, i);
    child->setOwner(nullptr);
  }

  node->clearChildren();
  Event::publish<Event::NodeDeallocation>(node, {node->getConfig()});
  delete node;
}

static void ABI43_0_0YGConfigFreeRecursive(const ABI43_0_0YGNodeRef root) {
  if (root->getConfig() != nullptr) {
    gConfigInstanceCount--;
    delete root->getConfig();
  }
  // Delete configs recursively for childrens
  for (auto* child : root->getChildren()) {
    ABI43_0_0YGConfigFreeRecursive(child);
  }
}

YOGA_EXPORT void ABI43_0_0YGNodeFreeRecursiveWithCleanupFunc(
    const ABI43_0_0YGNodeRef root,
    ABI43_0_0YGNodeCleanupFunc cleanup) {
  uint32_t skipped = 0;
  while (ABI43_0_0YGNodeGetChildCount(root) > skipped) {
    const ABI43_0_0YGNodeRef child = ABI43_0_0YGNodeGetChild(root, skipped);
    if (child->getOwner() != root) {
      // Don't free shared nodes that we don't own.
      skipped += 1;
    } else {
      ABI43_0_0YGNodeRemoveChild(root, child);
      ABI43_0_0YGNodeFreeRecursive(child);
    }
  }
  if (cleanup != nullptr) {
    cleanup(root);
  }
  ABI43_0_0YGNodeFree(root);
}

YOGA_EXPORT void ABI43_0_0YGNodeFreeRecursive(const ABI43_0_0YGNodeRef root) {
  return ABI43_0_0YGNodeFreeRecursiveWithCleanupFunc(root, nullptr);
}

YOGA_EXPORT void ABI43_0_0YGNodeReset(ABI43_0_0YGNodeRef node) {
  node->reset();
}

int32_t ABI43_0_0YGConfigGetInstanceCount(void) {
  return gConfigInstanceCount;
}

YOGA_EXPORT ABI43_0_0YGConfigRef ABI43_0_0YGConfigNew(void) {
#ifdef ANDROID
  const ABI43_0_0YGConfigRef config = new ABI43_0_0YGConfig(ABI43_0_0YGAndroidLog);
#else
  const ABI43_0_0YGConfigRef config = new ABI43_0_0YGConfig(ABI43_0_0YGDefaultLog);
#endif
  gConfigInstanceCount++;
  return config;
}

YOGA_EXPORT void ABI43_0_0YGConfigFree(const ABI43_0_0YGConfigRef config) {
  delete config;
  gConfigInstanceCount--;
}

void ABI43_0_0YGConfigCopy(const ABI43_0_0YGConfigRef dest, const ABI43_0_0YGConfigRef src) {
  memcpy(dest, src, sizeof(ABI43_0_0YGConfig));
}

YOGA_EXPORT void ABI43_0_0YGNodeSetIsReferenceBaseline(
    ABI43_0_0YGNodeRef node,
    bool isReferenceBaseline) {
  if (node->isReferenceBaseline() != isReferenceBaseline) {
    node->setIsReferenceBaseline(isReferenceBaseline);
    node->markDirtyAndPropogate();
  }
}

YOGA_EXPORT bool ABI43_0_0YGNodeIsReferenceBaseline(ABI43_0_0YGNodeRef node) {
  return node->isReferenceBaseline();
}

YOGA_EXPORT void ABI43_0_0YGNodeInsertChild(
    const ABI43_0_0YGNodeRef owner,
    const ABI43_0_0YGNodeRef child,
    const uint32_t index) {
  ABI43_0_0YGAssertWithNode(
      owner,
      child->getOwner() == nullptr,
      "Child already has a owner, it must be removed first.");

  ABI43_0_0YGAssertWithNode(
      owner,
      !owner->hasMeasureFunc(),
      "Cannot add child: Nodes with measure functions cannot have children.");

  owner->insertChild(child, index);
  child->setOwner(owner);
  owner->markDirtyAndPropogate();
}

YOGA_EXPORT void ABI43_0_0YGNodeSwapChild(
    const ABI43_0_0YGNodeRef owner,
    const ABI43_0_0YGNodeRef child,
    const uint32_t index) {
  owner->replaceChild(child, index);
  child->setOwner(owner);
}

YOGA_EXPORT void ABI43_0_0YGNodeRemoveChild(
    const ABI43_0_0YGNodeRef owner,
    const ABI43_0_0YGNodeRef excludedChild) {
  if (ABI43_0_0YGNodeGetChildCount(owner) == 0) {
    // This is an empty set. Nothing to remove.
    return;
  }

  // Children may be shared between parents, which is indicated by not having an
  // owner. We only want to reset the child completely if it is owned
  // exclusively by one node.
  auto childOwner = excludedChild->getOwner();
  if (owner->removeChild(excludedChild)) {
    if (owner == childOwner) {
      excludedChild->setLayout({}); // layout is no longer valid
      excludedChild->setOwner(nullptr);
    }
    owner->markDirtyAndPropogate();
  }
}

YOGA_EXPORT void ABI43_0_0YGNodeRemoveAllChildren(const ABI43_0_0YGNodeRef owner) {
  const uint32_t childCount = ABI43_0_0YGNodeGetChildCount(owner);
  if (childCount == 0) {
    // This is an empty set already. Nothing to do.
    return;
  }
  const ABI43_0_0YGNodeRef firstChild = ABI43_0_0YGNodeGetChild(owner, 0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that this child
    // set is unique.
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI43_0_0YGNodeRef oldChild = ABI43_0_0YGNodeGetChild(owner, i);
      oldChild->setLayout(ABI43_0_0YGNode().getLayout()); // layout is no longer valid
      oldChild->setOwner(nullptr);
    }
    owner->clearChildren();
    owner->markDirtyAndPropogate();
    return;
  }
  // Otherwise, we are not the owner of the child set. We don't have to do
  // anything to clear it.
  owner->setChildren(ABI43_0_0YGVector());
  owner->markDirtyAndPropogate();
}

static void ABI43_0_0YGNodeSetChildrenInternal(
    ABI43_0_0YGNodeRef const owner,
    const std::vector<ABI43_0_0YGNodeRef>& children) {
  if (!owner) {
    return;
  }
  if (children.size() == 0) {
    if (ABI43_0_0YGNodeGetChildCount(owner) > 0) {
      for (ABI43_0_0YGNodeRef const child : owner->getChildren()) {
        child->setLayout(ABI43_0_0YGLayout());
        child->setOwner(nullptr);
      }
      owner->setChildren(ABI43_0_0YGVector());
      owner->markDirtyAndPropogate();
    }
  } else {
    if (ABI43_0_0YGNodeGetChildCount(owner) > 0) {
      for (ABI43_0_0YGNodeRef const oldChild : owner->getChildren()) {
        // Our new children may have nodes in common with the old children. We
        // don't reset these common nodes.
        if (std::find(children.begin(), children.end(), oldChild) ==
            children.end()) {
          oldChild->setLayout(ABI43_0_0YGLayout());
          oldChild->setOwner(nullptr);
        }
      }
    }
    owner->setChildren(children);
    for (ABI43_0_0YGNodeRef child : children) {
      child->setOwner(owner);
    }
    owner->markDirtyAndPropogate();
  }
}

YOGA_EXPORT void ABI43_0_0YGNodeSetChildren(
    const ABI43_0_0YGNodeRef owner,
    const ABI43_0_0YGNodeRef c[],
    const uint32_t count) {
  const ABI43_0_0YGVector children = {c, c + count};
  ABI43_0_0YGNodeSetChildrenInternal(owner, children);
}

YOGA_EXPORT void ABI43_0_0YGNodeSetChildren(
    ABI43_0_0YGNodeRef const owner,
    const std::vector<ABI43_0_0YGNodeRef>& children) {
  ABI43_0_0YGNodeSetChildrenInternal(owner, children);
}

YOGA_EXPORT ABI43_0_0YGNodeRef
ABI43_0_0YGNodeGetChild(const ABI43_0_0YGNodeRef node, const uint32_t index) {
  if (index < node->getChildren().size()) {
    return node->getChild(index);
  }
  return nullptr;
}

YOGA_EXPORT uint32_t ABI43_0_0YGNodeGetChildCount(const ABI43_0_0YGNodeRef node) {
  return static_cast<uint32_t>(node->getChildren().size());
}

YOGA_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeGetOwner(const ABI43_0_0YGNodeRef node) {
  return node->getOwner();
}

YOGA_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeGetParent(const ABI43_0_0YGNodeRef node) {
  return node->getOwner();
}

YOGA_EXPORT void ABI43_0_0YGNodeMarkDirty(const ABI43_0_0YGNodeRef node) {
  ABI43_0_0YGAssertWithNode(
      node,
      node->hasMeasureFunc(),
      "Only leaf nodes with custom measure functions"
      "should manually mark themselves as dirty");

  node->markDirtyAndPropogate();
}

YOGA_EXPORT void ABI43_0_0YGNodeCopyStyle(
    const ABI43_0_0YGNodeRef dstNode,
    const ABI43_0_0YGNodeRef srcNode) {
  if (!(dstNode->getStyle() == srcNode->getStyle())) {
    dstNode->setStyle(srcNode->getStyle());
    dstNode->markDirtyAndPropogate();
  }
}

YOGA_EXPORT float ABI43_0_0YGNodeStyleGetFlexGrow(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().flexGrow().isUndefined()
      ? kDefaultFlexGrow
      : node->getStyle().flexGrow().unwrap();
}

YOGA_EXPORT float ABI43_0_0YGNodeStyleGetFlexShrink(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().flexShrink().isUndefined()
      ? (node->getConfig()->useWebDefaults ? kWebDefaultFlexShrink
                                           : kDefaultFlexShrink)
      : node->getStyle().flexShrink().unwrap();
}

namespace {

template <typename T, typename NeedsUpdate, typename Update>
void updateStyle(
    ABI43_0_0YGNode* node,
    T value,
    NeedsUpdate&& needsUpdate,
    Update&& update) {
  if (needsUpdate(node->getStyle(), value)) {
    update(node->getStyle(), value);
    node->markDirtyAndPropogate();
  }
}

template <typename Ref, typename T>
void updateStyle(ABI43_0_0YGNode* node, Ref (ABI43_0_0YGStyle::*prop)(), T value) {
  updateStyle(
      node,
      value,
      [prop](ABI43_0_0YGStyle& s, T x) { return (s.*prop)() != x; },
      [prop](ABI43_0_0YGStyle& s, T x) { (s.*prop)() = x; });
}

template <typename Ref, typename Idx>
void updateIndexedStyleProp(
    ABI43_0_0YGNode* node,
    Ref (ABI43_0_0YGStyle::*prop)(),
    Idx idx,
    detail::CompactValue value) {
  using detail::CompactValue;
  updateStyle(
      node,
      value,
      [idx, prop](ABI43_0_0YGStyle& s, CompactValue x) { return (s.*prop)()[idx] != x; },
      [idx, prop](ABI43_0_0YGStyle& s, CompactValue x) { (s.*prop)()[idx] = x; });
}

} // namespace

// MSVC has trouble inferring the return type of pointer to member functions
// with const and non-const overloads, instead of preferring the non-const
// overload like clang and GCC. For the purposes of updateStyle(), we can help
// MSVC by specifying that return type explicitely. In combination with
// decltype, MSVC will prefer the non-const version.
#define MSVC_HINT(PROP) decltype(ABI43_0_0YGStyle{}.PROP())

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetDirection(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGDirection value) {
  updateStyle<MSVC_HINT(direction)>(node, &ABI43_0_0YGStyle::direction, value);
}
YOGA_EXPORT ABI43_0_0YGDirection ABI43_0_0YGNodeStyleGetDirection(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().direction();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlexDirection(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGFlexDirection flexDirection) {
  updateStyle<MSVC_HINT(flexDirection)>(
      node, &ABI43_0_0YGStyle::flexDirection, flexDirection);
}
YOGA_EXPORT ABI43_0_0YGFlexDirection
ABI43_0_0YGNodeStyleGetFlexDirection(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().flexDirection();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetJustifyContent(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGJustify justifyContent) {
  updateStyle<MSVC_HINT(justifyContent)>(
      node, &ABI43_0_0YGStyle::justifyContent, justifyContent);
}
YOGA_EXPORT ABI43_0_0YGJustify ABI43_0_0YGNodeStyleGetJustifyContent(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().justifyContent();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetAlignContent(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGAlign alignContent) {
  updateStyle<MSVC_HINT(alignContent)>(
      node, &ABI43_0_0YGStyle::alignContent, alignContent);
}
YOGA_EXPORT ABI43_0_0YGAlign ABI43_0_0YGNodeStyleGetAlignContent(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().alignContent();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetAlignItems(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGAlign alignItems) {
  updateStyle<MSVC_HINT(alignItems)>(node, &ABI43_0_0YGStyle::alignItems, alignItems);
}
YOGA_EXPORT ABI43_0_0YGAlign ABI43_0_0YGNodeStyleGetAlignItems(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().alignItems();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetAlignSelf(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGAlign alignSelf) {
  updateStyle<MSVC_HINT(alignSelf)>(node, &ABI43_0_0YGStyle::alignSelf, alignSelf);
}
YOGA_EXPORT ABI43_0_0YGAlign ABI43_0_0YGNodeStyleGetAlignSelf(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().alignSelf();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetPositionType(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGPositionType positionType) {
  updateStyle<MSVC_HINT(positionType)>(
      node, &ABI43_0_0YGStyle::positionType, positionType);
}
YOGA_EXPORT ABI43_0_0YGPositionType
ABI43_0_0YGNodeStyleGetPositionType(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().positionType();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlexWrap(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGWrap flexWrap) {
  updateStyle<MSVC_HINT(flexWrap)>(node, &ABI43_0_0YGStyle::flexWrap, flexWrap);
}
YOGA_EXPORT ABI43_0_0YGWrap ABI43_0_0YGNodeStyleGetFlexWrap(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().flexWrap();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetOverflow(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGOverflow overflow) {
  updateStyle<MSVC_HINT(overflow)>(node, &ABI43_0_0YGStyle::overflow, overflow);
}
YOGA_EXPORT ABI43_0_0YGOverflow ABI43_0_0YGNodeStyleGetOverflow(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().overflow();
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetDisplay(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGDisplay display) {
  updateStyle<MSVC_HINT(display)>(node, &ABI43_0_0YGStyle::display, display);
}
YOGA_EXPORT ABI43_0_0YGDisplay ABI43_0_0YGNodeStyleGetDisplay(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().display();
}

// TODO(T26792433): Change the API to accept ABI43_0_0YGFloatOptional.
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlex(const ABI43_0_0YGNodeRef node, const float flex) {
  updateStyle<MSVC_HINT(flex)>(node, &ABI43_0_0YGStyle::flex, ABI43_0_0YGFloatOptional{flex});
}

// TODO(T26792433): Change the API to accept ABI43_0_0YGFloatOptional.
YOGA_EXPORT float ABI43_0_0YGNodeStyleGetFlex(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().flex().isUndefined()
      ? ABI43_0_0YGUndefined
      : node->getStyle().flex().unwrap();
}

// TODO(T26792433): Change the API to accept ABI43_0_0YGFloatOptional.
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlexGrow(
    const ABI43_0_0YGNodeRef node,
    const float flexGrow) {
  updateStyle<MSVC_HINT(flexGrow)>(
      node, &ABI43_0_0YGStyle::flexGrow, ABI43_0_0YGFloatOptional{flexGrow});
}

// TODO(T26792433): Change the API to accept ABI43_0_0YGFloatOptional.
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlexShrink(
    const ABI43_0_0YGNodeRef node,
    const float flexShrink) {
  updateStyle<MSVC_HINT(flexShrink)>(
      node, &ABI43_0_0YGStyle::flexShrink, ABI43_0_0YGFloatOptional{flexShrink});
}

YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetFlexBasis(const ABI43_0_0YGNodeConstRef node) {
  ABI43_0_0YGValue flexBasis = node->getStyle().flexBasis();
  if (flexBasis.unit == ABI43_0_0YGUnitUndefined || flexBasis.unit == ABI43_0_0YGUnitAuto) {
    // TODO(T26792433): Get rid off the use of ABI43_0_0YGUndefined at client side
    flexBasis.value = ABI43_0_0YGUndefined;
  }
  return flexBasis;
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlexBasis(
    const ABI43_0_0YGNodeRef node,
    const float flexBasis) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(flexBasis);
  updateStyle<MSVC_HINT(flexBasis)>(node, &ABI43_0_0YGStyle::flexBasis, value);
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlexBasisPercent(
    const ABI43_0_0YGNodeRef node,
    const float flexBasisPercent) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(flexBasisPercent);
  updateStyle<MSVC_HINT(flexBasis)>(node, &ABI43_0_0YGStyle::flexBasis, value);
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetFlexBasisAuto(const ABI43_0_0YGNodeRef node) {
  updateStyle<MSVC_HINT(flexBasis)>(
      node, &ABI43_0_0YGStyle::flexBasis, detail::CompactValue::ofAuto());
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetPosition(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float points) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &ABI43_0_0YGStyle::position, edge, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetPositionPercent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &ABI43_0_0YGStyle::position, edge, value);
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetPosition(ABI43_0_0YGNodeConstRef node, ABI43_0_0YGEdge edge) {
  return node->getStyle().position()[edge];
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMargin(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float points) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &ABI43_0_0YGStyle::margin, edge, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMarginPercent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &ABI43_0_0YGStyle::margin, edge, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMarginAuto(ABI43_0_0YGNodeRef node, ABI43_0_0YGEdge edge) {
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &ABI43_0_0YGStyle::margin, edge, detail::CompactValue::ofAuto());
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMargin(ABI43_0_0YGNodeConstRef node, ABI43_0_0YGEdge edge) {
  return node->getStyle().margin()[edge];
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetPadding(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float points) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &ABI43_0_0YGStyle::padding, edge, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetPaddingPercent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &ABI43_0_0YGStyle::padding, edge, value);
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetPadding(ABI43_0_0YGNodeConstRef node, ABI43_0_0YGEdge edge) {
  return node->getStyle().padding()[edge];
}

// TODO(T26792433): Change the API to accept ABI43_0_0YGFloatOptional.
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetBorder(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGEdge edge,
    const float border) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(border);
  updateIndexedStyleProp<MSVC_HINT(border)>(
      node, &ABI43_0_0YGStyle::border, edge, value);
}

YOGA_EXPORT float ABI43_0_0YGNodeStyleGetBorder(
    const ABI43_0_0YGNodeConstRef node,
    const ABI43_0_0YGEdge edge) {
  auto border = node->getStyle().border()[edge];
  if (border.isUndefined() || border.isAuto()) {
    // TODO(T26792433): Rather than returning ABI43_0_0YGUndefined, change the api to
    // return ABI43_0_0YGFloatOptional.
    return ABI43_0_0YGUndefined;
  }

  return static_cast<ABI43_0_0YGValue>(border).value;
}

// Yoga specific properties, not compatible with flexbox specification

// TODO(T26792433): Change the API to accept ABI43_0_0YGFloatOptional.
YOGA_EXPORT float ABI43_0_0YGNodeStyleGetAspectRatio(const ABI43_0_0YGNodeConstRef node) {
  const ABI43_0_0YGFloatOptional op = node->getStyle().aspectRatio();
  return op.isUndefined() ? ABI43_0_0YGUndefined : op.unwrap();
}

// TODO(T26792433): Change the API to accept ABI43_0_0YGFloatOptional.
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetAspectRatio(
    const ABI43_0_0YGNodeRef node,
    const float aspectRatio) {
  updateStyle<MSVC_HINT(aspectRatio)>(
      node, &ABI43_0_0YGStyle::aspectRatio, ABI43_0_0YGFloatOptional{aspectRatio});
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetWidth(ABI43_0_0YGNodeRef node, float points) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI43_0_0YGStyle::dimensions, ABI43_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetWidthPercent(ABI43_0_0YGNodeRef node, float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI43_0_0YGStyle::dimensions, ABI43_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetWidthAuto(ABI43_0_0YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node,
      &ABI43_0_0YGStyle::dimensions,
      ABI43_0_0YGDimensionWidth,
      detail::CompactValue::ofAuto());
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetWidth(ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().dimensions()[ABI43_0_0YGDimensionWidth];
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetHeight(ABI43_0_0YGNodeRef node, float points) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI43_0_0YGStyle::dimensions, ABI43_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetHeightPercent(ABI43_0_0YGNodeRef node, float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI43_0_0YGStyle::dimensions, ABI43_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetHeightAuto(ABI43_0_0YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node,
      &ABI43_0_0YGStyle::dimensions,
      ABI43_0_0YGDimensionHeight,
      detail::CompactValue::ofAuto());
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetHeight(ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().dimensions()[ABI43_0_0YGDimensionHeight];
}

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMinWidth(
    const ABI43_0_0YGNodeRef node,
    const float minWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI43_0_0YGStyle::minDimensions, ABI43_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMinWidthPercent(
    const ABI43_0_0YGNodeRef node,
    const float minWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI43_0_0YGStyle::minDimensions, ABI43_0_0YGDimensionWidth, value);
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMinWidth(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().minDimensions()[ABI43_0_0YGDimensionWidth];
};

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMinHeight(
    const ABI43_0_0YGNodeRef node,
    const float minHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI43_0_0YGStyle::minDimensions, ABI43_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMinHeightPercent(
    const ABI43_0_0YGNodeRef node,
    const float minHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI43_0_0YGStyle::minDimensions, ABI43_0_0YGDimensionHeight, value);
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMinHeight(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().minDimensions()[ABI43_0_0YGDimensionHeight];
};

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMaxWidth(
    const ABI43_0_0YGNodeRef node,
    const float maxWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI43_0_0YGStyle::maxDimensions, ABI43_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMaxWidthPercent(
    const ABI43_0_0YGNodeRef node,
    const float maxWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI43_0_0YGStyle::maxDimensions, ABI43_0_0YGDimensionWidth, value);
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMaxWidth(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().maxDimensions()[ABI43_0_0YGDimensionWidth];
};

YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMaxHeight(
    const ABI43_0_0YGNodeRef node,
    const float maxHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPoint>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI43_0_0YGStyle::maxDimensions, ABI43_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI43_0_0YGNodeStyleSetMaxHeightPercent(
    const ABI43_0_0YGNodeRef node,
    const float maxHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI43_0_0YGUnitPercent>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI43_0_0YGStyle::maxDimensions, ABI43_0_0YGDimensionHeight, value);
}
YOGA_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMaxHeight(const ABI43_0_0YGNodeConstRef node) {
  return node->getStyle().maxDimensions()[ABI43_0_0YGDimensionHeight];
};

#define ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName)   \
  YOGA_EXPORT type ABI43_0_0YGNodeLayoutGet##name(const ABI43_0_0YGNodeRef node) { \
    return node->getLayout().instanceName;                       \
  }

#define ABI43_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName) \
  YOGA_EXPORT type ABI43_0_0YGNodeLayoutGet##name(                               \
      const ABI43_0_0YGNodeRef node, const ABI43_0_0YGEdge edge) {                        \
    ABI43_0_0YGAssertWithNode(                                                   \
        node,                                                           \
        edge <= ABI43_0_0YGEdgeEnd,                                              \
        "Cannot get layout properties of multi-edge shorthands");       \
                                                                        \
    if (edge == ABI43_0_0YGEdgeStart) {                                          \
      if (node->getLayout().direction() == ABI43_0_0YGDirectionRTL) {            \
        return node->getLayout().instanceName[ABI43_0_0YGEdgeRight];             \
      } else {                                                          \
        return node->getLayout().instanceName[ABI43_0_0YGEdgeLeft];              \
      }                                                                 \
    }                                                                   \
                                                                        \
    if (edge == ABI43_0_0YGEdgeEnd) {                                            \
      if (node->getLayout().direction() == ABI43_0_0YGDirectionRTL) {            \
        return node->getLayout().instanceName[ABI43_0_0YGEdgeLeft];              \
      } else {                                                          \
        return node->getLayout().instanceName[ABI43_0_0YGEdgeRight];             \
      }                                                                 \
    }                                                                   \
                                                                        \
    return node->getLayout().instanceName[edge];                        \
  }

ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI43_0_0YGEdgeLeft]);
ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI43_0_0YGEdgeTop]);
ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI43_0_0YGEdgeRight]);
ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI43_0_0YGEdgeBottom]);
ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI43_0_0YGDimensionWidth]);
ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI43_0_0YGDimensionHeight]);
ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(ABI43_0_0YGDirection, Direction, direction());
ABI43_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(bool, HadOverflow, hadOverflow());

ABI43_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
ABI43_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
ABI43_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

YOGA_EXPORT bool ABI43_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(
    const ABI43_0_0YGNodeRef node) {
  return node->getLayout().doesLegacyStretchFlagAffectsLayout();
}

std::atomic<uint32_t> gCurrentGenerationCount(0);

bool ABI43_0_0YGLayoutNodeInternal(
    const ABI43_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI43_0_0YGDirection ownerDirection,
    const ABI43_0_0YGMeasureMode widthMeasureMode,
    const ABI43_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    const ABI43_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount);

#ifdef DEBUG
static void ABI43_0_0YGNodePrintInternal(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGPrintOptions options) {
  std::string str;
  ABI43_0_0facebook::yoga::ABI43_0_0YGNodeToString(str, node, options, 0);
  Log::log(node, ABI43_0_0YGLogLevelDebug, nullptr, str.c_str());
}

YOGA_EXPORT void ABI43_0_0YGNodePrint(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGPrintOptions options) {
  ABI43_0_0YGNodePrintInternal(node, options);
}
#endif

const std::array<ABI43_0_0YGEdge, 4> leading = {
    {ABI43_0_0YGEdgeTop, ABI43_0_0YGEdgeBottom, ABI43_0_0YGEdgeLeft, ABI43_0_0YGEdgeRight}};

const std::array<ABI43_0_0YGEdge, 4> trailing = {
    {ABI43_0_0YGEdgeBottom, ABI43_0_0YGEdgeTop, ABI43_0_0YGEdgeRight, ABI43_0_0YGEdgeLeft}};
static const std::array<ABI43_0_0YGEdge, 4> pos = {{
    ABI43_0_0YGEdgeTop,
    ABI43_0_0YGEdgeBottom,
    ABI43_0_0YGEdgeLeft,
    ABI43_0_0YGEdgeRight,
}};

static const std::array<ABI43_0_0YGDimension, 4> dim = {
    {ABI43_0_0YGDimensionHeight, ABI43_0_0YGDimensionHeight, ABI43_0_0YGDimensionWidth, ABI43_0_0YGDimensionWidth}};

static inline float ABI43_0_0YGNodePaddingAndBorderForAxis(
    const ABI43_0_0YGNodeConstRef node,
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) {
  return (node->getLeadingPaddingAndBorder(axis, widthSize) +
          node->getTrailingPaddingAndBorder(axis, widthSize))
      .unwrap();
}

static inline ABI43_0_0YGAlign ABI43_0_0YGNodeAlignItem(const ABI43_0_0YGNode* node, const ABI43_0_0YGNode* child) {
  const ABI43_0_0YGAlign align = child->getStyle().alignSelf() == ABI43_0_0YGAlignAuto
      ? node->getStyle().alignItems()
      : child->getStyle().alignSelf();
  if (align == ABI43_0_0YGAlignBaseline &&
      ABI43_0_0YGFlexDirectionIsColumn(node->getStyle().flexDirection())) {
    return ABI43_0_0YGAlignFlexStart;
  }
  return align;
}

static float ABI43_0_0YGBaseline(const ABI43_0_0YGNodeRef node, void* layoutContext) {
  if (node->hasBaselineFunc()) {

    Event::publish<Event::NodeBaselineStart>(node);

    const float baseline = node->baseline(
        node->getLayout().measuredDimensions[ABI43_0_0YGDimensionWidth],
        node->getLayout().measuredDimensions[ABI43_0_0YGDimensionHeight],
        layoutContext);

    Event::publish<Event::NodeBaselineEnd>(node);

    ABI43_0_0YGAssertWithNode(
        node,
        !ABI43_0_0YGFloatIsUndefined(baseline),
        "Expect custom baseline function to not return NaN");
    return baseline;
  }

  ABI43_0_0YGNodeRef baselineChild = nullptr;
  const uint32_t childCount = ABI43_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI43_0_0YGNodeRef child = ABI43_0_0YGNodeGetChild(node, i);
    if (child->getLineIndex() > 0) {
      break;
    }
    if (child->getStyle().positionType() == ABI43_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (ABI43_0_0YGNodeAlignItem(node, child) == ABI43_0_0YGAlignBaseline ||
        child->isReferenceBaseline()) {
      baselineChild = child;
      break;
    }

    if (baselineChild == nullptr) {
      baselineChild = child;
    }
  }

  if (baselineChild == nullptr) {
    return node->getLayout().measuredDimensions[ABI43_0_0YGDimensionHeight];
  }

  const float baseline = ABI43_0_0YGBaseline(baselineChild, layoutContext);
  return baseline + baselineChild->getLayout().position[ABI43_0_0YGEdgeTop];
}

static bool ABI43_0_0YGIsBaselineLayout(const ABI43_0_0YGNodeRef node) {
  if (ABI43_0_0YGFlexDirectionIsColumn(node->getStyle().flexDirection())) {
    return false;
  }
  if (node->getStyle().alignItems() == ABI43_0_0YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = ABI43_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI43_0_0YGNodeRef child = ABI43_0_0YGNodeGetChild(node, i);
    if (child->getStyle().positionType() != ABI43_0_0YGPositionTypeAbsolute &&
        child->getStyle().alignSelf() == ABI43_0_0YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float ABI43_0_0YGNodeDimWithMargin(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGFlexDirection axis,
    const float widthSize) {
  return node->getLayout().measuredDimensions[dim[axis]] +
      (node->getLeadingMargin(axis, widthSize) +
       node->getTrailingMargin(axis, widthSize))
          .unwrap();
}

static inline bool ABI43_0_0YGNodeIsStyleDimDefined(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGFlexDirection axis,
    const float ownerSize) {
  bool isUndefined =
      ABI43_0_0YGFloatIsUndefined(node->getResolvedDimension(dim[axis]).value);
  return !(
      node->getResolvedDimension(dim[axis]).unit == ABI43_0_0YGUnitAuto ||
      node->getResolvedDimension(dim[axis]).unit == ABI43_0_0YGUnitUndefined ||
      (node->getResolvedDimension(dim[axis]).unit == ABI43_0_0YGUnitPoint &&
       !isUndefined && node->getResolvedDimension(dim[axis]).value < 0.0f) ||
      (node->getResolvedDimension(dim[axis]).unit == ABI43_0_0YGUnitPercent &&
       !isUndefined &&
       (node->getResolvedDimension(dim[axis]).value < 0.0f ||
        ABI43_0_0YGFloatIsUndefined(ownerSize))));
}

static inline bool ABI43_0_0YGNodeIsLayoutDimDefined(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGFlexDirection axis) {
  const float value = node->getLayout().measuredDimensions[dim[axis]];
  return !ABI43_0_0YGFloatIsUndefined(value) && value >= 0.0f;
}

static ABI43_0_0YGFloatOptional ABI43_0_0YGNodeBoundAxisWithinMinAndMax(
    const ABI43_0_0YGNodeConstRef node,
    const ABI43_0_0YGFlexDirection axis,
    const ABI43_0_0YGFloatOptional value,
    const float axisSize) {
  ABI43_0_0YGFloatOptional min;
  ABI43_0_0YGFloatOptional max;

  if (ABI43_0_0YGFlexDirectionIsColumn(axis)) {
    min = ABI43_0_0YGResolveValue(
        node->getStyle().minDimensions()[ABI43_0_0YGDimensionHeight], axisSize);
    max = ABI43_0_0YGResolveValue(
        node->getStyle().maxDimensions()[ABI43_0_0YGDimensionHeight], axisSize);
  } else if (ABI43_0_0YGFlexDirectionIsRow(axis)) {
    min = ABI43_0_0YGResolveValue(
        node->getStyle().minDimensions()[ABI43_0_0YGDimensionWidth], axisSize);
    max = ABI43_0_0YGResolveValue(
        node->getStyle().maxDimensions()[ABI43_0_0YGDimensionWidth], axisSize);
  }

  if (max >= ABI43_0_0YGFloatOptional{0} && value > max) {
    return max;
  }

  if (min >= ABI43_0_0YGFloatOptional{0} && value < min) {
    return min;
  }

  return value;
}

// Like ABI43_0_0YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't
// go below the padding and border amount.
static inline float ABI43_0_0YGNodeBoundAxis(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGFlexDirection axis,
    const float value,
    const float axisSize,
    const float widthSize) {
  return ABI43_0_0YGFloatMax(
      ABI43_0_0YGNodeBoundAxisWithinMinAndMax(
          node, axis, ABI43_0_0YGFloatOptional{value}, axisSize)
          .unwrap(),
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void ABI43_0_0YGNodeSetChildTrailingPosition(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGNodeRef child,
    const ABI43_0_0YGFlexDirection axis) {
  const float size = child->getLayout().measuredDimensions[dim[axis]];
  child->setLayoutPosition(
      node->getLayout().measuredDimensions[dim[axis]] - size -
          child->getLayout().position[pos[axis]],
      trailing[axis]);
}

static void ABI43_0_0YGConstrainMaxSizeForMode(
    const ABI43_0_0YGNodeConstRef node,
    const enum ABI43_0_0YGFlexDirection axis,
    const float ownerAxisSize,
    const float ownerWidth,
    ABI43_0_0YGMeasureMode* mode,
    float* size) {
  const ABI43_0_0YGFloatOptional maxSize =
      ABI43_0_0YGResolveValue(
          node->getStyle().maxDimensions()[dim[axis]], ownerAxisSize) +
      ABI43_0_0YGFloatOptional(node->getMarginForAxis(axis, ownerWidth));
  switch (*mode) {
    case ABI43_0_0YGMeasureModeExactly:
    case ABI43_0_0YGMeasureModeAtMost:
      *size = (maxSize.isUndefined() || *size < maxSize.unwrap())
          ? *size
          : maxSize.unwrap();
      break;
    case ABI43_0_0YGMeasureModeUndefined:
      if (!maxSize.isUndefined()) {
        *mode = ABI43_0_0YGMeasureModeAtMost;
        *size = maxSize.unwrap();
      }
      break;
  }
}

static void ABI43_0_0YGNodeComputeFlexBasisForChild(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGNodeRef child,
    const float width,
    const ABI43_0_0YGMeasureMode widthMode,
    const float height,
    const float ownerWidth,
    const float ownerHeight,
    const ABI43_0_0YGMeasureMode heightMode,
    const ABI43_0_0YGDirection direction,
    const ABI43_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const ABI43_0_0YGFlexDirection mainAxis =
      ABI43_0_0YGResolveFlexDirection(node->getStyle().flexDirection(), direction);
  const bool isMainAxisRow = ABI43_0_0YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;

  float childWidth;
  float childHeight;
  ABI43_0_0YGMeasureMode childWidthMeasureMode;
  ABI43_0_0YGMeasureMode childHeightMeasureMode;

  const ABI43_0_0YGFloatOptional resolvedFlexBasis =
      ABI43_0_0YGResolveValue(child->resolveFlexBasisPtr(), mainAxisownerSize);
  const bool isRowStyleDimDefined =
      ABI43_0_0YGNodeIsStyleDimDefined(child, ABI43_0_0YGFlexDirectionRow, ownerWidth);
  const bool isColumnStyleDimDefined =
      ABI43_0_0YGNodeIsStyleDimDefined(child, ABI43_0_0YGFlexDirectionColumn, ownerHeight);

  if (!resolvedFlexBasis.isUndefined() && !ABI43_0_0YGFloatIsUndefined(mainAxisSize)) {
    if (child->getLayout().computedFlexBasis.isUndefined() ||
        (ABI43_0_0YGConfigIsExperimentalFeatureEnabled(
             child->getConfig(), ABI43_0_0YGExperimentalFeatureWebFlexBasis) &&
         child->getLayout().computedFlexBasisGeneration != generationCount)) {
      const ABI43_0_0YGFloatOptional paddingAndBorder = ABI43_0_0YGFloatOptional(
          ABI43_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth));
      child->setLayoutComputedFlexBasis(
          ABI43_0_0YGFloatOptionalMax(resolvedFlexBasis, paddingAndBorder));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    const ABI43_0_0YGFloatOptional paddingAndBorder = ABI43_0_0YGFloatOptional(
        ABI43_0_0YGNodePaddingAndBorderForAxis(child, ABI43_0_0YGFlexDirectionRow, ownerWidth));

    child->setLayoutComputedFlexBasis(ABI43_0_0YGFloatOptionalMax(
        ABI43_0_0YGResolveValue(
            child->getResolvedDimensions()[ABI43_0_0YGDimensionWidth], ownerWidth),
        paddingAndBorder));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    const ABI43_0_0YGFloatOptional paddingAndBorder =
        ABI43_0_0YGFloatOptional(ABI43_0_0YGNodePaddingAndBorderForAxis(
            child, ABI43_0_0YGFlexDirectionColumn, ownerWidth));
    child->setLayoutComputedFlexBasis(ABI43_0_0YGFloatOptionalMax(
        ABI43_0_0YGResolveValue(
            child->getResolvedDimensions()[ABI43_0_0YGDimensionHeight], ownerHeight),
        paddingAndBorder));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped flex
    // basis).
    childWidth = ABI43_0_0YGUndefined;
    childHeight = ABI43_0_0YGUndefined;
    childWidthMeasureMode = ABI43_0_0YGMeasureModeUndefined;
    childHeightMeasureMode = ABI43_0_0YGMeasureModeUndefined;

    auto marginRow =
        child->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, ownerWidth).unwrap();
    auto marginColumn =
        child->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, ownerWidth).unwrap();

    if (isRowStyleDimDefined) {
      childWidth =
          ABI43_0_0YGResolveValue(
              child->getResolvedDimensions()[ABI43_0_0YGDimensionWidth], ownerWidth)
              .unwrap() +
          marginRow;
      childWidthMeasureMode = ABI43_0_0YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          ABI43_0_0YGResolveValue(
              child->getResolvedDimensions()[ABI43_0_0YGDimensionHeight], ownerHeight)
              .unwrap() +
          marginColumn;
      childHeightMeasureMode = ABI43_0_0YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property, but all
    // major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->getStyle().overflow() == ABI43_0_0YGOverflowScroll) ||
        node->getStyle().overflow() != ABI43_0_0YGOverflowScroll) {
      if (ABI43_0_0YGFloatIsUndefined(childWidth) && !ABI43_0_0YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = ABI43_0_0YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->getStyle().overflow() == ABI43_0_0YGOverflowScroll) ||
        node->getStyle().overflow() != ABI43_0_0YGOverflowScroll) {
      if (ABI43_0_0YGFloatIsUndefined(childHeight) && !ABI43_0_0YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = ABI43_0_0YGMeasureModeAtMost;
      }
    }

    const auto& childStyle = child->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      if (!isMainAxisRow && childWidthMeasureMode == ABI43_0_0YGMeasureModeExactly) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = ABI43_0_0YGMeasureModeExactly;
      } else if (
          isMainAxisRow && childHeightMeasureMode == ABI43_0_0YGMeasureModeExactly) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = ABI43_0_0YGMeasureModeExactly;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch, set
    // the cross axis to be measured exactly with the available inner width

    const bool hasExactWidth =
        !ABI43_0_0YGFloatIsUndefined(width) && widthMode == ABI43_0_0YGMeasureModeExactly;
    const bool childWidthStretch =
        ABI43_0_0YGNodeAlignItem(node, child) == ABI43_0_0YGAlignStretch &&
        childWidthMeasureMode != ABI43_0_0YGMeasureModeExactly;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth &&
        childWidthStretch) {
      childWidth = width;
      childWidthMeasureMode = ABI43_0_0YGMeasureModeExactly;
      if (!childStyle.aspectRatio().isUndefined()) {
        childHeight =
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = ABI43_0_0YGMeasureModeExactly;
      }
    }

    const bool hasExactHeight =
        !ABI43_0_0YGFloatIsUndefined(height) && heightMode == ABI43_0_0YGMeasureModeExactly;
    const bool childHeightStretch =
        ABI43_0_0YGNodeAlignItem(node, child) == ABI43_0_0YGAlignStretch &&
        childHeightMeasureMode != ABI43_0_0YGMeasureModeExactly;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight &&
        childHeightStretch) {
      childHeight = height;
      childHeightMeasureMode = ABI43_0_0YGMeasureModeExactly;

      if (!childStyle.aspectRatio().isUndefined()) {
        childWidth =
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = ABI43_0_0YGMeasureModeExactly;
      }
    }

    ABI43_0_0YGConstrainMaxSizeForMode(
        child,
        ABI43_0_0YGFlexDirectionRow,
        ownerWidth,
        ownerWidth,
        &childWidthMeasureMode,
        &childWidth);
    ABI43_0_0YGConstrainMaxSizeForMode(
        child,
        ABI43_0_0YGFlexDirectionColumn,
        ownerHeight,
        ownerWidth,
        &childHeightMeasureMode,
        &childHeight);

    // Measure the child
    ABI43_0_0YGLayoutNodeInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        ownerWidth,
        ownerHeight,
        false,
        LayoutPassReason::kMeasureChild,
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount);

    child->setLayoutComputedFlexBasis(ABI43_0_0YGFloatOptional(ABI43_0_0YGFloatMax(
        child->getLayout().measuredDimensions[dim[mainAxis]],
        ABI43_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth))));
  }
  child->setLayoutComputedFlexBasisGeneration(generationCount);
}

static void ABI43_0_0YGNodeAbsoluteLayoutChild(
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGNodeRef child,
    const float width,
    const ABI43_0_0YGMeasureMode widthMode,
    const float height,
    const ABI43_0_0YGDirection direction,
    const ABI43_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const ABI43_0_0YGFlexDirection mainAxis =
      ABI43_0_0YGResolveFlexDirection(node->getStyle().flexDirection(), direction);
  const ABI43_0_0YGFlexDirection crossAxis = ABI43_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI43_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth = ABI43_0_0YGUndefined;
  float childHeight = ABI43_0_0YGUndefined;
  ABI43_0_0YGMeasureMode childWidthMeasureMode = ABI43_0_0YGMeasureModeUndefined;
  ABI43_0_0YGMeasureMode childHeightMeasureMode = ABI43_0_0YGMeasureModeUndefined;

  auto marginRow = child->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, width).unwrap();
  auto marginColumn =
      child->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, width).unwrap();

  if (ABI43_0_0YGNodeIsStyleDimDefined(child, ABI43_0_0YGFlexDirectionRow, width)) {
    childWidth =
        ABI43_0_0YGResolveValue(child->getResolvedDimensions()[ABI43_0_0YGDimensionWidth], width)
            .unwrap() +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based on
    // the left/right offsets if they're defined.
    if (child->isLeadingPositionDefined(ABI43_0_0YGFlexDirectionRow) &&
        child->isTrailingPosDefined(ABI43_0_0YGFlexDirectionRow)) {
      childWidth = node->getLayout().measuredDimensions[ABI43_0_0YGDimensionWidth] -
          (node->getLeadingBorder(ABI43_0_0YGFlexDirectionRow) +
           node->getTrailingBorder(ABI43_0_0YGFlexDirectionRow)) -
          (child->getLeadingPosition(ABI43_0_0YGFlexDirectionRow, width) +
           child->getTrailingPosition(ABI43_0_0YGFlexDirectionRow, width))
              .unwrap();
      childWidth =
          ABI43_0_0YGNodeBoundAxis(child, ABI43_0_0YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (ABI43_0_0YGNodeIsStyleDimDefined(child, ABI43_0_0YGFlexDirectionColumn, height)) {
    childHeight = ABI43_0_0YGResolveValue(
                      child->getResolvedDimensions()[ABI43_0_0YGDimensionHeight], height)
                      .unwrap() +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height based on
    // the top/bottom offsets if they're defined.
    if (child->isLeadingPositionDefined(ABI43_0_0YGFlexDirectionColumn) &&
        child->isTrailingPosDefined(ABI43_0_0YGFlexDirectionColumn)) {
      childHeight = node->getLayout().measuredDimensions[ABI43_0_0YGDimensionHeight] -
          (node->getLeadingBorder(ABI43_0_0YGFlexDirectionColumn) +
           node->getTrailingBorder(ABI43_0_0YGFlexDirectionColumn)) -
          (child->getLeadingPosition(ABI43_0_0YGFlexDirectionColumn, height) +
           child->getTrailingPosition(ABI43_0_0YGFlexDirectionColumn, height))
              .unwrap();
      childHeight = ABI43_0_0YGNodeBoundAxis(
          child, ABI43_0_0YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect
  // ratio calculation. One dimension being the anchor and the other being
  // flexible.
  const auto& childStyle = child->getStyle();
  if (ABI43_0_0YGFloatIsUndefined(childWidth) ^ ABI43_0_0YGFloatIsUndefined(childHeight)) {
    if (!childStyle.aspectRatio().isUndefined()) {
      if (ABI43_0_0YGFloatIsUndefined(childWidth)) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
      } else if (ABI43_0_0YGFloatIsUndefined(childHeight)) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (ABI43_0_0YGFloatIsUndefined(childWidth) || ABI43_0_0YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode = ABI43_0_0YGFloatIsUndefined(childWidth)
        ? ABI43_0_0YGMeasureModeUndefined
        : ABI43_0_0YGMeasureModeExactly;
    childHeightMeasureMode = ABI43_0_0YGFloatIsUndefined(childHeight)
        ? ABI43_0_0YGMeasureModeUndefined
        : ABI43_0_0YGMeasureModeExactly;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child to
    // wrap to the size of its owner. This is the same behavior as many browsers
    // implement.
    if (!isMainAxisRow && ABI43_0_0YGFloatIsUndefined(childWidth) &&
        widthMode != ABI43_0_0YGMeasureModeUndefined && !ABI43_0_0YGFloatIsUndefined(width) &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = ABI43_0_0YGMeasureModeAtMost;
    }

    ABI43_0_0YGLayoutNodeInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        childWidth,
        childHeight,
        false,
        LayoutPassReason::kAbsMeasureChild,
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount);
    childWidth = child->getLayout().measuredDimensions[ABI43_0_0YGDimensionWidth] +
        child->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, width).unwrap();
    childHeight = child->getLayout().measuredDimensions[ABI43_0_0YGDimensionHeight] +
        child->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, width).unwrap();
  }

  ABI43_0_0YGLayoutNodeInternal(
      child,
      childWidth,
      childHeight,
      direction,
      ABI43_0_0YGMeasureModeExactly,
      ABI43_0_0YGMeasureModeExactly,
      childWidth,
      childHeight,
      true,
      LayoutPassReason::kAbsLayout,
      config,
      layoutMarkerData,
      layoutContext,
      depth,
      generationCount);

  if (child->isTrailingPosDefined(mainAxis) &&
      !child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[mainAxis]] -
            child->getLayout().measuredDimensions[dim[mainAxis]] -
            node->getTrailingBorder(mainAxis) -
            child->getTrailingMargin(mainAxis, width).unwrap() -
            child->getTrailingPosition(mainAxis, isMainAxisRow ? width : height)
                .unwrap(),
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == ABI43_0_0YGJustifyCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]) /
            2.0f,
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == ABI43_0_0YGJustifyFlexEnd) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]),
        leading[mainAxis]);
  }

  if (child->isTrailingPosDefined(crossAxis) &&
      !child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[crossAxis]] -
            child->getLayout().measuredDimensions[dim[crossAxis]] -
            node->getTrailingBorder(crossAxis) -
            child->getTrailingMargin(crossAxis, width).unwrap() -
            child
                ->getTrailingPosition(crossAxis, isMainAxisRow ? height : width)
                .unwrap(),
        leading[crossAxis]);

  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ABI43_0_0YGNodeAlignItem(node, child) == ABI43_0_0YGAlignCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]) /
            2.0f,
        leading[crossAxis]);
  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ((ABI43_0_0YGNodeAlignItem(node, child) == ABI43_0_0YGAlignFlexEnd) ^
       (node->getStyle().flexWrap() == ABI43_0_0YGWrapWrapReverse))) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]),
        leading[crossAxis]);
  }
}

static void ABI43_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(
    const ABI43_0_0YGNodeRef node,
    float availableWidth,
    float availableHeight,
    const ABI43_0_0YGMeasureMode widthMeasureMode,
    const ABI43_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const LayoutPassReason reason) {
  ABI43_0_0YGAssertWithNode(
      node,
      node->hasMeasureFunc(),
      "Expected node to have custom measure function");

  if (widthMeasureMode == ABI43_0_0YGMeasureModeUndefined) {
    availableWidth = ABI43_0_0YGUndefined;
  }
  if (heightMeasureMode == ABI43_0_0YGMeasureModeUndefined) {
    availableHeight = ABI43_0_0YGUndefined;
  }

  const float paddingAndBorderAxisRow =
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, ABI43_0_0YGFlexDirectionRow, ownerWidth);
  const float paddingAndBorderAxisColumn =
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, ABI43_0_0YGFlexDirectionColumn, ownerWidth);
  const float marginAxisRow =
      node->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, ownerWidth).unwrap();
  const float marginAxisColumn =
      node->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, ownerWidth).unwrap();

  // We want to make sure we don't call measure with negative size
  const float innerWidth = ABI43_0_0YGFloatIsUndefined(availableWidth)
      ? availableWidth
      : ABI43_0_0YGFloatMax(0, availableWidth - marginAxisRow - paddingAndBorderAxisRow);
  const float innerHeight = ABI43_0_0YGFloatIsUndefined(availableHeight)
      ? availableHeight
      : ABI43_0_0YGFloatMax(
            0, availableHeight - marginAxisColumn - paddingAndBorderAxisColumn);

  if (widthMeasureMode == ABI43_0_0YGMeasureModeExactly &&
      heightMeasureMode == ABI43_0_0YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node,
            ABI43_0_0YGFlexDirectionRow,
            availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        ABI43_0_0YGDimensionWidth);
    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node,
            ABI43_0_0YGFlexDirectionColumn,
            availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        ABI43_0_0YGDimensionHeight);
  } else {
    Event::publish<Event::MeasureCallbackStart>(node);

    // Measure the text under the current constraints.
    const ABI43_0_0YGSize measuredSize = node->measure(
        innerWidth,
        widthMeasureMode,
        innerHeight,
        heightMeasureMode,
        layoutContext);

    layoutMarkerData.measureCallbacks += 1;
    layoutMarkerData.measureCallbackReasonsCount[static_cast<size_t>(reason)] +=
        1;

    Event::publish<Event::MeasureCallbackEnd>(
        node,
        {layoutContext,
         innerWidth,
         widthMeasureMode,
         innerHeight,
         heightMeasureMode,
         measuredSize.width,
         measuredSize.height,
         reason});

    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node,
            ABI43_0_0YGFlexDirectionRow,
            (widthMeasureMode == ABI43_0_0YGMeasureModeUndefined ||
             widthMeasureMode == ABI43_0_0YGMeasureModeAtMost)
                ? measuredSize.width + paddingAndBorderAxisRow
                : availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        ABI43_0_0YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node,
            ABI43_0_0YGFlexDirectionColumn,
            (heightMeasureMode == ABI43_0_0YGMeasureModeUndefined ||
             heightMeasureMode == ABI43_0_0YGMeasureModeAtMost)
                ? measuredSize.height + paddingAndBorderAxisColumn
                : availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        ABI43_0_0YGDimensionHeight);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void ABI43_0_0YGNodeEmptyContainerSetMeasuredDimensions(
    const ABI43_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI43_0_0YGMeasureMode widthMeasureMode,
    const ABI43_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  const float paddingAndBorderAxisRow =
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, ABI43_0_0YGFlexDirectionRow, ownerWidth);
  const float paddingAndBorderAxisColumn =
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, ABI43_0_0YGFlexDirectionColumn, ownerWidth);
  const float marginAxisRow =
      node->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, ownerWidth).unwrap();
  const float marginAxisColumn =
      node->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, ownerWidth).unwrap();

  node->setLayoutMeasuredDimension(
      ABI43_0_0YGNodeBoundAxis(
          node,
          ABI43_0_0YGFlexDirectionRow,
          (widthMeasureMode == ABI43_0_0YGMeasureModeUndefined ||
           widthMeasureMode == ABI43_0_0YGMeasureModeAtMost)
              ? paddingAndBorderAxisRow
              : availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      ABI43_0_0YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      ABI43_0_0YGNodeBoundAxis(
          node,
          ABI43_0_0YGFlexDirectionColumn,
          (heightMeasureMode == ABI43_0_0YGMeasureModeUndefined ||
           heightMeasureMode == ABI43_0_0YGMeasureModeAtMost)
              ? paddingAndBorderAxisColumn
              : availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      ABI43_0_0YGDimensionHeight);
}

static bool ABI43_0_0YGNodeFixedSizeSetMeasuredDimensions(
    const ABI43_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI43_0_0YGMeasureMode widthMeasureMode,
    const ABI43_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  if ((!ABI43_0_0YGFloatIsUndefined(availableWidth) &&
       widthMeasureMode == ABI43_0_0YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (!ABI43_0_0YGFloatIsUndefined(availableHeight) &&
       heightMeasureMode == ABI43_0_0YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == ABI43_0_0YGMeasureModeExactly &&
       heightMeasureMode == ABI43_0_0YGMeasureModeExactly)) {
    auto marginAxisColumn =
        node->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, ownerWidth).unwrap();
    auto marginAxisRow =
        node->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, ownerWidth).unwrap();

    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node,
            ABI43_0_0YGFlexDirectionRow,
            ABI43_0_0YGFloatIsUndefined(availableWidth) ||
                    (widthMeasureMode == ABI43_0_0YGMeasureModeAtMost &&
                     availableWidth < 0.0f)
                ? 0.0f
                : availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        ABI43_0_0YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node,
            ABI43_0_0YGFlexDirectionColumn,
            ABI43_0_0YGFloatIsUndefined(availableHeight) ||
                    (heightMeasureMode == ABI43_0_0YGMeasureModeAtMost &&
                     availableHeight < 0.0f)
                ? 0.0f
                : availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        ABI43_0_0YGDimensionHeight);
    return true;
  }

  return false;
}

static void ABI43_0_0YGZeroOutLayoutRecursivly(
    const ABI43_0_0YGNodeRef node,
    void* layoutContext) {
  node->getLayout() = {};
  node->setLayoutDimension(0, 0);
  node->setLayoutDimension(0, 1);
  node->setHasNewLayout(true);

  node->iterChildrenAfterCloningIfNeeded(
      ABI43_0_0YGZeroOutLayoutRecursivly, layoutContext);
}

static float ABI43_0_0YGNodeCalculateAvailableInnerDim(
    const ABI43_0_0YGNodeConstRef node,
    ABI43_0_0YGFlexDirection axis,
    float availableDim,
    float ownerDim,
    float ownerDimForMarginPadding) {
  ABI43_0_0YGFlexDirection direction =
      ABI43_0_0YGFlexDirectionIsRow(axis) ? ABI43_0_0YGFlexDirectionRow : ABI43_0_0YGFlexDirectionColumn;
  ABI43_0_0YGDimension dimension =
      ABI43_0_0YGFlexDirectionIsRow(axis) ? ABI43_0_0YGDimensionWidth : ABI43_0_0YGDimensionHeight;

  const float margin =
      node->getMarginForAxis(direction, ownerDimForMarginPadding).unwrap();
  const float paddingAndBorder =
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, direction, ownerDimForMarginPadding);

  float availableInnerDim = availableDim - margin - paddingAndBorder;
  // Max dimension overrides predefined dimension value; Min dimension in turn
  // overrides both of the above
  if (!ABI43_0_0YGFloatIsUndefined(availableInnerDim)) {
    // We want to make sure our available height does not violate min and max
    // constraints
    const ABI43_0_0YGFloatOptional minDimensionOptional =
        ABI43_0_0YGResolveValue(node->getStyle().minDimensions()[dimension], ownerDim);
    const float minInnerDim = minDimensionOptional.isUndefined()
        ? 0.0f
        : minDimensionOptional.unwrap() - paddingAndBorder;

    const ABI43_0_0YGFloatOptional maxDimensionOptional =
        ABI43_0_0YGResolveValue(node->getStyle().maxDimensions()[dimension], ownerDim);

    const float maxInnerDim = maxDimensionOptional.isUndefined()
        ? FLT_MAX
        : maxDimensionOptional.unwrap() - paddingAndBorder;
    availableInnerDim =
        ABI43_0_0YGFloatMax(ABI43_0_0YGFloatMin(availableInnerDim, maxInnerDim), minInnerDim);
  }

  return availableInnerDim;
}

static float ABI43_0_0YGNodeComputeFlexBasisForChildren(
    const ABI43_0_0YGNodeRef node,
    const float availableInnerWidth,
    const float availableInnerHeight,
    ABI43_0_0YGMeasureMode widthMeasureMode,
    ABI43_0_0YGMeasureMode heightMeasureMode,
    ABI43_0_0YGDirection direction,
    ABI43_0_0YGFlexDirection mainAxis,
    const ABI43_0_0YGConfigRef config,
    bool performLayout,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  float totalOuterFlexBasis = 0.0f;
  ABI43_0_0YGNodeRef singleFlexChild = nullptr;
  const ABI43_0_0YGVector& children = node->getChildren();
  ABI43_0_0YGMeasureMode measureModeMainDim =
      ABI43_0_0YGFlexDirectionIsRow(mainAxis) ? widthMeasureMode : heightMeasureMode;
  // If there is only one child with flexGrow + flexShrink it means we can set
  // the computedFlexBasis to 0 instead of measuring and shrinking / flexing the
  // child to exactly match the remaining space
  if (measureModeMainDim == ABI43_0_0YGMeasureModeExactly) {
    for (auto child : children) {
      if (child->isNodeFlexible()) {
        if (singleFlexChild != nullptr ||
            ABI43_0_0YGFloatsEqual(child->resolveFlexGrow(), 0.0f) ||
            ABI43_0_0YGFloatsEqual(child->resolveFlexShrink(), 0.0f)) {
          // There is already a flexible child, or this flexible child doesn't
          // have flexGrow and flexShrink, abort
          singleFlexChild = nullptr;
          break;
        } else {
          singleFlexChild = child;
        }
      }
    }
  }

  for (auto child : children) {
    child->resolveDimension();
    if (child->getStyle().display() == ABI43_0_0YGDisplayNone) {
      ABI43_0_0YGZeroOutLayoutRecursivly(child, layoutContext);
      child->setHasNewLayout(true);
      child->setDirty(false);
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const ABI43_0_0YGDirection childDirection = child->resolveDirection(direction);
      const float mainDim = ABI43_0_0YGFlexDirectionIsRow(mainAxis)
          ? availableInnerWidth
          : availableInnerHeight;
      const float crossDim = ABI43_0_0YGFlexDirectionIsRow(mainAxis)
          ? availableInnerHeight
          : availableInnerWidth;
      child->setPosition(
          childDirection, mainDim, crossDim, availableInnerWidth);
    }

    if (child->getStyle().positionType() == ABI43_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (child == singleFlexChild) {
      child->setLayoutComputedFlexBasisGeneration(generationCount);
      child->setLayoutComputedFlexBasis(ABI43_0_0YGFloatOptional(0));
    } else {
      ABI43_0_0YGNodeComputeFlexBasisForChild(
          node,
          child,
          availableInnerWidth,
          widthMeasureMode,
          availableInnerHeight,
          availableInnerWidth,
          availableInnerHeight,
          heightMeasureMode,
          direction,
          config,
          layoutMarkerData,
          layoutContext,
          depth,
          generationCount);
    }

    totalOuterFlexBasis +=
        (child->getLayout().computedFlexBasis +
         child->getMarginForAxis(mainAxis, availableInnerWidth))
            .unwrap();
  }

  return totalOuterFlexBasis;
}

// This function assumes that all the children of node have their
// computedFlexBasis properly computed(To do this use
// ABI43_0_0YGNodeComputeFlexBasisForChildren function). This function calculates
// ABI43_0_0YGCollectFlexItemsRowMeasurement
static ABI43_0_0YGCollectFlexItemsRowValues ABI43_0_0YGCalculateCollectFlexItemsRowValues(
    const ABI43_0_0YGNodeRef& node,
    const ABI43_0_0YGDirection ownerDirection,
    const float mainAxisownerSize,
    const float availableInnerWidth,
    const float availableInnerMainDim,
    const uint32_t startOfLineIndex,
    const uint32_t lineCount) {
  ABI43_0_0YGCollectFlexItemsRowValues flexAlgoRowMeasurement = {};
  flexAlgoRowMeasurement.relativeChildren.reserve(node->getChildren().size());

  float sizeConsumedOnCurrentLineIncludingMinConstraint = 0;
  const ABI43_0_0YGFlexDirection mainAxis = ABI43_0_0YGResolveFlexDirection(
      node->getStyle().flexDirection(), node->resolveDirection(ownerDirection));
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != ABI43_0_0YGWrapNoWrap;

  // Add items to the current line until it's full or we run out of items.
  uint32_t endOfLineIndex = startOfLineIndex;
  for (; endOfLineIndex < node->getChildren().size(); endOfLineIndex++) {
    const ABI43_0_0YGNodeRef child = node->getChild(endOfLineIndex);
    if (child->getStyle().display() == ABI43_0_0YGDisplayNone ||
        child->getStyle().positionType() == ABI43_0_0YGPositionTypeAbsolute) {
      continue;
    }
    child->setLineIndex(lineCount);
    const float childMarginMainAxis =
        child->getMarginForAxis(mainAxis, availableInnerWidth).unwrap();
    const float flexBasisWithMinAndMaxConstraints =
        ABI43_0_0YGNodeBoundAxisWithinMinAndMax(
            child,
            mainAxis,
            child->getLayout().computedFlexBasis,
            mainAxisownerSize)
            .unwrap();

    // If this is a multi-line flow and this item pushes us over the available
    // size, we've hit the end of the current line. Break out of the loop and
    // lay out the current line.
    if (sizeConsumedOnCurrentLineIncludingMinConstraint +
                flexBasisWithMinAndMaxConstraints + childMarginMainAxis >
            availableInnerMainDim &&
        isNodeFlexWrap && flexAlgoRowMeasurement.itemsOnLine > 0) {
      break;
    }

    sizeConsumedOnCurrentLineIncludingMinConstraint +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
    flexAlgoRowMeasurement.sizeConsumedOnCurrentLine +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
    flexAlgoRowMeasurement.itemsOnLine++;

    if (child->isNodeFlexible()) {
      flexAlgoRowMeasurement.totalFlexGrowFactors += child->resolveFlexGrow();

      // Unlike the grow factor, the shrink factor is scaled relative to the
      // child dimension.
      flexAlgoRowMeasurement.totalFlexShrinkScaledFactors +=
          -child->resolveFlexShrink() *
          child->getLayout().computedFlexBasis.unwrap();
    }

    flexAlgoRowMeasurement.relativeChildren.push_back(child);
  }

  // The total flex factor needs to be floored to 1.
  if (flexAlgoRowMeasurement.totalFlexGrowFactors > 0 &&
      flexAlgoRowMeasurement.totalFlexGrowFactors < 1) {
    flexAlgoRowMeasurement.totalFlexGrowFactors = 1;
  }

  // The total flex shrink factor needs to be floored to 1.
  if (flexAlgoRowMeasurement.totalFlexShrinkScaledFactors > 0 &&
      flexAlgoRowMeasurement.totalFlexShrinkScaledFactors < 1) {
    flexAlgoRowMeasurement.totalFlexShrinkScaledFactors = 1;
  }
  flexAlgoRowMeasurement.endOfLineIndex = endOfLineIndex;
  return flexAlgoRowMeasurement;
}

// It distributes the free space to the flexible items and ensures that the size
// of the flex items abide the min and max constraints. At the end of this
// function the child nodes would have proper size. Prior using this function
// please ensure that ABI43_0_0YGDistributeFreeSpaceFirstPass is called.
static float ABI43_0_0YGDistributeFreeSpaceSecondPass(
    ABI43_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI43_0_0YGNodeRef node,
    const ABI43_0_0YGFlexDirection mainAxis,
    const ABI43_0_0YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool flexBasisOverflows,
    const ABI43_0_0YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const ABI43_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  float childFlexBasis = 0;
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float deltaFreeSpace = 0;
  const bool isMainAxisRow = ABI43_0_0YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != ABI43_0_0YGWrapNoWrap;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    childFlexBasis = ABI43_0_0YGNodeBoundAxisWithinMinAndMax(
                         currentRelativeChild,
                         mainAxis,
                         currentRelativeChild->getLayout().computedFlexBasis,
                         mainAxisownerSize)
                         .unwrap();
    float updatedMainSize = childFlexBasis;

    if (!ABI43_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;
      // Is this child able to shrink?
      if (flexShrinkScaledFactor != 0) {
        float childSize;

        if (!ABI43_0_0YGFloatIsUndefined(
                collectedFlexItemsValues.totalFlexShrinkScaledFactors) &&
            collectedFlexItemsValues.totalFlexShrinkScaledFactors == 0) {
          childSize = childFlexBasis + flexShrinkScaledFactor;
        } else {
          childSize = childFlexBasis +
              (collectedFlexItemsValues.remainingFreeSpace /
               collectedFlexItemsValues.totalFlexShrinkScaledFactors) *
                  flexShrinkScaledFactor;
        }

        updatedMainSize = ABI43_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            childSize,
            availableInnerMainDim,
            availableInnerWidth);
      }
    } else if (
        !ABI43_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!ABI43_0_0YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        updatedMainSize = ABI43_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            childFlexBasis +
                collectedFlexItemsValues.remainingFreeSpace /
                    collectedFlexItemsValues.totalFlexGrowFactors *
                    flexGrowFactor,
            availableInnerMainDim,
            availableInnerWidth);
      }
    }

    deltaFreeSpace += updatedMainSize - childFlexBasis;

    const float marginMain =
        currentRelativeChild->getMarginForAxis(mainAxis, availableInnerWidth)
            .unwrap();
    const float marginCross =
        currentRelativeChild->getMarginForAxis(crossAxis, availableInnerWidth)
            .unwrap();

    float childCrossSize;
    float childMainSize = updatedMainSize + marginMain;
    ABI43_0_0YGMeasureMode childCrossMeasureMode;
    ABI43_0_0YGMeasureMode childMainMeasureMode = ABI43_0_0YGMeasureModeExactly;

    const auto& childStyle = currentRelativeChild->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      childCrossSize = isMainAxisRow
          ? (childMainSize - marginMain) / childStyle.aspectRatio().unwrap()
          : (childMainSize - marginMain) * childStyle.aspectRatio().unwrap();
      childCrossMeasureMode = ABI43_0_0YGMeasureModeExactly;

      childCrossSize += marginCross;
    } else if (
        !ABI43_0_0YGFloatIsUndefined(availableInnerCrossDim) &&
        !ABI43_0_0YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        measureModeCrossDim == ABI43_0_0YGMeasureModeExactly &&
        !(isNodeFlexWrap && flexBasisOverflows) &&
        ABI43_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI43_0_0YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            ABI43_0_0YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit !=
            ABI43_0_0YGUnitAuto) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = ABI43_0_0YGMeasureModeExactly;
    } else if (!ABI43_0_0YGNodeIsStyleDimDefined(
                   currentRelativeChild, crossAxis, availableInnerCrossDim)) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = ABI43_0_0YGFloatIsUndefined(childCrossSize)
          ? ABI43_0_0YGMeasureModeUndefined
          : ABI43_0_0YGMeasureModeAtMost;
    } else {
      childCrossSize =
          ABI43_0_0YGResolveValue(
              currentRelativeChild->getResolvedDimension(dim[crossAxis]),
              availableInnerCrossDim)
              .unwrap() +
          marginCross;
      const bool isLoosePercentageMeasurement =
          currentRelativeChild->getResolvedDimension(dim[crossAxis]).unit ==
              ABI43_0_0YGUnitPercent &&
          measureModeCrossDim != ABI43_0_0YGMeasureModeExactly;
      childCrossMeasureMode =
          ABI43_0_0YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
          ? ABI43_0_0YGMeasureModeUndefined
          : ABI43_0_0YGMeasureModeExactly;
    }

    ABI43_0_0YGConstrainMaxSizeForMode(
        currentRelativeChild,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        &childMainMeasureMode,
        &childMainSize);
    ABI43_0_0YGConstrainMaxSizeForMode(
        currentRelativeChild,
        crossAxis,
        availableInnerCrossDim,
        availableInnerWidth,
        &childCrossMeasureMode,
        &childCrossSize);

    const bool requiresStretchLayout =
        !ABI43_0_0YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        ABI43_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI43_0_0YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            ABI43_0_0YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit != ABI43_0_0YGUnitAuto;

    const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
    const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

    const ABI43_0_0YGMeasureMode childWidthMeasureMode =
        isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
    const ABI43_0_0YGMeasureMode childHeightMeasureMode =
        !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

    const bool isLayoutPass = performLayout && !requiresStretchLayout;
    // Recursively call the layout algorithm for this child with the updated
    // main size.
    ABI43_0_0YGLayoutNodeInternal(
        currentRelativeChild,
        childWidth,
        childHeight,
        node->getLayout().direction(),
        childWidthMeasureMode,
        childHeightMeasureMode,
        availableInnerWidth,
        availableInnerHeight,
        isLayoutPass,
        isLayoutPass ? LayoutPassReason::kFlexLayout
                     : LayoutPassReason::kFlexMeasure,
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount);
    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow() |
        currentRelativeChild->getLayout().hadOverflow());
  }
  return deltaFreeSpace;
}

// It distributes the free space to the flexible items.For those flexible items
// whose min and max constraints are triggered, those flex item's clamped size
// is removed from the remaingfreespace.
static void ABI43_0_0YGDistributeFreeSpaceFirstPass(
    ABI43_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI43_0_0YGFlexDirection mainAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerWidth) {
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float baseMainSize = 0;
  float boundMainSize = 0;
  float deltaFreeSpace = 0;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    float childFlexBasis =
        ABI43_0_0YGNodeBoundAxisWithinMinAndMax(
            currentRelativeChild,
            mainAxis,
            currentRelativeChild->getLayout().computedFlexBasis,
            mainAxisownerSize)
            .unwrap();

    if (collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;

      // Is this child able to shrink?
      if (!ABI43_0_0YGFloatIsUndefined(flexShrinkScaledFactor) &&
          flexShrinkScaledFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexShrinkScaledFactors *
                flexShrinkScaledFactor;
        boundMainSize = ABI43_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);
        if (!ABI43_0_0YGFloatIsUndefined(baseMainSize) &&
            !ABI43_0_0YGFloatIsUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining, this
          // item's min/max constraints should also trigger in the second pass
          // resulting in the item's size calculation being identical in the
          // first and second passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          collectedFlexItemsValues.totalFlexShrinkScaledFactors -=
              (-currentRelativeChild->resolveFlexShrink() *
               currentRelativeChild->getLayout().computedFlexBasis.unwrap());
        }
      }
    } else if (
        !ABI43_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!ABI43_0_0YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexGrowFactors * flexGrowFactor;
        boundMainSize = ABI43_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);

        if (!ABI43_0_0YGFloatIsUndefined(baseMainSize) &&
            !ABI43_0_0YGFloatIsUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining, this
          // item's min/max constraints should also trigger in the second pass
          // resulting in the item's size calculation being identical in the
          // first and second passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          collectedFlexItemsValues.totalFlexGrowFactors -= flexGrowFactor;
        }
      }
    }
  }
  collectedFlexItemsValues.remainingFreeSpace -= deltaFreeSpace;
}

// Do two passes over the flex items to figure out how to distribute the
// remaining space.
//
// The first pass finds the items whose min/max constraints trigger, freezes
// them at those sizes, and excludes those sizes from the remaining space.
//
// The second pass sets the size of each flexible item. It distributes the
// remaining space amongst the items whose min/max constraints didn't trigger in
// the first pass. For the other items, it sets their sizes by forcing their
// min/max constraints to trigger again.
//
// This two pass approach for resolving min/max constraints deviates from the
// spec. The spec
// (https://www.w3.org/TR/CSS-flexbox-1/#resolve-flexible-lengths) describes a
// process that needs to be repeated a variable number of times. The algorithm
// implemented here won't handle all cases but it was simpler to implement and
// it mitigates performance concerns because we know exactly how many passes
// it'll do.
//
// At the end of this function the child nodes would have the proper size
// assigned to them.
//
static void ABI43_0_0YGResolveFlexibleLength(
    const ABI43_0_0YGNodeRef node,
    ABI43_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI43_0_0YGFlexDirection mainAxis,
    const ABI43_0_0YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool flexBasisOverflows,
    const ABI43_0_0YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const ABI43_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const float originalFreeSpace = collectedFlexItemsValues.remainingFreeSpace;
  // First pass: detect the flex items whose min/max constraints trigger
  ABI43_0_0YGDistributeFreeSpaceFirstPass(
      collectedFlexItemsValues,
      mainAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerWidth);

  // Second pass: resolve the sizes of the flexible items
  const float distributedFreeSpace = ABI43_0_0YGDistributeFreeSpaceSecondPass(
      collectedFlexItemsValues,
      node,
      mainAxis,
      crossAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerCrossDim,
      availableInnerWidth,
      availableInnerHeight,
      flexBasisOverflows,
      measureModeCrossDim,
      performLayout,
      config,
      layoutMarkerData,
      layoutContext,
      depth,
      generationCount);

  collectedFlexItemsValues.remainingFreeSpace =
      originalFreeSpace - distributedFreeSpace;
}

static void ABI43_0_0YGJustifyMainAxis(
    const ABI43_0_0YGNodeRef node,
    ABI43_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const uint32_t startOfLineIndex,
    const ABI43_0_0YGFlexDirection mainAxis,
    const ABI43_0_0YGFlexDirection crossAxis,
    const ABI43_0_0YGMeasureMode measureModeMainDim,
    const ABI43_0_0YGMeasureMode measureModeCrossDim,
    const float mainAxisownerSize,
    const float ownerWidth,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const bool performLayout,
    void* const layoutContext) {
  const auto& style = node->getStyle();
  const float leadingPaddingAndBorderMain =
      node->getLeadingPaddingAndBorder(mainAxis, ownerWidth).unwrap();
  const float trailingPaddingAndBorderMain =
      node->getTrailingPaddingAndBorder(mainAxis, ownerWidth).unwrap();
  // If we are using "at most" rules in the main axis, make sure that
  // remainingFreeSpace is 0 when min main dimension is not given
  if (measureModeMainDim == ABI43_0_0YGMeasureModeAtMost &&
      collectedFlexItemsValues.remainingFreeSpace > 0) {
    if (!style.minDimensions()[dim[mainAxis]].isUndefined() &&
        !ABI43_0_0YGResolveValue(style.minDimensions()[dim[mainAxis]], mainAxisownerSize)
             .isUndefined()) {
      // This condition makes sure that if the size of main dimension(after
      // considering child nodes main dim, leading and trailing padding etc)
      // falls below min dimension, then the remainingFreeSpace is reassigned
      // considering the min dimension

      // `minAvailableMainDim` denotes minimum available space in which child
      // can be laid out, it will exclude space consumed by padding and border.
      const float minAvailableMainDim =
          ABI43_0_0YGResolveValue(
              style.minDimensions()[dim[mainAxis]], mainAxisownerSize)
              .unwrap() -
          leadingPaddingAndBorderMain - trailingPaddingAndBorderMain;
      const float occupiedSpaceByChildNodes =
          availableInnerMainDim - collectedFlexItemsValues.remainingFreeSpace;
      collectedFlexItemsValues.remainingFreeSpace =
          ABI43_0_0YGFloatMax(0, minAvailableMainDim - occupiedSpaceByChildNodes);
    } else {
      collectedFlexItemsValues.remainingFreeSpace = 0;
    }
  }

  int numberOfAutoMarginsOnCurrentLine = 0;
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const ABI43_0_0YGNodeRef child = node->getChild(i);
    if (child->getStyle().positionType() != ABI43_0_0YGPositionTypeAbsolute) {
      if (child->marginLeadingValue(mainAxis).unit == ABI43_0_0YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
      if (child->marginTrailingValue(mainAxis).unit == ABI43_0_0YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
    }
  }

  // In order to position the elements in the main axis, we have two controls.
  // The space between the beginning and the first element and the space between
  // each two elements.
  float leadingMainDim = 0;
  float betweenMainDim = 0;
  const ABI43_0_0YGJustify justifyContent = node->getStyle().justifyContent();

  if (numberOfAutoMarginsOnCurrentLine == 0) {
    switch (justifyContent) {
      case ABI43_0_0YGJustifyCenter:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace / 2;
        break;
      case ABI43_0_0YGJustifyFlexEnd:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace;
        break;
      case ABI43_0_0YGJustifySpaceBetween:
        if (collectedFlexItemsValues.itemsOnLine > 1) {
          betweenMainDim =
              ABI43_0_0YGFloatMax(collectedFlexItemsValues.remainingFreeSpace, 0) /
              (collectedFlexItemsValues.itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
        break;
      case ABI43_0_0YGJustifySpaceEvenly:
        // Space is distributed evenly across all elements
        betweenMainDim = collectedFlexItemsValues.remainingFreeSpace /
            (collectedFlexItemsValues.itemsOnLine + 1);
        leadingMainDim = betweenMainDim;
        break;
      case ABI43_0_0YGJustifySpaceAround:
        // Space on the edges is half of the space between elements
        betweenMainDim = collectedFlexItemsValues.remainingFreeSpace /
            collectedFlexItemsValues.itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
        break;
      case ABI43_0_0YGJustifyFlexStart:
        break;
    }
  }

  collectedFlexItemsValues.mainDim =
      leadingPaddingAndBorderMain + leadingMainDim;
  collectedFlexItemsValues.crossDim = 0;

  float maxAscentForCurrentLine = 0;
  float maxDescentForCurrentLine = 0;
  bool isNodeBaselineLayout = ABI43_0_0YGIsBaselineLayout(node);
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const ABI43_0_0YGNodeRef child = node->getChild(i);
    const ABI43_0_0YGStyle& childStyle = child->getStyle();
    const ABI43_0_0YGLayout childLayout = child->getLayout();
    if (childStyle.display() == ABI43_0_0YGDisplayNone) {
      continue;
    }
    if (childStyle.positionType() == ABI43_0_0YGPositionTypeAbsolute &&
        child->isLeadingPositionDefined(mainAxis)) {
      if (performLayout) {
        // In case the child is position absolute and has left/top being
        // defined, we override the position to whatever the user said (and
        // margin/border).
        child->setLayoutPosition(
            child->getLeadingPosition(mainAxis, availableInnerMainDim)
                    .unwrap() +
                node->getLeadingBorder(mainAxis) +
                child->getLeadingMargin(mainAxis, availableInnerWidth).unwrap(),
            pos[mainAxis]);
      }
    } else {
      // Now that we placed the element, we need to update the variables.
      // We need to do that only for relative elements. Absolute elements do not
      // take part in that phase.
      if (childStyle.positionType() != ABI43_0_0YGPositionTypeAbsolute) {
        if (child->marginLeadingValue(mainAxis).unit == ABI43_0_0YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              numberOfAutoMarginsOnCurrentLine;
        }

        if (performLayout) {
          child->setLayoutPosition(
              childLayout.position[pos[mainAxis]] +
                  collectedFlexItemsValues.mainDim,
              pos[mainAxis]);
        }

        if (child->marginTrailingValue(mainAxis).unit == ABI43_0_0YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              numberOfAutoMarginsOnCurrentLine;
        }
        bool canSkipFlex =
            !performLayout && measureModeCrossDim == ABI43_0_0YGMeasureModeExactly;
        if (canSkipFlex) {
          // If we skipped the flex step, then we can't rely on the measuredDims
          // because they weren't computed. This means we can't call
          // ABI43_0_0YGNodeDimWithMargin.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              child->getMarginForAxis(mainAxis, availableInnerWidth).unwrap() +
              childLayout.computedFlexBasis.unwrap();
          collectedFlexItemsValues.crossDim = availableInnerCrossDim;
        } else {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              ABI43_0_0YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

          if (isNodeBaselineLayout) {
            // If the child is baseline aligned then the cross dimension is
            // calculated by adding maxAscent and maxDescent from the baseline.
            const float ascent = ABI43_0_0YGBaseline(child, layoutContext) +
                child
                    ->getLeadingMargin(
                        ABI43_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimensions[ABI43_0_0YGDimensionHeight] +
                child
                    ->getMarginForAxis(
                        ABI43_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap() -
                ascent;

            maxAscentForCurrentLine =
                ABI43_0_0YGFloatMax(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                ABI43_0_0YGFloatMax(maxDescentForCurrentLine, descent);
          } else {
            // The cross dimension is the max of the elements dimension since
            // there can only be one element in that cross dimension in the case
            // when the items are not baseline aligned
            collectedFlexItemsValues.crossDim = ABI43_0_0YGFloatMax(
                collectedFlexItemsValues.crossDim,
                ABI43_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
          }
        }
      } else if (performLayout) {
        child->setLayoutPosition(
            childLayout.position[pos[mainAxis]] +
                node->getLeadingBorder(mainAxis) + leadingMainDim,
            pos[mainAxis]);
      }
    }
  }
  collectedFlexItemsValues.mainDim += trailingPaddingAndBorderMain;

  if (isNodeBaselineLayout) {
    collectedFlexItemsValues.crossDim =
        maxAscentForCurrentLine + maxDescentForCurrentLine;
  }
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm described in the W3C CSS documentation:
// https://www.w3.org/TR/CSS3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//    which are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//    are stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//    defined by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//    'collapse' and 'hidden' are not supported.
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//    bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//    minimum main size. For text blocks, for example, this is the width of the
//    widest word. Calculating the minimum width is expensive, so we forego it
//    and assume a default minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//    lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//    but the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing
//      the node or ABI43_0_0YGUndefined if the size is not available; interpretation
//      depends on layout flags
//    - ownerDirection: the inline (text) direction within the owner
//      (left-to-right or right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//      for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//      for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//      dimensions of the node or it requires the entire node and its subtree to
//      be layed out (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the information in node.style, which is treated as a
//    read-only input. It is responsible for setting the layout.direction and
//    layout.measuredDimensions fields for the input node as well as the
//    layout.position and layout.lineIndex fields for its child nodes. The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does not include margins.
//
//    The spec describes four different layout modes: "fill available", "max
//    content", "min content", and "fit content". Of these, we don't use "min
//    content" because we don't support default minimum main sizes (see above
//    for details). Each of our measure modes maps to a layout mode from the
//    spec (https://www.w3.org/TR/CSS3-sizing/#terms):
//      - ABI43_0_0YGMeasureModeUndefined: max content
//      - ABI43_0_0YGMeasureModeExactly: fill available
//      - ABI43_0_0YGMeasureModeAtMost: fit content
//
//    When calling ABI43_0_0YGNodelayoutImpl and ABI43_0_0YGLayoutNodeInternal, if the caller
//    passes an available size of undefined then it must also pass a measure
//    mode of ABI43_0_0YGMeasureModeUndefined in that dimension.
//
static void ABI43_0_0YGNodelayoutImpl(
    const ABI43_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI43_0_0YGDirection ownerDirection,
    const ABI43_0_0YGMeasureMode widthMeasureMode,
    const ABI43_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const ABI43_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount,
    const LayoutPassReason reason) {
  ABI43_0_0YGAssertWithNode(
      node,
      ABI43_0_0YGFloatIsUndefined(availableWidth)
          ? widthMeasureMode == ABI43_0_0YGMeasureModeUndefined
          : true,
      "availableWidth is indefinite so widthMeasureMode must be "
      "YGMeasureModeUndefined");
  ABI43_0_0YGAssertWithNode(
      node,
      ABI43_0_0YGFloatIsUndefined(availableHeight)
          ? heightMeasureMode == ABI43_0_0YGMeasureModeUndefined
          : true,
      "availableHeight is indefinite so heightMeasureMode must be "
      "YGMeasureModeUndefined");

  (performLayout ? layoutMarkerData.layouts : layoutMarkerData.measures) += 1;

  // Set the resolved resolution in the node's layout.
  const ABI43_0_0YGDirection direction = node->resolveDirection(ownerDirection);
  node->setLayoutDirection(direction);

  const ABI43_0_0YGFlexDirection flexRowDirection =
      ABI43_0_0YGResolveFlexDirection(ABI43_0_0YGFlexDirectionRow, direction);
  const ABI43_0_0YGFlexDirection flexColumnDirection =
      ABI43_0_0YGResolveFlexDirection(ABI43_0_0YGFlexDirectionColumn, direction);

  const ABI43_0_0YGEdge startEdge =
      direction == ABI43_0_0YGDirectionLTR ? ABI43_0_0YGEdgeLeft : ABI43_0_0YGEdgeRight;
  const ABI43_0_0YGEdge endEdge = direction == ABI43_0_0YGDirectionLTR ? ABI43_0_0YGEdgeRight : ABI43_0_0YGEdgeLeft;
  node->setLayoutMargin(
      node->getLeadingMargin(flexRowDirection, ownerWidth).unwrap(), startEdge);
  node->setLayoutMargin(
      node->getTrailingMargin(flexRowDirection, ownerWidth).unwrap(), endEdge);
  node->setLayoutMargin(
      node->getLeadingMargin(flexColumnDirection, ownerWidth).unwrap(),
      ABI43_0_0YGEdgeTop);
  node->setLayoutMargin(
      node->getTrailingMargin(flexColumnDirection, ownerWidth).unwrap(),
      ABI43_0_0YGEdgeBottom);

  node->setLayoutBorder(node->getLeadingBorder(flexRowDirection), startEdge);
  node->setLayoutBorder(node->getTrailingBorder(flexRowDirection), endEdge);
  node->setLayoutBorder(node->getLeadingBorder(flexColumnDirection), ABI43_0_0YGEdgeTop);
  node->setLayoutBorder(
      node->getTrailingBorder(flexColumnDirection), ABI43_0_0YGEdgeBottom);

  node->setLayoutPadding(
      node->getLeadingPadding(flexRowDirection, ownerWidth).unwrap(),
      startEdge);
  node->setLayoutPadding(
      node->getTrailingPadding(flexRowDirection, ownerWidth).unwrap(), endEdge);
  node->setLayoutPadding(
      node->getLeadingPadding(flexColumnDirection, ownerWidth).unwrap(),
      ABI43_0_0YGEdgeTop);
  node->setLayoutPadding(
      node->getTrailingPadding(flexColumnDirection, ownerWidth).unwrap(),
      ABI43_0_0YGEdgeBottom);

  if (node->hasMeasureFunc()) {
    ABI43_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(
        node,
        availableWidth,
        availableHeight,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight,
        layoutMarkerData,
        layoutContext,
        reason);
    return;
  }

  const uint32_t childCount = ABI43_0_0YGNodeGetChildCount(node);
  if (childCount == 0) {
    ABI43_0_0YGNodeEmptyContainerSetMeasuredDimensions(
        node,
        availableWidth,
        availableHeight,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm
  // if we already know the size
  if (!performLayout &&
      ABI43_0_0YGNodeFixedSizeSetMeasuredDimensions(
          node,
          availableWidth,
          availableHeight,
          widthMeasureMode,
          heightMeasureMode,
          ownerWidth,
          ownerHeight)) {
    return;
  }

  // At this point we know we're going to perform work. Ensure that each child
  // has a mutable copy.
  node->cloneChildrenIfNeeded(layoutContext);
  // Reset layout flags, as they could have changed.
  node->setLayoutHadOverflow(false);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const ABI43_0_0YGFlexDirection mainAxis =
      ABI43_0_0YGResolveFlexDirection(node->getStyle().flexDirection(), direction);
  const ABI43_0_0YGFlexDirection crossAxis = ABI43_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI43_0_0YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != ABI43_0_0YGWrapNoWrap;

  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;
  const float crossAxisownerSize = isMainAxisRow ? ownerHeight : ownerWidth;

  const float leadingPaddingAndBorderCross =
      node->getLeadingPaddingAndBorder(crossAxis, ownerWidth).unwrap();
  const float paddingAndBorderAxisMain =
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, mainAxis, ownerWidth);
  const float paddingAndBorderAxisCross =
      ABI43_0_0YGNodePaddingAndBorderForAxis(node, crossAxis, ownerWidth);

  ABI43_0_0YGMeasureMode measureModeMainDim =
      isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  ABI43_0_0YGMeasureMode measureModeCrossDim =
      isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow =
      node->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, ownerWidth).unwrap();
  const float marginAxisColumn =
      node->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, ownerWidth).unwrap();

  const auto& minDimensions = node->getStyle().minDimensions();
  const auto& maxDimensions = node->getStyle().maxDimensions();
  const float minInnerWidth =
      ABI43_0_0YGResolveValue(minDimensions[ABI43_0_0YGDimensionWidth], ownerWidth).unwrap() -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      ABI43_0_0YGResolveValue(maxDimensions[ABI43_0_0YGDimensionWidth], ownerWidth).unwrap() -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      ABI43_0_0YGResolveValue(minDimensions[ABI43_0_0YGDimensionHeight], ownerHeight).unwrap() -
      paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      ABI43_0_0YGResolveValue(maxDimensions[ABI43_0_0YGDimensionHeight], ownerHeight).unwrap() -
      paddingAndBorderAxisColumn;

  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS

  float availableInnerWidth = ABI43_0_0YGNodeCalculateAvailableInnerDim(
      node, ABI43_0_0YGFlexDirectionRow, availableWidth, ownerWidth, ownerWidth);
  float availableInnerHeight = ABI43_0_0YGNodeCalculateAvailableInnerDim(
      node, ABI43_0_0YGFlexDirectionColumn, availableHeight, ownerHeight, ownerWidth);

  float availableInnerMainDim =
      isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim =
      isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM

  float totalOuterFlexBasis = ABI43_0_0YGNodeComputeFlexBasisForChildren(
      node,
      availableInnerWidth,
      availableInnerHeight,
      widthMeasureMode,
      heightMeasureMode,
      direction,
      mainAxis,
      config,
      performLayout,
      layoutMarkerData,
      layoutContext,
      depth,
      generationCount);

  const bool flexBasisOverflows = measureModeMainDim == ABI43_0_0YGMeasureModeUndefined
      ? false
      : totalOuterFlexBasis > availableInnerMainDim;
  if (isNodeFlexWrap && flexBasisOverflows &&
      measureModeMainDim == ABI43_0_0YGMeasureModeAtMost) {
    measureModeMainDim = ABI43_0_0YGMeasureModeExactly;
  }
  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  uint32_t startOfLineIndex = 0;
  uint32_t endOfLineIndex = 0;

  // Number of lines.
  uint32_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;
  ABI43_0_0YGCollectFlexItemsRowValues collectedFlexItemsValues;
  for (; endOfLineIndex < childCount;
       lineCount++, startOfLineIndex = endOfLineIndex) {
    collectedFlexItemsValues = ABI43_0_0YGCalculateCollectFlexItemsRowValues(
        node,
        ownerDirection,
        mainAxisownerSize,
        availableInnerWidth,
        availableInnerMainDim,
        startOfLineIndex,
        lineCount);
    endOfLineIndex = collectedFlexItemsValues.endOfLineIndex;

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex =
        !performLayout && measureModeCrossDim == ABI43_0_0YGMeasureModeExactly;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated. If
    // the main dimension size isn't known, it is computed based on the line
    // length, so there's no more space left to distribute.

    bool sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't
    // violate min and max
    if (measureModeMainDim != ABI43_0_0YGMeasureModeExactly) {
      if (!ABI43_0_0YGFloatIsUndefined(minInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine <
              minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (
          !ABI43_0_0YGFloatIsUndefined(maxInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine >
              maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        if (!node->getConfig()->useLegacyStretchBehaviour &&
            ((ABI43_0_0YGFloatIsUndefined(
                  collectedFlexItemsValues.totalFlexGrowFactors) &&
              collectedFlexItemsValues.totalFlexGrowFactors == 0) ||
             (ABI43_0_0YGFloatIsUndefined(node->resolveFlexGrow()) &&
              node->resolveFlexGrow() == 0))) {
          // If we don't have any children to flex or we can't flex the node
          // itself, space we've used is all space we need. Root node also
          // should be shrunk to minimum
          availableInnerMainDim =
              collectedFlexItemsValues.sizeConsumedOnCurrentLine;
        }

        if (node->getConfig()->useLegacyStretchBehaviour) {
          node->setLayoutDidUseLegacyFlag(true);
        }
        sizeBasedOnContent = !node->getConfig()->useLegacyStretchBehaviour;
      }
    }

    if (!sizeBasedOnContent && !ABI43_0_0YGFloatIsUndefined(availableInnerMainDim)) {
      collectedFlexItemsValues.remainingFreeSpace = availableInnerMainDim -
          collectedFlexItemsValues.sizeConsumedOnCurrentLine;
    } else if (collectedFlexItemsValues.sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its content. sizeConsumedOnCurrentLine is negative which means
      // the node will allocate 0 points for its content. Consequently,
      // remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
      collectedFlexItemsValues.remainingFreeSpace =
          -collectedFlexItemsValues.sizeConsumedOnCurrentLine;
    }

    if (!canSkipFlex) {
      ABI43_0_0YGResolveFlexibleLength(
          node,
          collectedFlexItemsValues,
          mainAxis,
          crossAxis,
          mainAxisownerSize,
          availableInnerMainDim,
          availableInnerCrossDim,
          availableInnerWidth,
          availableInnerHeight,
          flexBasisOverflows,
          measureModeCrossDim,
          performLayout,
          config,
          layoutMarkerData,
          layoutContext,
          depth,
          generationCount);
    }

    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow() |
        (collectedFlexItemsValues.remainingFreeSpace < 0));

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis. Their dimensions are also set in the cross axis with the exception
    // of items that are aligned "stretch". We need to compute these stretch
    // values and set the final positions.

    ABI43_0_0YGJustifyMainAxis(
        node,
        collectedFlexItemsValues,
        startOfLineIndex,
        mainAxis,
        crossAxis,
        measureModeMainDim,
        measureModeCrossDim,
        mainAxisownerSize,
        ownerWidth,
        availableInnerMainDim,
        availableInnerCrossDim,
        availableInnerWidth,
        performLayout,
        layoutContext);

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI43_0_0YGMeasureModeUndefined ||
        measureModeCrossDim == ABI43_0_0YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
          ABI43_0_0YGNodeBoundAxis(
              node,
              crossAxis,
              collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
              crossAxisownerSize,
              ownerWidth) -
          paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI43_0_0YGMeasureModeExactly) {
      collectedFlexItemsValues.crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    collectedFlexItemsValues.crossDim =
        ABI43_0_0YGNodeBoundAxis(
            node,
            crossAxis,
            collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth) -
        paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const ABI43_0_0YGNodeRef child = node->getChild(i);
        if (child->getStyle().display() == ABI43_0_0YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType() == ABI43_0_0YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right set, override all the previously computed
          // positions to set it correctly.
          const bool isChildLeadingPosDefined =
              child->isLeadingPositionDefined(crossAxis);
          if (isChildLeadingPosDefined) {
            child->setLayoutPosition(
                child->getLeadingPosition(crossAxis, availableInnerCrossDim)
                        .unwrap() +
                    node->getLeadingBorder(crossAxis) +
                    child->getLeadingMargin(crossAxis, availableInnerWidth)
                        .unwrap(),
                pos[crossAxis]);
          }
          // If leading position is not defined or calculations result in Nan,
          // default to border + margin
          if (!isChildLeadingPosDefined ||
              ABI43_0_0YGFloatIsUndefined(child->getLayout().position[pos[crossAxis]])) {
            child->setLayoutPosition(
                node->getLeadingBorder(crossAxis) +
                    child->getLeadingMargin(crossAxis, availableInnerWidth)
                        .unwrap(),
                pos[crossAxis]);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (owner) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const ABI43_0_0YGAlign alignItem = ABI43_0_0YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time forcing the cross-axis size to be the computed
          // cross size for the current line.
          if (alignItem == ABI43_0_0YGAlignStretch &&
              child->marginLeadingValue(crossAxis).unit != ABI43_0_0YGUnitAuto &&
              child->marginTrailingValue(crossAxis).unit != ABI43_0_0YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!ABI43_0_0YGNodeIsStyleDimDefined(
                    child, crossAxis, availableInnerCrossDim)) {
              float childMainSize =
                  child->getLayout().measuredDimensions[dim[mainAxis]];
              const auto& childStyle = child->getStyle();
              float childCrossSize = !childStyle.aspectRatio().isUndefined()
                  ? child->getMarginForAxis(crossAxis, availableInnerWidth)
                          .unwrap() +
                      (isMainAxisRow
                           ? childMainSize / childStyle.aspectRatio().unwrap()
                           : childMainSize * childStyle.aspectRatio().unwrap())
                  : collectedFlexItemsValues.crossDim;

              childMainSize +=
                  child->getMarginForAxis(mainAxis, availableInnerWidth)
                      .unwrap();

              ABI43_0_0YGMeasureMode childMainMeasureMode = ABI43_0_0YGMeasureModeExactly;
              ABI43_0_0YGMeasureMode childCrossMeasureMode = ABI43_0_0YGMeasureModeExactly;
              ABI43_0_0YGConstrainMaxSizeForMode(
                  child,
                  mainAxis,
                  availableInnerMainDim,
                  availableInnerWidth,
                  &childMainMeasureMode,
                  &childMainSize);
              ABI43_0_0YGConstrainMaxSizeForMode(
                  child,
                  crossAxis,
                  availableInnerCrossDim,
                  availableInnerWidth,
                  &childCrossMeasureMode,
                  &childCrossSize);

              const float childWidth =
                  isMainAxisRow ? childMainSize : childCrossSize;
              const float childHeight =
                  !isMainAxisRow ? childMainSize : childCrossSize;

              auto alignContent = node->getStyle().alignContent();
              auto crossAxisDoesNotGrow =
                  alignContent != ABI43_0_0YGAlignStretch && isNodeFlexWrap;
              const ABI43_0_0YGMeasureMode childWidthMeasureMode =
                  ABI43_0_0YGFloatIsUndefined(childWidth) ||
                      (!isMainAxisRow && crossAxisDoesNotGrow)
                  ? ABI43_0_0YGMeasureModeUndefined
                  : ABI43_0_0YGMeasureModeExactly;
              const ABI43_0_0YGMeasureMode childHeightMeasureMode =
                  ABI43_0_0YGFloatIsUndefined(childHeight) ||
                      (isMainAxisRow && crossAxisDoesNotGrow)
                  ? ABI43_0_0YGMeasureModeUndefined
                  : ABI43_0_0YGMeasureModeExactly;

              ABI43_0_0YGLayoutNodeInternal(
                  child,
                  childWidth,
                  childHeight,
                  direction,
                  childWidthMeasureMode,
                  childHeightMeasureMode,
                  availableInnerWidth,
                  availableInnerHeight,
                  true,
                  LayoutPassReason::kStretch,
                  config,
                  layoutMarkerData,
                  layoutContext,
                  depth,
                  generationCount);
            }
          } else {
            const float remainingCrossDim = containerCrossAxis -
                ABI43_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (child->marginLeadingValue(crossAxis).unit == ABI43_0_0YGUnitAuto &&
                child->marginTrailingValue(crossAxis).unit == ABI43_0_0YGUnitAuto) {
              leadingCrossDim += ABI43_0_0YGFloatMax(0.0f, remainingCrossDim / 2);
            } else if (
                child->marginTrailingValue(crossAxis).unit == ABI43_0_0YGUnitAuto) {
              // No-Op
            } else if (
                child->marginLeadingValue(crossAxis).unit == ABI43_0_0YGUnitAuto) {
              leadingCrossDim += ABI43_0_0YGFloatMax(0.0f, remainingCrossDim);
            } else if (alignItem == ABI43_0_0YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == ABI43_0_0YGAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else {
              leadingCrossDim += remainingCrossDim;
            }
          }
          // And we apply the position
          child->setLayoutPosition(
              child->getLayout().position[pos[crossAxis]] + totalLineCrossDim +
                  leadingCrossDim,
              pos[crossAxis]);
        }
      }
    }

    totalLineCrossDim += collectedFlexItemsValues.crossDim;
    maxLineMainDim =
        ABI43_0_0YGFloatMax(maxLineMainDim, collectedFlexItemsValues.mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  // currentLead stores the size of the cross dim
  if (performLayout && (isNodeFlexWrap || ABI43_0_0YGIsBaselineLayout(node))) {
    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;
    if (!ABI43_0_0YGFloatIsUndefined(availableInnerCrossDim)) {
      const float remainingAlignContentDim =
          availableInnerCrossDim - totalLineCrossDim;
      switch (node->getStyle().alignContent()) {
        case ABI43_0_0YGAlignFlexEnd:
          currentLead += remainingAlignContentDim;
          break;
        case ABI43_0_0YGAlignCenter:
          currentLead += remainingAlignContentDim / 2;
          break;
        case ABI43_0_0YGAlignStretch:
          if (availableInnerCrossDim > totalLineCrossDim) {
            crossDimLead = remainingAlignContentDim / lineCount;
          }
          break;
        case ABI43_0_0YGAlignSpaceAround:
          if (availableInnerCrossDim > totalLineCrossDim) {
            currentLead += remainingAlignContentDim / (2 * lineCount);
            if (lineCount > 1) {
              crossDimLead = remainingAlignContentDim / lineCount;
            }
          } else {
            currentLead += remainingAlignContentDim / 2;
          }
          break;
        case ABI43_0_0YGAlignSpaceBetween:
          if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
            crossDimLead = remainingAlignContentDim / (lineCount - 1);
          }
          break;
        case ABI43_0_0YGAlignAuto:
        case ABI43_0_0YGAlignFlexStart:
        case ABI43_0_0YGAlignBaseline:
          break;
      }
    }
    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      const uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      float maxAscentForCurrentLine = 0;
      float maxDescentForCurrentLine = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const ABI43_0_0YGNodeRef child = node->getChild(ii);
        if (child->getStyle().display() == ABI43_0_0YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType() != ABI43_0_0YGPositionTypeAbsolute) {
          if (child->getLineIndex() != i) {
            break;
          }
          if (ABI43_0_0YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = ABI43_0_0YGFloatMax(
                lineHeight,
                child->getLayout().measuredDimensions[dim[crossAxis]] +
                    child->getMarginForAxis(crossAxis, availableInnerWidth)
                        .unwrap());
          }
          if (ABI43_0_0YGNodeAlignItem(node, child) == ABI43_0_0YGAlignBaseline) {
            const float ascent = ABI43_0_0YGBaseline(child, layoutContext) +
                child
                    ->getLeadingMargin(
                        ABI43_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimensions[ABI43_0_0YGDimensionHeight] +
                child
                    ->getMarginForAxis(
                        ABI43_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap() -
                ascent;
            maxAscentForCurrentLine =
                ABI43_0_0YGFloatMax(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                ABI43_0_0YGFloatMax(maxDescentForCurrentLine, descent);
            lineHeight = ABI43_0_0YGFloatMax(
                lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const ABI43_0_0YGNodeRef child = node->getChild(ii);
          if (child->getStyle().display() == ABI43_0_0YGDisplayNone) {
            continue;
          }
          if (child->getStyle().positionType() != ABI43_0_0YGPositionTypeAbsolute) {
            switch (ABI43_0_0YGNodeAlignItem(node, child)) {
              case ABI43_0_0YGAlignFlexStart: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    pos[crossAxis]);
                break;
              }
              case ABI43_0_0YGAlignFlexEnd: {
                child->setLayoutPosition(
                    currentLead + lineHeight -
                        child->getTrailingMargin(crossAxis, availableInnerWidth)
                            .unwrap() -
                        child->getLayout().measuredDimensions[dim[crossAxis]],
                    pos[crossAxis]);
                break;
              }
              case ABI43_0_0YGAlignCenter: {
                float childHeight =
                    child->getLayout().measuredDimensions[dim[crossAxis]];

                child->setLayoutPosition(
                    currentLead + (lineHeight - childHeight) / 2,
                    pos[crossAxis]);
                break;
              }
              case ABI43_0_0YGAlignStretch: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    pos[crossAxis]);

                // Remeasure child with the line height as it as been only
                // measured with the owners height yet.
                if (!ABI43_0_0YGNodeIsStyleDimDefined(
                        child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth = isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[ABI43_0_0YGDimensionWidth] +
                         child->getMarginForAxis(mainAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  const float childHeight = !isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[ABI43_0_0YGDimensionHeight] +
                         child->getMarginForAxis(crossAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  if (!(ABI43_0_0YGFloatsEqual(
                            childWidth,
                            child->getLayout()
                                .measuredDimensions[ABI43_0_0YGDimensionWidth]) &&
                        ABI43_0_0YGFloatsEqual(
                            childHeight,
                            child->getLayout()
                                .measuredDimensions[ABI43_0_0YGDimensionHeight]))) {
                    ABI43_0_0YGLayoutNodeInternal(
                        child,
                        childWidth,
                        childHeight,
                        direction,
                        ABI43_0_0YGMeasureModeExactly,
                        ABI43_0_0YGMeasureModeExactly,
                        availableInnerWidth,
                        availableInnerHeight,
                        true,
                        LayoutPassReason::kMultilineStretch,
                        config,
                        layoutMarkerData,
                        layoutContext,
                        depth,
                        generationCount);
                  }
                }
                break;
              }
              case ABI43_0_0YGAlignBaseline: {
                child->setLayoutPosition(
                    currentLead + maxAscentForCurrentLine -
                        ABI43_0_0YGBaseline(child, layoutContext) +
                        child
                            ->getLeadingPosition(
                                ABI43_0_0YGFlexDirectionColumn, availableInnerCrossDim)
                            .unwrap(),
                    ABI43_0_0YGEdgeTop);

                break;
              }
              case ABI43_0_0YGAlignAuto:
              case ABI43_0_0YGAlignSpaceBetween:
              case ABI43_0_0YGAlignSpaceAround:
                break;
            }
          }
        }
      }
      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS

  node->setLayoutMeasuredDimension(
      ABI43_0_0YGNodeBoundAxis(
          node,
          ABI43_0_0YGFlexDirectionRow,
          availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      ABI43_0_0YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      ABI43_0_0YGNodeBoundAxis(
          node,
          ABI43_0_0YGFlexDirectionColumn,
          availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      ABI43_0_0YGDimensionHeight);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI43_0_0YGMeasureModeUndefined ||
      (node->getStyle().overflow() != ABI43_0_0YGOverflowScroll &&
       measureModeMainDim == ABI43_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node, mainAxis, maxLineMainDim, mainAxisownerSize, ownerWidth),
        dim[mainAxis]);

  } else if (
      measureModeMainDim == ABI43_0_0YGMeasureModeAtMost &&
      node->getStyle().overflow() == ABI43_0_0YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        ABI43_0_0YGFloatMax(
            ABI43_0_0YGFloatMin(
                availableInnerMainDim + paddingAndBorderAxisMain,
                ABI43_0_0YGNodeBoundAxisWithinMinAndMax(
                    node,
                    mainAxis,
                    ABI43_0_0YGFloatOptional{maxLineMainDim},
                    mainAxisownerSize)
                    .unwrap()),
            paddingAndBorderAxisMain),
        dim[mainAxis]);
  }

  if (measureModeCrossDim == ABI43_0_0YGMeasureModeUndefined ||
      (node->getStyle().overflow() != ABI43_0_0YGOverflowScroll &&
       measureModeCrossDim == ABI43_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        ABI43_0_0YGNodeBoundAxis(
            node,
            crossAxis,
            totalLineCrossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth),
        dim[crossAxis]);

  } else if (
      measureModeCrossDim == ABI43_0_0YGMeasureModeAtMost &&
      node->getStyle().overflow() == ABI43_0_0YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        ABI43_0_0YGFloatMax(
            ABI43_0_0YGFloatMin(
                availableInnerCrossDim + paddingAndBorderAxisCross,
                ABI43_0_0YGNodeBoundAxisWithinMinAndMax(
                    node,
                    crossAxis,
                    ABI43_0_0YGFloatOptional{totalLineCrossDim +
                                    paddingAndBorderAxisCross},
                    crossAxisownerSize)
                    .unwrap()),
            paddingAndBorderAxisCross),
        dim[crossAxis]);
  }

  // As we only wrapped in normal direction yet, we need to reverse the
  // positions on wrap-reverse.
  if (performLayout && node->getStyle().flexWrap() == ABI43_0_0YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI43_0_0YGNodeRef child = ABI43_0_0YGNodeGetChild(node, i);
      if (child->getStyle().positionType() != ABI43_0_0YGPositionTypeAbsolute) {
        child->setLayoutPosition(
            node->getLayout().measuredDimensions[dim[crossAxis]] -
                child->getLayout().position[pos[crossAxis]] -
                child->getLayout().measuredDimensions[dim[crossAxis]],
            pos[crossAxis]);
      }
    }
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (auto child : node->getChildren()) {
      if (child->getStyle().positionType() != ABI43_0_0YGPositionTypeAbsolute) {
        continue;
      }
      ABI43_0_0YGNodeAbsoluteLayoutChild(
          node,
          child,
          availableInnerWidth,
          isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
          availableInnerHeight,
          direction,
          config,
          layoutMarkerData,
          layoutContext,
          depth,
          generationCount);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos = mainAxis == ABI43_0_0YGFlexDirectionRowReverse ||
        mainAxis == ABI43_0_0YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos = crossAxis == ABI43_0_0YGFlexDirectionRowReverse ||
        crossAxis == ABI43_0_0YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI43_0_0YGNodeRef child = node->getChild(i);
        if (child->getStyle().display() == ABI43_0_0YGDisplayNone) {
          continue;
        }
        if (needsMainTrailingPos) {
          ABI43_0_0YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          ABI43_0_0YGNodeSetChildTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

bool gPrintChanges = false;
bool gPrintSkips = false;

static const char* spacer =
    "                                                            ";

static const char* ABI43_0_0YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char* ABI43_0_0YGMeasureModeName(
    const ABI43_0_0YGMeasureMode mode,
    const bool performLayout) {
  constexpr auto N = enums::count<ABI43_0_0YGMeasureMode>();
  const char* kMeasureModeNames[N] = {"UNDEFINED", "ABI43_0_0EXACTLY", "AT_MOST"};
  const char* kLayoutModeNames[N] = {
      "LAY_UNDEFINED", "LAY_EXACTLY", "LAY_AT_MOST"};

  if (mode >= N) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool ABI43_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
    ABI43_0_0YGMeasureMode sizeMode,
    float size,
    float lastComputedSize) {
  return sizeMode == ABI43_0_0YGMeasureModeExactly &&
      ABI43_0_0YGFloatsEqual(size, lastComputedSize);
}

static inline bool ABI43_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
    ABI43_0_0YGMeasureMode sizeMode,
    float size,
    ABI43_0_0YGMeasureMode lastSizeMode,
    float lastComputedSize) {
  return sizeMode == ABI43_0_0YGMeasureModeAtMost &&
      lastSizeMode == ABI43_0_0YGMeasureModeUndefined &&
      (size >= lastComputedSize || ABI43_0_0YGFloatsEqual(size, lastComputedSize));
}

static inline bool ABI43_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
    ABI43_0_0YGMeasureMode sizeMode,
    float size,
    ABI43_0_0YGMeasureMode lastSizeMode,
    float lastSize,
    float lastComputedSize) {
  return lastSizeMode == ABI43_0_0YGMeasureModeAtMost &&
      sizeMode == ABI43_0_0YGMeasureModeAtMost && !ABI43_0_0YGFloatIsUndefined(lastSize) &&
      !ABI43_0_0YGFloatIsUndefined(size) && !ABI43_0_0YGFloatIsUndefined(lastComputedSize) &&
      lastSize > size &&
      (lastComputedSize <= size || ABI43_0_0YGFloatsEqual(size, lastComputedSize));
}

YOGA_EXPORT float ABI43_0_0YGRoundValueToPixelGrid(
    const double value,
    const double pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor) {
  double scaledValue = ((double) value) * pointScaleFactor;
  // We want to calculate `fractial` such that `floor(scaledValue) = scaledValue
  // - fractial`.
  double fractial = fmod(scaledValue, 1.0f);
  if (fractial < 0) {
    // This branch is for handling negative numbers for `value`.
    //
    // Regarding `floor` and `ceil`. Note that for a number x, `floor(x) <= x <=
    // ceil(x)` even for negative numbers. Here are a couple of examples:
    //   - x =  2.2: floor( 2.2) =  2, ceil( 2.2) =  3
    //   - x = -2.2: floor(-2.2) = -3, ceil(-2.2) = -2
    //
    // Regarding `fmodf`. For fractional negative numbers, `fmodf` returns a
    // negative number. For example, `fmodf(-2.2) = -0.2`. However, we want
    // `fractial` to be the number such that subtracting it from `value` will
    // give us `floor(value)`. In the case of negative numbers, adding 1 to
    // `fmodf(value)` gives us this. Let's continue the example from above:
    //   - fractial = fmodf(-2.2) = -0.2
    //   - Add 1 to the fraction: fractial2 = fractial + 1 = -0.2 + 1 = 0.8
    //   - Finding the `floor`: -2.2 - fractial2 = -2.2 - 0.8 = -3
    ++fractial;
  }
  if (ABI43_0_0YGDoubleEqual(fractial, 0)) {
    // First we check if the value is already rounded
    scaledValue = scaledValue - fractial;
  } else if (ABI43_0_0YGDoubleEqual(fractial, 1.0f)) {
    scaledValue = scaledValue - fractial + 1.0f;
  } else if (forceCeil) {
    // Next we check if we need to use forced rounding
    scaledValue = scaledValue - fractial + 1.0f;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    // Finally we just round the value
    scaledValue = scaledValue - fractial +
        (!ABI43_0_0YGFloatIsUndefined(fractial) &&
                 (fractial > 0.5f || ABI43_0_0YGDoubleEqual(fractial, 0.5f))
             ? 1.0f
             : 0.0f);
  }
  return (ABI43_0_0YGFloatIsUndefined(scaledValue) ||
          ABI43_0_0YGFloatIsUndefined(pointScaleFactor))
      ? ABI43_0_0YGUndefined
      : scaledValue / pointScaleFactor;
}

YOGA_EXPORT bool ABI43_0_0YGNodeCanUseCachedMeasurement(
    const ABI43_0_0YGMeasureMode widthMode,
    const float width,
    const ABI43_0_0YGMeasureMode heightMode,
    const float height,
    const ABI43_0_0YGMeasureMode lastWidthMode,
    const float lastWidth,
    const ABI43_0_0YGMeasureMode lastHeightMode,
    const float lastHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const ABI43_0_0YGConfigRef config) {
  if ((!ABI43_0_0YGFloatIsUndefined(lastComputedHeight) && lastComputedHeight < 0) ||
      (!ABI43_0_0YGFloatIsUndefined(lastComputedWidth) && lastComputedWidth < 0)) {
    return false;
  }
  bool useRoundedComparison =
      config != nullptr && config->pointScaleFactor != 0;
  const float effectiveWidth = useRoundedComparison
      ? ABI43_0_0YGRoundValueToPixelGrid(width, config->pointScaleFactor, false, false)
      : width;
  const float effectiveHeight = useRoundedComparison
      ? ABI43_0_0YGRoundValueToPixelGrid(height, config->pointScaleFactor, false, false)
      : height;
  const float effectiveLastWidth = useRoundedComparison
      ? ABI43_0_0YGRoundValueToPixelGrid(
            lastWidth, config->pointScaleFactor, false, false)
      : lastWidth;
  const float effectiveLastHeight = useRoundedComparison
      ? ABI43_0_0YGRoundValueToPixelGrid(
            lastHeight, config->pointScaleFactor, false, false)
      : lastHeight;

  const bool hasSameWidthSpec = lastWidthMode == widthMode &&
      ABI43_0_0YGFloatsEqual(effectiveLastWidth, effectiveWidth);
  const bool hasSameHeightSpec = lastHeightMode == heightMode &&
      ABI43_0_0YGFloatsEqual(effectiveLastHeight, effectiveHeight);

  const bool widthIsCompatible =
      hasSameWidthSpec ||
      ABI43_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
          widthMode, width - marginRow, lastComputedWidth) ||
      ABI43_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
          widthMode, width - marginRow, lastWidthMode, lastComputedWidth) ||
      ABI43_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode,
          width - marginRow,
          lastWidthMode,
          lastWidth,
          lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec ||
      ABI43_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
          heightMode, height - marginColumn, lastComputedHeight) ||
      ABI43_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
          heightMode,
          height - marginColumn,
          lastHeightMode,
          lastComputedHeight) ||
      ABI43_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode,
          height - marginColumn,
          lastHeightMode,
          lastHeight,
          lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the ABI43_0_0YGNodelayoutImpl function. It determines whether
// the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as ABI43_0_0YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool ABI43_0_0YGLayoutNodeInternal(
    const ABI43_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI43_0_0YGDirection ownerDirection,
    const ABI43_0_0YGMeasureMode widthMeasureMode,
    const ABI43_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    const ABI43_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    uint32_t depth,
    const uint32_t generationCount) {
  ABI43_0_0YGLayout* layout = &node->getLayout();

  depth++;

  const bool needToVisitNode =
      (node->isDirty() && layout->generationCount != generationCount) ||
      layout->lastOwnerDirection != ownerDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.availableWidth = -1;
    layout->cachedLayout.availableHeight = -1;
    layout->cachedLayout.widthMeasureMode = ABI43_0_0YGMeasureModeUndefined;
    layout->cachedLayout.heightMeasureMode = ABI43_0_0YGMeasureModeUndefined;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  ABI43_0_0YGCachedMeasurement* cachedResults = nullptr;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions and dimensions for nodes in the subtree. The algorithm assumes
  // that each node gets layed out a maximum of one time per tree layout, but
  // multiple measurements may be required to resolve all of the flex
  // dimensions. We handle nodes with measure functions specially here because
  // they are the most expensive to measure, so it's worth avoiding redundant
  // measurements if at all possible.
  if (node->hasMeasureFunc()) {
    const float marginAxisRow =
        node->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, ownerWidth).unwrap();
    const float marginAxisColumn =
        node->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, ownerWidth).unwrap();

    // First, try to use the layout cache.
    if (ABI43_0_0YGNodeCanUseCachedMeasurement(
            widthMeasureMode,
            availableWidth,
            heightMeasureMode,
            availableHeight,
            layout->cachedLayout.widthMeasureMode,
            layout->cachedLayout.availableWidth,
            layout->cachedLayout.heightMeasureMode,
            layout->cachedLayout.availableHeight,
            layout->cachedLayout.computedWidth,
            layout->cachedLayout.computedHeight,
            marginAxisRow,
            marginAxisColumn,
            config)) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (ABI43_0_0YGNodeCanUseCachedMeasurement(
                widthMeasureMode,
                availableWidth,
                heightMeasureMode,
                availableHeight,
                layout->cachedMeasurements[i].widthMeasureMode,
                layout->cachedMeasurements[i].availableWidth,
                layout->cachedMeasurements[i].heightMeasureMode,
                layout->cachedMeasurements[i].availableHeight,
                layout->cachedMeasurements[i].computedWidth,
                layout->cachedMeasurements[i].computedHeight,
                marginAxisRow,
                marginAxisColumn,
                config)) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (ABI43_0_0YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        ABI43_0_0YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (ABI43_0_0YGFloatsEqual(
              layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          ABI43_0_0YGFloatsEqual(
              layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode ==
              heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != nullptr) {
    layout->measuredDimensions[ABI43_0_0YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI43_0_0YGDimensionHeight] =
        cachedResults->computedHeight;

    (performLayout ? layoutMarkerData.cachedLayouts
                   : layoutMarkerData.cachedMeasures) += 1;

    if (gPrintChanges && gPrintSkips) {
      Log::log(
          node,
          ABI43_0_0YGLogLevelVerbose,
          nullptr,
          "%s%d.{[skipped] ",
          ABI43_0_0YGSpacer(depth),
          depth);
      node->print(layoutContext);
      Log::log(
          node,
          ABI43_0_0YGLogLevelVerbose,
          nullptr,
          "wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
          ABI43_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI43_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          cachedResults->computedWidth,
          cachedResults->computedHeight,
          LayoutPassReasonToString(reason));
    }
  } else {
    if (gPrintChanges) {
      Log::log(
          node,
          ABI43_0_0YGLogLevelVerbose,
          nullptr,
          "%s%d.{%s",
          ABI43_0_0YGSpacer(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print(layoutContext);
      Log::log(
          node,
          ABI43_0_0YGLogLevelVerbose,
          nullptr,
          "wm: %s, hm: %s, aw: %f ah: %f %s\n",
          ABI43_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI43_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          LayoutPassReasonToString(reason));
    }

    ABI43_0_0YGNodelayoutImpl(
        node,
        availableWidth,
        availableHeight,
        ownerDirection,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight,
        performLayout,
        config,
        layoutMarkerData,
        layoutContext,
        depth,
        generationCount,
        reason);

    if (gPrintChanges) {
      Log::log(
          node,
          ABI43_0_0YGLogLevelVerbose,
          nullptr,
          "%s%d.}%s",
          ABI43_0_0YGSpacer(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print(layoutContext);
      Log::log(
          node,
          ABI43_0_0YGLogLevelVerbose,
          nullptr,
          "wm: %s, hm: %s, d: (%f, %f) %s\n",
          ABI43_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI43_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          layout->measuredDimensions[ABI43_0_0YGDimensionWidth],
          layout->measuredDimensions[ABI43_0_0YGDimensionHeight],
          LayoutPassReasonToString(reason));
    }

    layout->lastOwnerDirection = ownerDirection;

    if (cachedResults == nullptr) {
      if (layout->nextCachedMeasurementsIndex + 1 >
          (uint32_t) layoutMarkerData.maxMeasureCache) {
        layoutMarkerData.maxMeasureCache =
            layout->nextCachedMeasurementsIndex + 1;
      }
      if (layout->nextCachedMeasurementsIndex == ABI43_0_0YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          Log::log(node, ABI43_0_0YGLogLevelVerbose, nullptr, "Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI43_0_0YGCachedMeasurement* newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cachedLayout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry =
            &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth =
          layout->measuredDimensions[ABI43_0_0YGDimensionWidth];
      newCacheEntry->computedHeight =
          layout->measuredDimensions[ABI43_0_0YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[ABI43_0_0YGDimensionWidth],
        ABI43_0_0YGDimensionWidth);
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[ABI43_0_0YGDimensionHeight],
        ABI43_0_0YGDimensionHeight);

    node->setHasNewLayout(true);
    node->setDirty(false);
  }

  layout->generationCount = generationCount;

  LayoutType layoutType;
  if (performLayout) {
    layoutType = !needToVisitNode && cachedResults == &layout->cachedLayout
        ? LayoutType::kCachedLayout
        : LayoutType::kLayout;
  } else {
    layoutType = cachedResults != nullptr ? LayoutType::kCachedMeasure
                                          : LayoutType::kMeasure;
  }
  Event::publish<Event::NodeLayout>(node, {layoutType, layoutContext});

  return (needToVisitNode || cachedResults == nullptr);
}

YOGA_EXPORT void ABI43_0_0YGConfigSetPointScaleFactor(
    const ABI43_0_0YGConfigRef config,
    const float pixelsInPoint) {
  ABI43_0_0YGAssertWithConfig(
      config,
      pixelsInPoint >= 0.0f,
      "Scale factor should not be less than zero");

  // We store points for Pixel as we will use it for rounding
  if (pixelsInPoint == 0.0f) {
    // Zero is used to skip rounding
    config->pointScaleFactor = 0.0f;
  } else {
    config->pointScaleFactor = pixelsInPoint;
  }
}

static void ABI43_0_0YGRoundToPixelGrid(
    const ABI43_0_0YGNodeRef node,
    const double pointScaleFactor,
    const double absoluteLeft,
    const double absoluteTop) {
  if (pointScaleFactor == 0.0f) {
    return;
  }

  const double nodeLeft = node->getLayout().position[ABI43_0_0YGEdgeLeft];
  const double nodeTop = node->getLayout().position[ABI43_0_0YGEdgeTop];

  const double nodeWidth = node->getLayout().dimensions[ABI43_0_0YGDimensionWidth];
  const double nodeHeight = node->getLayout().dimensions[ABI43_0_0YGDimensionHeight];

  const double absoluteNodeLeft = absoluteLeft + nodeLeft;
  const double absoluteNodeTop = absoluteTop + nodeTop;

  const double absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const double absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  // If a node has a custom measure function we never want to round down its
  // size as this could lead to unwanted text truncation.
  const bool textRounding = node->getNodeType() == ABI43_0_0YGNodeTypeText;

  node->setLayoutPosition(
      ABI43_0_0YGRoundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding),
      ABI43_0_0YGEdgeLeft);

  node->setLayoutPosition(
      ABI43_0_0YGRoundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding),
      ABI43_0_0YGEdgeTop);

  // We multiply dimension by scale factor and if the result is close to the
  // whole number, we don't have any fraction To verify if the result is close
  // to whole number we want to check both floor and ceil numbers
  const bool hasFractionalWidth =
      !ABI43_0_0YGDoubleEqual(fmod(nodeWidth * pointScaleFactor, 1.0), 0) &&
      !ABI43_0_0YGDoubleEqual(fmod(nodeWidth * pointScaleFactor, 1.0), 1.0);
  const bool hasFractionalHeight =
      !ABI43_0_0YGDoubleEqual(fmod(nodeHeight * pointScaleFactor, 1.0), 0) &&
      !ABI43_0_0YGDoubleEqual(fmod(nodeHeight * pointScaleFactor, 1.0), 1.0);

  node->setLayoutDimension(
      ABI43_0_0YGRoundValueToPixelGrid(
          absoluteNodeRight,
          pointScaleFactor,
          (textRounding && hasFractionalWidth),
          (textRounding && !hasFractionalWidth)) -
          ABI43_0_0YGRoundValueToPixelGrid(
              absoluteNodeLeft, pointScaleFactor, false, textRounding),
      ABI43_0_0YGDimensionWidth);

  node->setLayoutDimension(
      ABI43_0_0YGRoundValueToPixelGrid(
          absoluteNodeBottom,
          pointScaleFactor,
          (textRounding && hasFractionalHeight),
          (textRounding && !hasFractionalHeight)) -
          ABI43_0_0YGRoundValueToPixelGrid(
              absoluteNodeTop, pointScaleFactor, false, textRounding),
      ABI43_0_0YGDimensionHeight);

  const uint32_t childCount = ABI43_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    ABI43_0_0YGRoundToPixelGrid(
        ABI43_0_0YGNodeGetChild(node, i),
        pointScaleFactor,
        absoluteNodeLeft,
        absoluteNodeTop);
  }
}

static void unsetUseLegacyFlagRecursively(ABI43_0_0YGNodeRef node) {
  node->getConfig()->useLegacyStretchBehaviour = false;
  for (auto child : node->getChildren()) {
    unsetUseLegacyFlagRecursively(child);
  }
}

YOGA_EXPORT void ABI43_0_0YGNodeCalculateLayoutWithContext(
    const ABI43_0_0YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const ABI43_0_0YGDirection ownerDirection,
    void* layoutContext) {

  Event::publish<Event::LayoutPassStart>(node, {layoutContext});
  LayoutData markerData = {};

  // Increment the generation count. This will force the recursive routine to
  // visit all dirty nodes at least once. Subsequent visits will be skipped if
  // the input parameters don't change.
  gCurrentGenerationCount.fetch_add(1, std::memory_order_relaxed);
  node->resolveDimension();
  float width = ABI43_0_0YGUndefined;
  ABI43_0_0YGMeasureMode widthMeasureMode = ABI43_0_0YGMeasureModeUndefined;
  const auto& maxDimensions = node->getStyle().maxDimensions();
  if (ABI43_0_0YGNodeIsStyleDimDefined(node, ABI43_0_0YGFlexDirectionRow, ownerWidth)) {
    width =
        (ABI43_0_0YGResolveValue(
             node->getResolvedDimension(dim[ABI43_0_0YGFlexDirectionRow]), ownerWidth) +
         node->getMarginForAxis(ABI43_0_0YGFlexDirectionRow, ownerWidth))
            .unwrap();
    widthMeasureMode = ABI43_0_0YGMeasureModeExactly;
  } else if (!ABI43_0_0YGResolveValue(maxDimensions[ABI43_0_0YGDimensionWidth], ownerWidth)
                  .isUndefined()) {
    width =
        ABI43_0_0YGResolveValue(maxDimensions[ABI43_0_0YGDimensionWidth], ownerWidth).unwrap();
    widthMeasureMode = ABI43_0_0YGMeasureModeAtMost;
  } else {
    width = ownerWidth;
    widthMeasureMode = ABI43_0_0YGFloatIsUndefined(width) ? ABI43_0_0YGMeasureModeUndefined
                                                 : ABI43_0_0YGMeasureModeExactly;
  }

  float height = ABI43_0_0YGUndefined;
  ABI43_0_0YGMeasureMode heightMeasureMode = ABI43_0_0YGMeasureModeUndefined;
  if (ABI43_0_0YGNodeIsStyleDimDefined(node, ABI43_0_0YGFlexDirectionColumn, ownerHeight)) {
    height = (ABI43_0_0YGResolveValue(
                  node->getResolvedDimension(dim[ABI43_0_0YGFlexDirectionColumn]),
                  ownerHeight) +
              node->getMarginForAxis(ABI43_0_0YGFlexDirectionColumn, ownerWidth))
                 .unwrap();
    heightMeasureMode = ABI43_0_0YGMeasureModeExactly;
  } else if (!ABI43_0_0YGResolveValue(maxDimensions[ABI43_0_0YGDimensionHeight], ownerHeight)
                  .isUndefined()) {
    height =
        ABI43_0_0YGResolveValue(maxDimensions[ABI43_0_0YGDimensionHeight], ownerHeight).unwrap();
    heightMeasureMode = ABI43_0_0YGMeasureModeAtMost;
  } else {
    height = ownerHeight;
    heightMeasureMode = ABI43_0_0YGFloatIsUndefined(height) ? ABI43_0_0YGMeasureModeUndefined
                                                   : ABI43_0_0YGMeasureModeExactly;
  }
  if (ABI43_0_0YGLayoutNodeInternal(
          node,
          width,
          height,
          ownerDirection,
          widthMeasureMode,
          heightMeasureMode,
          ownerWidth,
          ownerHeight,
          true,
          LayoutPassReason::kInitial,
          node->getConfig(),
          markerData,
          layoutContext,
          0, // tree root
          gCurrentGenerationCount.load(std::memory_order_relaxed))) {
    node->setPosition(
        node->getLayout().direction(), ownerWidth, ownerHeight, ownerWidth);
    ABI43_0_0YGRoundToPixelGrid(node, node->getConfig()->pointScaleFactor, 0.0f, 0.0f);

#ifdef DEBUG
    if (node->getConfig()->printTree) {
      ABI43_0_0YGNodePrint(
          node,
          (ABI43_0_0YGPrintOptions)(
              ABI43_0_0YGPrintOptionsLayout | ABI43_0_0YGPrintOptionsChildren |
              ABI43_0_0YGPrintOptionsStyle));
    }
#endif
  }

  Event::publish<Event::LayoutPassEnd>(node, {layoutContext, &markerData});

  // We want to get rid off `useLegacyStretchBehaviour` from ABI43_0_0YGConfig. But we
  // aren't sure whether client's of yoga have gotten rid off this flag or not.
  // So logging this in ABI43_0_0YGLayout would help to find out the call sites depending
  // on this flag. This check would be removed once we are sure no one is
  // dependent on this flag anymore. The flag
  // `shouldDiffLayoutWithoutLegacyStretchBehaviour` in ABI43_0_0YGConfig will help to
  // run experiments.
  if (node->getConfig()->shouldDiffLayoutWithoutLegacyStretchBehaviour &&
      node->didUseLegacyFlag()) {
    const ABI43_0_0YGNodeRef nodeWithoutLegacyFlag = ABI43_0_0YGNodeDeepClone(node);
    nodeWithoutLegacyFlag->resolveDimension();
    // Recursively mark nodes as dirty
    nodeWithoutLegacyFlag->markDirtyAndPropogateDownwards();
    gCurrentGenerationCount.fetch_add(1, std::memory_order_relaxed);
    // Rerun the layout, and calculate the diff
    unsetUseLegacyFlagRecursively(nodeWithoutLegacyFlag);
    LayoutData layoutMarkerData = {};
    if (ABI43_0_0YGLayoutNodeInternal(
            nodeWithoutLegacyFlag,
            width,
            height,
            ownerDirection,
            widthMeasureMode,
            heightMeasureMode,
            ownerWidth,
            ownerHeight,
            true,
            LayoutPassReason::kInitial,
            nodeWithoutLegacyFlag->getConfig(),
            layoutMarkerData,
            layoutContext,
            0, // tree root
            gCurrentGenerationCount.load(std::memory_order_relaxed))) {
      nodeWithoutLegacyFlag->setPosition(
          nodeWithoutLegacyFlag->getLayout().direction(),
          ownerWidth,
          ownerHeight,
          ownerWidth);
      ABI43_0_0YGRoundToPixelGrid(
          nodeWithoutLegacyFlag,
          nodeWithoutLegacyFlag->getConfig()->pointScaleFactor,
          0.0f,
          0.0f);

      // Set whether the two layouts are different or not.
      auto neededLegacyStretchBehaviour =
          !nodeWithoutLegacyFlag->isLayoutTreeEqualToNode(*node);
      node->setLayoutDoesLegacyFlagAffectsLayout(neededLegacyStretchBehaviour);

#ifdef DEBUG
      if (nodeWithoutLegacyFlag->getConfig()->printTree) {
        ABI43_0_0YGNodePrint(
            nodeWithoutLegacyFlag,
            (ABI43_0_0YGPrintOptions)(
                ABI43_0_0YGPrintOptionsLayout | ABI43_0_0YGPrintOptionsChildren |
                ABI43_0_0YGPrintOptionsStyle));
      }
#endif
    }
    ABI43_0_0YGConfigFreeRecursive(nodeWithoutLegacyFlag);
    ABI43_0_0YGNodeFreeRecursive(nodeWithoutLegacyFlag);
  }
}

YOGA_EXPORT void ABI43_0_0YGNodeCalculateLayout(
    const ABI43_0_0YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const ABI43_0_0YGDirection ownerDirection) {
  ABI43_0_0YGNodeCalculateLayoutWithContext(
      node, ownerWidth, ownerHeight, ownerDirection, nullptr);
}

YOGA_EXPORT void ABI43_0_0YGConfigSetLogger(const ABI43_0_0YGConfigRef config, ABI43_0_0YGLogger logger) {
  if (logger != nullptr) {
    config->setLogger(logger);
  } else {
#ifdef ANDROID
    config->setLogger(&ABI43_0_0YGAndroidLog);
#else
    config->setLogger(&ABI43_0_0YGDefaultLog);
#endif
  }
}

YOGA_EXPORT void ABI43_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const ABI43_0_0YGConfigRef config,
    const bool shouldDiffLayout) {
  config->shouldDiffLayoutWithoutLegacyStretchBehaviour = shouldDiffLayout;
}

void ABI43_0_0YGAssert(const bool condition, const char* message) {
  if (!condition) {
    Log::log(ABI43_0_0YGNodeRef{nullptr}, ABI43_0_0YGLogLevelFatal, nullptr, "%s\n", message);
    throwLogicalErrorWithMessage(message);
  }
}

void ABI43_0_0YGAssertWithNode(
    const ABI43_0_0YGNodeRef node,
    const bool condition,
    const char* message) {
  if (!condition) {
    Log::log(node, ABI43_0_0YGLogLevelFatal, nullptr, "%s\n", message);
    throwLogicalErrorWithMessage(message);
  }
}

void ABI43_0_0YGAssertWithConfig(
    const ABI43_0_0YGConfigRef config,
    const bool condition,
    const char* message) {
  if (!condition) {
    Log::log(config, ABI43_0_0YGLogLevelFatal, nullptr, "%s\n", message);
    throwLogicalErrorWithMessage(message);
  }
}

YOGA_EXPORT void ABI43_0_0YGConfigSetExperimentalFeatureEnabled(
    const ABI43_0_0YGConfigRef config,
    const ABI43_0_0YGExperimentalFeature feature,
    const bool enabled) {
  config->experimentalFeatures[feature] = enabled;
}

inline bool ABI43_0_0YGConfigIsExperimentalFeatureEnabled(
    const ABI43_0_0YGConfigRef config,
    const ABI43_0_0YGExperimentalFeature feature) {
  return config->experimentalFeatures[feature];
}

YOGA_EXPORT void ABI43_0_0YGConfigSetUseWebDefaults(
    const ABI43_0_0YGConfigRef config,
    const bool enabled) {
  config->useWebDefaults = enabled;
}

YOGA_EXPORT void ABI43_0_0YGConfigSetUseLegacyStretchBehaviour(
    const ABI43_0_0YGConfigRef config,
    const bool useLegacyStretchBehaviour) {
  config->useLegacyStretchBehaviour = useLegacyStretchBehaviour;
}

bool ABI43_0_0YGConfigGetUseWebDefaults(const ABI43_0_0YGConfigRef config) {
  return config->useWebDefaults;
}

YOGA_EXPORT void ABI43_0_0YGConfigSetContext(const ABI43_0_0YGConfigRef config, void* context) {
  config->context = context;
}

YOGA_EXPORT void* ABI43_0_0YGConfigGetContext(const ABI43_0_0YGConfigRef config) {
  return config->context;
}

YOGA_EXPORT void ABI43_0_0YGConfigSetCloneNodeFunc(
    const ABI43_0_0YGConfigRef config,
    const ABI43_0_0YGCloneNodeFunc callback) {
  config->setCloneNodeCallback(callback);
}

static void ABI43_0_0YGTraverseChildrenPreOrder(
    const ABI43_0_0YGVector& children,
    const std::function<void(ABI43_0_0YGNodeRef node)>& f) {
  for (ABI43_0_0YGNodeRef node : children) {
    f(node);
    ABI43_0_0YGTraverseChildrenPreOrder(node->getChildren(), f);
  }
}

void ABI43_0_0YGTraversePreOrder(
    ABI43_0_0YGNodeRef const node,
    std::function<void(ABI43_0_0YGNodeRef node)>&& f) {
  if (!node) {
    return;
  }
  f(node);
  ABI43_0_0YGTraverseChildrenPreOrder(node->getChildren(), f);
}
