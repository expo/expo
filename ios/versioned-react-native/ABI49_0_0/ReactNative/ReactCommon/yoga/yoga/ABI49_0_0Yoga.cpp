/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0Yoga.h"
#include "ABI49_0_0log.h"
#include <float.h>
#include <string.h>
#include <algorithm>
#include <atomic>
#include <memory>
#include "ABI49_0_0Utils.h"
#include "ABI49_0_0YGNode.h"
#include "ABI49_0_0YGNodePrint.h"
#include "ABI49_0_0Yoga-internal.h"
#include "event/ABI49_0_0event.h"
#ifdef _MSC_VER
#include <float.h>

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
#endif
#endif

using namespace ABI49_0_0facebook::yoga;
using detail::Log;

#ifdef ANDROID
static int ABI49_0_0YGAndroidLog(
    const ABI49_0_0YGConfigRef config,
    const ABI49_0_0YGNodeRef node,
    ABI49_0_0YGLogLevel level,
    const char* format,
    va_list args);
#else
static int ABI49_0_0YGDefaultLog(
    const ABI49_0_0YGConfigRef config,
    const ABI49_0_0YGNodeRef node,
    ABI49_0_0YGLogLevel level,
    const char* format,
    va_list args);
#endif

#ifdef ANDROID
#include <android/log.h>
static int ABI49_0_0YGAndroidLog(
    const ABI49_0_0YGConfigRef config,
    const ABI49_0_0YGNodeRef node,
    ABI49_0_0YGLogLevel level,
    const char* format,
    va_list args) {
  int androidLevel = ABI49_0_0YGLogLevelDebug;
  switch (level) {
    case ABI49_0_0YGLogLevelFatal:
      androidLevel = ANDROID_LOG_FATAL;
      break;
    case ABI49_0_0YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case ABI49_0_0YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case ABI49_0_0YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case ABI49_0_0YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case ABI49_0_0YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
  }
  const int result = __android_log_vprint(androidLevel, "yoga", format, args);
  return result;
}
#else
#define ABI49_0_0YG_UNUSED(x) (void) (x);

static int ABI49_0_0YGDefaultLog(
    const ABI49_0_0YGConfigRef config,
    const ABI49_0_0YGNodeRef node,
    ABI49_0_0YGLogLevel level,
    const char* format,
    va_list args) {
  ABI49_0_0YG_UNUSED(config);
  ABI49_0_0YG_UNUSED(node);
  switch (level) {
    case ABI49_0_0YGLogLevelError:
    case ABI49_0_0YGLogLevelFatal:
      return vfprintf(stderr, format, args);
    case ABI49_0_0YGLogLevelWarn:
    case ABI49_0_0YGLogLevelInfo:
    case ABI49_0_0YGLogLevelDebug:
    case ABI49_0_0YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}

#undef ABI49_0_0YG_UNUSED
#endif

static inline bool ABI49_0_0YGDoubleIsUndefined(const double value) {
  return ABI49_0_0facebook::yoga::isUndefined(value);
}

YOGA_EXPORT bool ABI49_0_0YGFloatIsUndefined(const float value) {
  return ABI49_0_0facebook::yoga::isUndefined(value);
}

YOGA_EXPORT void* ABI49_0_0YGNodeGetContext(ABI49_0_0YGNodeRef node) {
  return node->getContext();
}

YOGA_EXPORT void ABI49_0_0YGNodeSetContext(ABI49_0_0YGNodeRef node, void* context) {
  return node->setContext(context);
}

YOGA_EXPORT bool ABI49_0_0YGNodeHasMeasureFunc(ABI49_0_0YGNodeRef node) {
  return node->hasMeasureFunc();
}

YOGA_EXPORT void ABI49_0_0YGNodeSetMeasureFunc(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGMeasureFunc measureFunc) {
  node->setMeasureFunc(measureFunc);
}

YOGA_EXPORT bool ABI49_0_0YGNodeHasBaselineFunc(ABI49_0_0YGNodeRef node) {
  return node->hasBaselineFunc();
}

YOGA_EXPORT void ABI49_0_0YGNodeSetBaselineFunc(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGBaselineFunc baselineFunc) {
  node->setBaselineFunc(baselineFunc);
}

YOGA_EXPORT ABI49_0_0YGDirtiedFunc ABI49_0_0YGNodeGetDirtiedFunc(ABI49_0_0YGNodeRef node) {
  return node->getDirtied();
}

YOGA_EXPORT void ABI49_0_0YGNodeSetDirtiedFunc(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGDirtiedFunc dirtiedFunc) {
  node->setDirtiedFunc(dirtiedFunc);
}

YOGA_EXPORT void ABI49_0_0YGNodeSetPrintFunc(ABI49_0_0YGNodeRef node, ABI49_0_0YGPrintFunc printFunc) {
  node->setPrintFunc(printFunc);
}

YOGA_EXPORT bool ABI49_0_0YGNodeGetHasNewLayout(ABI49_0_0YGNodeRef node) {
  return node->getHasNewLayout();
}

YOGA_EXPORT void ABI49_0_0YGConfigSetPrintTreeFlag(ABI49_0_0YGConfigRef config, bool enabled) {
  config->printTree = enabled;
}

YOGA_EXPORT void ABI49_0_0YGNodeSetHasNewLayout(ABI49_0_0YGNodeRef node, bool hasNewLayout) {
  node->setHasNewLayout(hasNewLayout);
}

YOGA_EXPORT ABI49_0_0YGNodeType ABI49_0_0YGNodeGetNodeType(ABI49_0_0YGNodeRef node) {
  return node->getNodeType();
}

YOGA_EXPORT void ABI49_0_0YGNodeSetNodeType(ABI49_0_0YGNodeRef node, ABI49_0_0YGNodeType nodeType) {
  return node->setNodeType(nodeType);
}

YOGA_EXPORT bool ABI49_0_0YGNodeIsDirty(ABI49_0_0YGNodeRef node) {
  return node->isDirty();
}

YOGA_EXPORT void ABI49_0_0YGNodeMarkDirtyAndPropogateToDescendants(
    const ABI49_0_0YGNodeRef node) {
  return node->markDirtyAndPropogateDownwards();
}

int32_t gConfigInstanceCount = 0;

YOGA_EXPORT WIN_EXPORT ABI49_0_0YGNodeRef ABI49_0_0YGNodeNewWithConfig(const ABI49_0_0YGConfigRef config) {
  const ABI49_0_0YGNodeRef node = new ABI49_0_0YGNode{config};
  ABI49_0_0YGAssert(config != nullptr, "Tried to construct ABI49_0_0YGNode with null config");
  ABI49_0_0YGAssertWithConfig(
      config, node != nullptr, "Could not allocate memory for node");
  Event::publish<Event::NodeAllocation>(node, {config});

  return node;
}

YOGA_EXPORT ABI49_0_0YGConfigRef ABI49_0_0YGConfigGetDefault() {
  static ABI49_0_0YGConfigRef defaultConfig = ABI49_0_0YGConfigNew();
  return defaultConfig;
}

YOGA_EXPORT ABI49_0_0YGNodeRef ABI49_0_0YGNodeNew(void) {
  return ABI49_0_0YGNodeNewWithConfig(ABI49_0_0YGConfigGetDefault());
}

YOGA_EXPORT ABI49_0_0YGNodeRef ABI49_0_0YGNodeClone(ABI49_0_0YGNodeRef oldNode) {
  ABI49_0_0YGNodeRef node = new ABI49_0_0YGNode(*oldNode);
  ABI49_0_0YGAssertWithConfig(
      oldNode->getConfig(),
      node != nullptr,
      "Could not allocate memory for node");
  Event::publish<Event::NodeAllocation>(node, {node->getConfig()});
  node->setOwner(nullptr);
  return node;
}

YOGA_EXPORT void ABI49_0_0YGNodeFree(const ABI49_0_0YGNodeRef node) {
  if (ABI49_0_0YGNodeRef owner = node->getOwner()) {
    owner->removeChild(node);
    node->setOwner(nullptr);
  }

  const uint32_t childCount = ABI49_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI49_0_0YGNodeRef child = ABI49_0_0YGNodeGetChild(node, i);
    child->setOwner(nullptr);
  }

  node->clearChildren();
  Event::publish<Event::NodeDeallocation>(node, {node->getConfig()});
  delete node;
}

YOGA_EXPORT void ABI49_0_0YGNodeFreeRecursiveWithCleanupFunc(
    const ABI49_0_0YGNodeRef root,
    ABI49_0_0YGNodeCleanupFunc cleanup) {
  uint32_t skipped = 0;
  while (ABI49_0_0YGNodeGetChildCount(root) > skipped) {
    const ABI49_0_0YGNodeRef child = ABI49_0_0YGNodeGetChild(root, skipped);
    if (child->getOwner() != root) {
      // Don't free shared nodes that we don't own.
      skipped += 1;
    } else {
      ABI49_0_0YGNodeRemoveChild(root, child);
      ABI49_0_0YGNodeFreeRecursive(child);
    }
  }
  if (cleanup != nullptr) {
    cleanup(root);
  }
  ABI49_0_0YGNodeFree(root);
}

YOGA_EXPORT void ABI49_0_0YGNodeFreeRecursive(const ABI49_0_0YGNodeRef root) {
  return ABI49_0_0YGNodeFreeRecursiveWithCleanupFunc(root, nullptr);
}

YOGA_EXPORT void ABI49_0_0YGNodeReset(ABI49_0_0YGNodeRef node) {
  node->reset();
}

YOGA_EXPORT int32_t ABI49_0_0YGConfigGetInstanceCount(void) {
  return gConfigInstanceCount;
}

YOGA_EXPORT ABI49_0_0YGConfigRef ABI49_0_0YGConfigNew(void) {
#ifdef ANDROID
  const ABI49_0_0YGConfigRef config = new ABI49_0_0YGConfig(ABI49_0_0YGAndroidLog);
#else
  const ABI49_0_0YGConfigRef config = new ABI49_0_0YGConfig(ABI49_0_0YGDefaultLog);
#endif
  gConfigInstanceCount++;
  return config;
}

YOGA_EXPORT void ABI49_0_0YGConfigFree(const ABI49_0_0YGConfigRef config) {
  delete config;
  gConfigInstanceCount--;
}

void ABI49_0_0YGConfigCopy(const ABI49_0_0YGConfigRef dest, const ABI49_0_0YGConfigRef src) {
  memcpy(dest, src, sizeof(ABI49_0_0YGConfig));
}

YOGA_EXPORT void ABI49_0_0YGNodeSetIsReferenceBaseline(
    ABI49_0_0YGNodeRef node,
    bool isReferenceBaseline) {
  if (node->isReferenceBaseline() != isReferenceBaseline) {
    node->setIsReferenceBaseline(isReferenceBaseline);
    node->markDirtyAndPropogate();
  }
}

YOGA_EXPORT bool ABI49_0_0YGNodeIsReferenceBaseline(ABI49_0_0YGNodeRef node) {
  return node->isReferenceBaseline();
}

YOGA_EXPORT void ABI49_0_0YGNodeInsertChild(
    const ABI49_0_0YGNodeRef owner,
    const ABI49_0_0YGNodeRef child,
    const uint32_t index) {
  ABI49_0_0YGAssertWithNode(
      owner,
      child->getOwner() == nullptr,
      "Child already has a owner, it must be removed first.");

  ABI49_0_0YGAssertWithNode(
      owner,
      !owner->hasMeasureFunc(),
      "Cannot add child: Nodes with measure functions cannot have children.");

  owner->insertChild(child, index);
  child->setOwner(owner);
  owner->markDirtyAndPropogate();
}

YOGA_EXPORT void ABI49_0_0YGNodeSwapChild(
    const ABI49_0_0YGNodeRef owner,
    const ABI49_0_0YGNodeRef child,
    const uint32_t index) {
  owner->replaceChild(child, index);
  child->setOwner(owner);
}

YOGA_EXPORT void ABI49_0_0YGNodeRemoveChild(
    const ABI49_0_0YGNodeRef owner,
    const ABI49_0_0YGNodeRef excludedChild) {
  if (ABI49_0_0YGNodeGetChildCount(owner) == 0) {
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

YOGA_EXPORT void ABI49_0_0YGNodeRemoveAllChildren(const ABI49_0_0YGNodeRef owner) {
  const uint32_t childCount = ABI49_0_0YGNodeGetChildCount(owner);
  if (childCount == 0) {
    // This is an empty set already. Nothing to do.
    return;
  }
  const ABI49_0_0YGNodeRef firstChild = ABI49_0_0YGNodeGetChild(owner, 0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that this child
    // set is unique.
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI49_0_0YGNodeRef oldChild = ABI49_0_0YGNodeGetChild(owner, i);
      oldChild->setLayout(ABI49_0_0YGNode().getLayout()); // layout is no longer valid
      oldChild->setOwner(nullptr);
    }
    owner->clearChildren();
    owner->markDirtyAndPropogate();
    return;
  }
  // Otherwise, we are not the owner of the child set. We don't have to do
  // anything to clear it.
  owner->setChildren(ABI49_0_0YGVector());
  owner->markDirtyAndPropogate();
}

static void ABI49_0_0YGNodeSetChildrenInternal(
    ABI49_0_0YGNodeRef const owner,
    const std::vector<ABI49_0_0YGNodeRef>& children) {
  if (!owner) {
    return;
  }
  if (children.size() == 0) {
    if (ABI49_0_0YGNodeGetChildCount(owner) > 0) {
      for (ABI49_0_0YGNodeRef const child : owner->getChildren()) {
        child->setLayout(ABI49_0_0YGLayout());
        child->setOwner(nullptr);
      }
      owner->setChildren(ABI49_0_0YGVector());
      owner->markDirtyAndPropogate();
    }
  } else {
    if (ABI49_0_0YGNodeGetChildCount(owner) > 0) {
      for (ABI49_0_0YGNodeRef const oldChild : owner->getChildren()) {
        // Our new children may have nodes in common with the old children. We
        // don't reset these common nodes.
        if (std::find(children.begin(), children.end(), oldChild) ==
            children.end()) {
          oldChild->setLayout(ABI49_0_0YGLayout());
          oldChild->setOwner(nullptr);
        }
      }
    }
    owner->setChildren(children);
    for (ABI49_0_0YGNodeRef child : children) {
      child->setOwner(owner);
    }
    owner->markDirtyAndPropogate();
  }
}

YOGA_EXPORT void ABI49_0_0YGNodeSetChildren(
    const ABI49_0_0YGNodeRef owner,
    const ABI49_0_0YGNodeRef c[],
    const uint32_t count) {
  const ABI49_0_0YGVector children = {c, c + count};
  ABI49_0_0YGNodeSetChildrenInternal(owner, children);
}

YOGA_EXPORT void ABI49_0_0YGNodeSetChildren(
    ABI49_0_0YGNodeRef const owner,
    const std::vector<ABI49_0_0YGNodeRef>& children) {
  ABI49_0_0YGNodeSetChildrenInternal(owner, children);
}

YOGA_EXPORT ABI49_0_0YGNodeRef
ABI49_0_0YGNodeGetChild(const ABI49_0_0YGNodeRef node, const uint32_t index) {
  if (index < node->getChildren().size()) {
    return node->getChild(index);
  }
  return nullptr;
}

YOGA_EXPORT uint32_t ABI49_0_0YGNodeGetChildCount(const ABI49_0_0YGNodeRef node) {
  return static_cast<uint32_t>(node->getChildren().size());
}

YOGA_EXPORT ABI49_0_0YGNodeRef ABI49_0_0YGNodeGetOwner(const ABI49_0_0YGNodeRef node) {
  return node->getOwner();
}

YOGA_EXPORT ABI49_0_0YGNodeRef ABI49_0_0YGNodeGetParent(const ABI49_0_0YGNodeRef node) {
  return node->getOwner();
}

YOGA_EXPORT void ABI49_0_0YGNodeMarkDirty(const ABI49_0_0YGNodeRef node) {
  ABI49_0_0YGAssertWithNode(
      node,
      node->hasMeasureFunc(),
      "Only leaf nodes with custom measure functions"
      "should manually mark themselves as dirty");

  node->markDirtyAndPropogate();
}

YOGA_EXPORT void ABI49_0_0YGNodeCopyStyle(
    const ABI49_0_0YGNodeRef dstNode,
    const ABI49_0_0YGNodeRef srcNode) {
  if (!(dstNode->getStyle() == srcNode->getStyle())) {
    dstNode->setStyle(srcNode->getStyle());
    dstNode->markDirtyAndPropogate();
  }
}

YOGA_EXPORT float ABI49_0_0YGNodeStyleGetFlexGrow(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().flexGrow().isUndefined()
      ? kDefaultFlexGrow
      : node->getStyle().flexGrow().unwrap();
}

YOGA_EXPORT float ABI49_0_0YGNodeStyleGetFlexShrink(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().flexShrink().isUndefined()
      ? (node->getConfig()->useWebDefaults ? kWebDefaultFlexShrink
                                           : kDefaultFlexShrink)
      : node->getStyle().flexShrink().unwrap();
}

namespace {

template <typename T, typename NeedsUpdate, typename Update>
void updateStyle(
    ABI49_0_0YGNode* node,
    T value,
    NeedsUpdate&& needsUpdate,
    Update&& update) {
  if (needsUpdate(node->getStyle(), value)) {
    update(node->getStyle(), value);
    node->markDirtyAndPropogate();
  }
}

template <typename Ref, typename T>
void updateStyle(ABI49_0_0YGNode* node, Ref (ABI49_0_0YGStyle::*prop)(), T value) {
  updateStyle(
      node,
      value,
      [prop](ABI49_0_0YGStyle& s, T x) { return (s.*prop)() != x; },
      [prop](ABI49_0_0YGStyle& s, T x) { (s.*prop)() = x; });
}

template <typename Ref, typename Idx>
void updateIndexedStyleProp(
    ABI49_0_0YGNode* node,
    Ref (ABI49_0_0YGStyle::*prop)(),
    Idx idx,
    detail::CompactValue value) {
  using detail::CompactValue;
  updateStyle(
      node,
      value,
      [idx, prop](ABI49_0_0YGStyle& s, CompactValue x) { return (s.*prop)()[idx] != x; },
      [idx, prop](ABI49_0_0YGStyle& s, CompactValue x) { (s.*prop)()[idx] = x; });
}

} // namespace

// MSVC has trouble inferring the return type of pointer to member functions
// with const and non-const overloads, instead of preferring the non-const
// overload like clang and GCC. For the purposes of updateStyle(), we can help
// MSVC by specifying that return type explicitely. In combination with
// decltype, MSVC will prefer the non-const version.
#define MSVC_HINT(PROP) decltype(ABI49_0_0YGStyle{}.PROP())

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetDirection(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGDirection value) {
  updateStyle<MSVC_HINT(direction)>(node, &ABI49_0_0YGStyle::direction, value);
}
YOGA_EXPORT ABI49_0_0YGDirection ABI49_0_0YGNodeStyleGetDirection(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().direction();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlexDirection(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGFlexDirection flexDirection) {
  updateStyle<MSVC_HINT(flexDirection)>(
      node, &ABI49_0_0YGStyle::flexDirection, flexDirection);
}
YOGA_EXPORT ABI49_0_0YGFlexDirection
ABI49_0_0YGNodeStyleGetFlexDirection(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().flexDirection();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetJustifyContent(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGJustify justifyContent) {
  updateStyle<MSVC_HINT(justifyContent)>(
      node, &ABI49_0_0YGStyle::justifyContent, justifyContent);
}
YOGA_EXPORT ABI49_0_0YGJustify ABI49_0_0YGNodeStyleGetJustifyContent(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().justifyContent();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetAlignContent(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGAlign alignContent) {
  updateStyle<MSVC_HINT(alignContent)>(
      node, &ABI49_0_0YGStyle::alignContent, alignContent);
}
YOGA_EXPORT ABI49_0_0YGAlign ABI49_0_0YGNodeStyleGetAlignContent(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().alignContent();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetAlignItems(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGAlign alignItems) {
  updateStyle<MSVC_HINT(alignItems)>(node, &ABI49_0_0YGStyle::alignItems, alignItems);
}
YOGA_EXPORT ABI49_0_0YGAlign ABI49_0_0YGNodeStyleGetAlignItems(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().alignItems();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetAlignSelf(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGAlign alignSelf) {
  updateStyle<MSVC_HINT(alignSelf)>(node, &ABI49_0_0YGStyle::alignSelf, alignSelf);
}
YOGA_EXPORT ABI49_0_0YGAlign ABI49_0_0YGNodeStyleGetAlignSelf(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().alignSelf();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetPositionType(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGPositionType positionType) {
  updateStyle<MSVC_HINT(positionType)>(
      node, &ABI49_0_0YGStyle::positionType, positionType);
}
YOGA_EXPORT ABI49_0_0YGPositionType
ABI49_0_0YGNodeStyleGetPositionType(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().positionType();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlexWrap(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGWrap flexWrap) {
  updateStyle<MSVC_HINT(flexWrap)>(node, &ABI49_0_0YGStyle::flexWrap, flexWrap);
}
YOGA_EXPORT ABI49_0_0YGWrap ABI49_0_0YGNodeStyleGetFlexWrap(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().flexWrap();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetOverflow(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGOverflow overflow) {
  updateStyle<MSVC_HINT(overflow)>(node, &ABI49_0_0YGStyle::overflow, overflow);
}
YOGA_EXPORT ABI49_0_0YGOverflow ABI49_0_0YGNodeStyleGetOverflow(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().overflow();
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetDisplay(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGDisplay display) {
  updateStyle<MSVC_HINT(display)>(node, &ABI49_0_0YGStyle::display, display);
}
YOGA_EXPORT ABI49_0_0YGDisplay ABI49_0_0YGNodeStyleGetDisplay(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().display();
}

// TODO(T26792433): Change the API to accept ABI49_0_0YGFloatOptional.
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlex(const ABI49_0_0YGNodeRef node, const float flex) {
  updateStyle<MSVC_HINT(flex)>(node, &ABI49_0_0YGStyle::flex, ABI49_0_0YGFloatOptional{flex});
}

// TODO(T26792433): Change the API to accept ABI49_0_0YGFloatOptional.
YOGA_EXPORT float ABI49_0_0YGNodeStyleGetFlex(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().flex().isUndefined()
      ? ABI49_0_0YGUndefined
      : node->getStyle().flex().unwrap();
}

// TODO(T26792433): Change the API to accept ABI49_0_0YGFloatOptional.
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlexGrow(
    const ABI49_0_0YGNodeRef node,
    const float flexGrow) {
  updateStyle<MSVC_HINT(flexGrow)>(
      node, &ABI49_0_0YGStyle::flexGrow, ABI49_0_0YGFloatOptional{flexGrow});
}

// TODO(T26792433): Change the API to accept ABI49_0_0YGFloatOptional.
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlexShrink(
    const ABI49_0_0YGNodeRef node,
    const float flexShrink) {
  updateStyle<MSVC_HINT(flexShrink)>(
      node, &ABI49_0_0YGStyle::flexShrink, ABI49_0_0YGFloatOptional{flexShrink});
}

YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetFlexBasis(const ABI49_0_0YGNodeConstRef node) {
  ABI49_0_0YGValue flexBasis = node->getStyle().flexBasis();
  if (flexBasis.unit == ABI49_0_0YGUnitUndefined || flexBasis.unit == ABI49_0_0YGUnitAuto) {
    // TODO(T26792433): Get rid off the use of ABI49_0_0YGUndefined at client side
    flexBasis.value = ABI49_0_0YGUndefined;
  }
  return flexBasis;
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlexBasis(
    const ABI49_0_0YGNodeRef node,
    const float flexBasis) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(flexBasis);
  updateStyle<MSVC_HINT(flexBasis)>(node, &ABI49_0_0YGStyle::flexBasis, value);
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlexBasisPercent(
    const ABI49_0_0YGNodeRef node,
    const float flexBasisPercent) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(flexBasisPercent);
  updateStyle<MSVC_HINT(flexBasis)>(node, &ABI49_0_0YGStyle::flexBasis, value);
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetFlexBasisAuto(const ABI49_0_0YGNodeRef node) {
  updateStyle<MSVC_HINT(flexBasis)>(
      node, &ABI49_0_0YGStyle::flexBasis, detail::CompactValue::ofAuto());
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetPosition(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGEdge edge,
    float points) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &ABI49_0_0YGStyle::position, edge, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetPositionPercent(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGEdge edge,
    float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &ABI49_0_0YGStyle::position, edge, value);
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetPosition(ABI49_0_0YGNodeConstRef node, ABI49_0_0YGEdge edge) {
  return node->getStyle().position()[edge];
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMargin(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGEdge edge,
    float points) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &ABI49_0_0YGStyle::margin, edge, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMarginPercent(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGEdge edge,
    float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &ABI49_0_0YGStyle::margin, edge, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMarginAuto(ABI49_0_0YGNodeRef node, ABI49_0_0YGEdge edge) {
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &ABI49_0_0YGStyle::margin, edge, detail::CompactValue::ofAuto());
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetMargin(ABI49_0_0YGNodeConstRef node, ABI49_0_0YGEdge edge) {
  return node->getStyle().margin()[edge];
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetPadding(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGEdge edge,
    float points) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &ABI49_0_0YGStyle::padding, edge, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetPaddingPercent(
    ABI49_0_0YGNodeRef node,
    ABI49_0_0YGEdge edge,
    float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &ABI49_0_0YGStyle::padding, edge, value);
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetPadding(ABI49_0_0YGNodeConstRef node, ABI49_0_0YGEdge edge) {
  return node->getStyle().padding()[edge];
}

// TODO(T26792433): Change the API to accept ABI49_0_0YGFloatOptional.
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetBorder(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGEdge edge,
    const float border) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(border);
  updateIndexedStyleProp<MSVC_HINT(border)>(
      node, &ABI49_0_0YGStyle::border, edge, value);
}

YOGA_EXPORT float ABI49_0_0YGNodeStyleGetBorder(
    const ABI49_0_0YGNodeConstRef node,
    const ABI49_0_0YGEdge edge) {
  auto border = node->getStyle().border()[edge];
  if (border.isUndefined() || border.isAuto()) {
    // TODO(T26792433): Rather than returning ABI49_0_0YGUndefined, change the api to
    // return ABI49_0_0YGFloatOptional.
    return ABI49_0_0YGUndefined;
  }

  return static_cast<ABI49_0_0YGValue>(border).value;
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetGap(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGGutter gutter,
    const float gapLength) {
  auto length = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(gapLength);
  updateIndexedStyleProp<MSVC_HINT(gap)>(node, &ABI49_0_0YGStyle::gap, gutter, length);
}

YOGA_EXPORT float ABI49_0_0YGNodeStyleGetGap(
    const ABI49_0_0YGNodeConstRef node,
    const ABI49_0_0YGGutter gutter) {
  auto gapLength = node->getStyle().gap()[gutter];
  if (gapLength.isUndefined() || gapLength.isAuto()) {
    // TODO(T26792433): Rather than returning ABI49_0_0YGUndefined, change the api to
    // return ABI49_0_0YGFloatOptional.
    return ABI49_0_0YGUndefined;
  }

  return static_cast<ABI49_0_0YGValue>(gapLength).value;
}

// Yoga specific properties, not compatible with flexbox specification

// TODO(T26792433): Change the API to accept ABI49_0_0YGFloatOptional.
YOGA_EXPORT float ABI49_0_0YGNodeStyleGetAspectRatio(const ABI49_0_0YGNodeConstRef node) {
  const ABI49_0_0YGFloatOptional op = node->getStyle().aspectRatio();
  return op.isUndefined() ? ABI49_0_0YGUndefined : op.unwrap();
}

// TODO(T26792433): Change the API to accept ABI49_0_0YGFloatOptional.
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetAspectRatio(
    const ABI49_0_0YGNodeRef node,
    const float aspectRatio) {
  updateStyle<MSVC_HINT(aspectRatio)>(
      node, &ABI49_0_0YGStyle::aspectRatio, ABI49_0_0YGFloatOptional{aspectRatio});
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetWidth(ABI49_0_0YGNodeRef node, float points) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI49_0_0YGStyle::dimensions, ABI49_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetWidthPercent(ABI49_0_0YGNodeRef node, float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI49_0_0YGStyle::dimensions, ABI49_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetWidthAuto(ABI49_0_0YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node,
      &ABI49_0_0YGStyle::dimensions,
      ABI49_0_0YGDimensionWidth,
      detail::CompactValue::ofAuto());
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetWidth(ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().dimensions()[ABI49_0_0YGDimensionWidth];
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetHeight(ABI49_0_0YGNodeRef node, float points) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI49_0_0YGStyle::dimensions, ABI49_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetHeightPercent(ABI49_0_0YGNodeRef node, float percent) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node, &ABI49_0_0YGStyle::dimensions, ABI49_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetHeightAuto(ABI49_0_0YGNodeRef node) {
  updateIndexedStyleProp<MSVC_HINT(dimensions)>(
      node,
      &ABI49_0_0YGStyle::dimensions,
      ABI49_0_0YGDimensionHeight,
      detail::CompactValue::ofAuto());
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetHeight(ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().dimensions()[ABI49_0_0YGDimensionHeight];
}

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMinWidth(
    const ABI49_0_0YGNodeRef node,
    const float minWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI49_0_0YGStyle::minDimensions, ABI49_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMinWidthPercent(
    const ABI49_0_0YGNodeRef node,
    const float minWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(minWidth);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI49_0_0YGStyle::minDimensions, ABI49_0_0YGDimensionWidth, value);
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetMinWidth(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().minDimensions()[ABI49_0_0YGDimensionWidth];
};

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMinHeight(
    const ABI49_0_0YGNodeRef node,
    const float minHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI49_0_0YGStyle::minDimensions, ABI49_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMinHeightPercent(
    const ABI49_0_0YGNodeRef node,
    const float minHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(minHeight);
  updateIndexedStyleProp<MSVC_HINT(minDimensions)>(
      node, &ABI49_0_0YGStyle::minDimensions, ABI49_0_0YGDimensionHeight, value);
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetMinHeight(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().minDimensions()[ABI49_0_0YGDimensionHeight];
};

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMaxWidth(
    const ABI49_0_0YGNodeRef node,
    const float maxWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI49_0_0YGStyle::maxDimensions, ABI49_0_0YGDimensionWidth, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMaxWidthPercent(
    const ABI49_0_0YGNodeRef node,
    const float maxWidth) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(maxWidth);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI49_0_0YGStyle::maxDimensions, ABI49_0_0YGDimensionWidth, value);
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetMaxWidth(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().maxDimensions()[ABI49_0_0YGDimensionWidth];
};

YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMaxHeight(
    const ABI49_0_0YGNodeRef node,
    const float maxHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPoint>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI49_0_0YGStyle::maxDimensions, ABI49_0_0YGDimensionHeight, value);
}
YOGA_EXPORT void ABI49_0_0YGNodeStyleSetMaxHeightPercent(
    const ABI49_0_0YGNodeRef node,
    const float maxHeight) {
  auto value = detail::CompactValue::ofMaybe<ABI49_0_0YGUnitPercent>(maxHeight);
  updateIndexedStyleProp<MSVC_HINT(maxDimensions)>(
      node, &ABI49_0_0YGStyle::maxDimensions, ABI49_0_0YGDimensionHeight, value);
}
YOGA_EXPORT ABI49_0_0YGValue ABI49_0_0YGNodeStyleGetMaxHeight(const ABI49_0_0YGNodeConstRef node) {
  return node->getStyle().maxDimensions()[ABI49_0_0YGDimensionHeight];
};

#define ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName)   \
  YOGA_EXPORT type ABI49_0_0YGNodeLayoutGet##name(const ABI49_0_0YGNodeRef node) { \
    return node->getLayout().instanceName;                       \
  }

#define ABI49_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName) \
  YOGA_EXPORT type ABI49_0_0YGNodeLayoutGet##name(                               \
      const ABI49_0_0YGNodeRef node, const ABI49_0_0YGEdge edge) {                        \
    ABI49_0_0YGAssertWithNode(                                                   \
        node,                                                           \
        edge <= ABI49_0_0YGEdgeEnd,                                              \
        "Cannot get layout properties of multi-edge shorthands");       \
                                                                        \
    if (edge == ABI49_0_0YGEdgeStart) {                                          \
      if (node->getLayout().direction() == ABI49_0_0YGDirectionRTL) {            \
        return node->getLayout().instanceName[ABI49_0_0YGEdgeRight];             \
      } else {                                                          \
        return node->getLayout().instanceName[ABI49_0_0YGEdgeLeft];              \
      }                                                                 \
    }                                                                   \
                                                                        \
    if (edge == ABI49_0_0YGEdgeEnd) {                                            \
      if (node->getLayout().direction() == ABI49_0_0YGDirectionRTL) {            \
        return node->getLayout().instanceName[ABI49_0_0YGEdgeLeft];              \
      } else {                                                          \
        return node->getLayout().instanceName[ABI49_0_0YGEdgeRight];             \
      }                                                                 \
    }                                                                   \
                                                                        \
    return node->getLayout().instanceName[edge];                        \
  }

ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI49_0_0YGEdgeLeft]);
ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI49_0_0YGEdgeTop]);
ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI49_0_0YGEdgeRight]);
ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI49_0_0YGEdgeBottom]);
ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI49_0_0YGDimensionWidth]);
ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI49_0_0YGDimensionHeight]);
ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(ABI49_0_0YGDirection, Direction, direction());
ABI49_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(bool, HadOverflow, hadOverflow());

ABI49_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
ABI49_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
ABI49_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

std::atomic<uint32_t> gCurrentGenerationCount(0);

bool ABI49_0_0YGLayoutNodeInternal(
    const ABI49_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI49_0_0YGDirection ownerDirection,
    const ABI49_0_0YGMeasureMode widthMeasureMode,
    const ABI49_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    const ABI49_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount);

#ifdef DEBUG
static void ABI49_0_0YGNodePrintInternal(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGPrintOptions options) {
  std::string str;
  ABI49_0_0facebook::yoga::ABI49_0_0YGNodeToString(str, node, options, 0);
  Log::log(node, ABI49_0_0YGLogLevelDebug, nullptr, str.c_str());
}

YOGA_EXPORT void ABI49_0_0YGNodePrint(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGPrintOptions options) {
  ABI49_0_0YGNodePrintInternal(node, options);
}
#endif

const std::array<ABI49_0_0YGEdge, 4> leading = {
    {ABI49_0_0YGEdgeTop, ABI49_0_0YGEdgeBottom, ABI49_0_0YGEdgeLeft, ABI49_0_0YGEdgeRight}};

const std::array<ABI49_0_0YGEdge, 4> trailing = {
    {ABI49_0_0YGEdgeBottom, ABI49_0_0YGEdgeTop, ABI49_0_0YGEdgeRight, ABI49_0_0YGEdgeLeft}};
static const std::array<ABI49_0_0YGEdge, 4> pos = {{
    ABI49_0_0YGEdgeTop,
    ABI49_0_0YGEdgeBottom,
    ABI49_0_0YGEdgeLeft,
    ABI49_0_0YGEdgeRight,
}};

static const std::array<ABI49_0_0YGDimension, 4> dim = {
    {ABI49_0_0YGDimensionHeight, ABI49_0_0YGDimensionHeight, ABI49_0_0YGDimensionWidth, ABI49_0_0YGDimensionWidth}};

static inline float ABI49_0_0YGNodePaddingAndBorderForAxis(
    const ABI49_0_0YGNodeConstRef node,
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) {
  return (node->getLeadingPaddingAndBorder(axis, widthSize) +
          node->getTrailingPaddingAndBorder(axis, widthSize))
      .unwrap();
}

static inline ABI49_0_0YGAlign ABI49_0_0YGNodeAlignItem(const ABI49_0_0YGNode* node, const ABI49_0_0YGNode* child) {
  const ABI49_0_0YGAlign align = child->getStyle().alignSelf() == ABI49_0_0YGAlignAuto
      ? node->getStyle().alignItems()
      : child->getStyle().alignSelf();
  if (align == ABI49_0_0YGAlignBaseline &&
      ABI49_0_0YGFlexDirectionIsColumn(node->getStyle().flexDirection())) {
    return ABI49_0_0YGAlignFlexStart;
  }
  return align;
}

static float ABI49_0_0YGBaseline(const ABI49_0_0YGNodeRef node, void* layoutContext) {
  if (node->hasBaselineFunc()) {

    Event::publish<Event::NodeBaselineStart>(node);

    const float baseline = node->baseline(
        node->getLayout().measuredDimensions[ABI49_0_0YGDimensionWidth],
        node->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight],
        layoutContext);

    Event::publish<Event::NodeBaselineEnd>(node);

    ABI49_0_0YGAssertWithNode(
        node,
        !ABI49_0_0YGFloatIsUndefined(baseline),
        "Expect custom baseline function to not return NaN");
    return baseline;
  }

  ABI49_0_0YGNodeRef baselineChild = nullptr;
  const uint32_t childCount = ABI49_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI49_0_0YGNodeRef child = ABI49_0_0YGNodeGetChild(node, i);
    if (child->getLineIndex() > 0) {
      break;
    }
    if (child->getStyle().positionType() == ABI49_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (ABI49_0_0YGNodeAlignItem(node, child) == ABI49_0_0YGAlignBaseline ||
        child->isReferenceBaseline()) {
      baselineChild = child;
      break;
    }

    if (baselineChild == nullptr) {
      baselineChild = child;
    }
  }

  if (baselineChild == nullptr) {
    return node->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight];
  }

  const float baseline = ABI49_0_0YGBaseline(baselineChild, layoutContext);
  return baseline + baselineChild->getLayout().position[ABI49_0_0YGEdgeTop];
}

static bool ABI49_0_0YGIsBaselineLayout(const ABI49_0_0YGNodeRef node) {
  if (ABI49_0_0YGFlexDirectionIsColumn(node->getStyle().flexDirection())) {
    return false;
  }
  if (node->getStyle().alignItems() == ABI49_0_0YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = ABI49_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI49_0_0YGNodeRef child = ABI49_0_0YGNodeGetChild(node, i);
    if (child->getStyle().positionType() != ABI49_0_0YGPositionTypeAbsolute &&
        child->getStyle().alignSelf() == ABI49_0_0YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float ABI49_0_0YGNodeDimWithMargin(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGFlexDirection axis,
    const float widthSize) {
  return node->getLayout().measuredDimensions[dim[axis]] +
      (node->getLeadingMargin(axis, widthSize) +
       node->getTrailingMargin(axis, widthSize))
          .unwrap();
}

static inline bool ABI49_0_0YGNodeIsStyleDimDefined(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGFlexDirection axis,
    const float ownerSize) {
  bool isUndefined =
      ABI49_0_0YGFloatIsUndefined(node->getResolvedDimension(dim[axis]).value);
  return !(
      node->getResolvedDimension(dim[axis]).unit == ABI49_0_0YGUnitAuto ||
      node->getResolvedDimension(dim[axis]).unit == ABI49_0_0YGUnitUndefined ||
      (node->getResolvedDimension(dim[axis]).unit == ABI49_0_0YGUnitPoint &&
       !isUndefined && node->getResolvedDimension(dim[axis]).value < 0.0f) ||
      (node->getResolvedDimension(dim[axis]).unit == ABI49_0_0YGUnitPercent &&
       !isUndefined &&
       (node->getResolvedDimension(dim[axis]).value < 0.0f ||
        ABI49_0_0YGFloatIsUndefined(ownerSize))));
}

static inline bool ABI49_0_0YGNodeIsLayoutDimDefined(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGFlexDirection axis) {
  const float value = node->getLayout().measuredDimensions[dim[axis]];
  return !ABI49_0_0YGFloatIsUndefined(value) && value >= 0.0f;
}

static ABI49_0_0YGFloatOptional ABI49_0_0YGNodeBoundAxisWithinMinAndMax(
    const ABI49_0_0YGNodeConstRef node,
    const ABI49_0_0YGFlexDirection axis,
    const ABI49_0_0YGFloatOptional value,
    const float axisSize) {
  ABI49_0_0YGFloatOptional min;
  ABI49_0_0YGFloatOptional max;

  if (ABI49_0_0YGFlexDirectionIsColumn(axis)) {
    min = ABI49_0_0YGResolveValue(
        node->getStyle().minDimensions()[ABI49_0_0YGDimensionHeight], axisSize);
    max = ABI49_0_0YGResolveValue(
        node->getStyle().maxDimensions()[ABI49_0_0YGDimensionHeight], axisSize);
  } else if (ABI49_0_0YGFlexDirectionIsRow(axis)) {
    min = ABI49_0_0YGResolveValue(
        node->getStyle().minDimensions()[ABI49_0_0YGDimensionWidth], axisSize);
    max = ABI49_0_0YGResolveValue(
        node->getStyle().maxDimensions()[ABI49_0_0YGDimensionWidth], axisSize);
  }

  if (max >= ABI49_0_0YGFloatOptional{0} && value > max) {
    return max;
  }

  if (min >= ABI49_0_0YGFloatOptional{0} && value < min) {
    return min;
  }

  return value;
}

// Like ABI49_0_0YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't
// go below the padding and border amount.
static inline float ABI49_0_0YGNodeBoundAxis(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGFlexDirection axis,
    const float value,
    const float axisSize,
    const float widthSize) {
  return ABI49_0_0YGFloatMax(
      ABI49_0_0YGNodeBoundAxisWithinMinAndMax(
          node, axis, ABI49_0_0YGFloatOptional{value}, axisSize)
          .unwrap(),
      ABI49_0_0YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void ABI49_0_0YGNodeSetChildTrailingPosition(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGNodeRef child,
    const ABI49_0_0YGFlexDirection axis) {
  const float size = child->getLayout().measuredDimensions[dim[axis]];
  child->setLayoutPosition(
      node->getLayout().measuredDimensions[dim[axis]] - size -
          child->getLayout().position[pos[axis]],
      trailing[axis]);
}

static void ABI49_0_0YGConstrainMaxSizeForMode(
    const ABI49_0_0YGNodeConstRef node,
    const enum ABI49_0_0YGFlexDirection axis,
    const float ownerAxisSize,
    const float ownerWidth,
    ABI49_0_0YGMeasureMode* mode,
    float* size) {
  const ABI49_0_0YGFloatOptional maxSize =
      ABI49_0_0YGResolveValue(
          node->getStyle().maxDimensions()[dim[axis]], ownerAxisSize) +
      ABI49_0_0YGFloatOptional(node->getMarginForAxis(axis, ownerWidth));
  switch (*mode) {
    case ABI49_0_0YGMeasureModeExactly:
    case ABI49_0_0YGMeasureModeAtMost:
      *size = (maxSize.isUndefined() || *size < maxSize.unwrap())
          ? *size
          : maxSize.unwrap();
      break;
    case ABI49_0_0YGMeasureModeUndefined:
      if (!maxSize.isUndefined()) {
        *mode = ABI49_0_0YGMeasureModeAtMost;
        *size = maxSize.unwrap();
      }
      break;
  }
}

static void ABI49_0_0YGNodeComputeFlexBasisForChild(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGNodeRef child,
    const float width,
    const ABI49_0_0YGMeasureMode widthMode,
    const float height,
    const float ownerWidth,
    const float ownerHeight,
    const ABI49_0_0YGMeasureMode heightMode,
    const ABI49_0_0YGDirection direction,
    const ABI49_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const ABI49_0_0YGFlexDirection mainAxis =
      ABI49_0_0YGResolveFlexDirection(node->getStyle().flexDirection(), direction);
  const bool isMainAxisRow = ABI49_0_0YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;

  float childWidth;
  float childHeight;
  ABI49_0_0YGMeasureMode childWidthMeasureMode;
  ABI49_0_0YGMeasureMode childHeightMeasureMode;

  const ABI49_0_0YGFloatOptional resolvedFlexBasis =
      ABI49_0_0YGResolveValue(child->resolveFlexBasisPtr(), mainAxisownerSize);
  const bool isRowStyleDimDefined =
      ABI49_0_0YGNodeIsStyleDimDefined(child, ABI49_0_0YGFlexDirectionRow, ownerWidth);
  const bool isColumnStyleDimDefined =
      ABI49_0_0YGNodeIsStyleDimDefined(child, ABI49_0_0YGFlexDirectionColumn, ownerHeight);

  if (!resolvedFlexBasis.isUndefined() && !ABI49_0_0YGFloatIsUndefined(mainAxisSize)) {
    if (child->getLayout().computedFlexBasis.isUndefined() ||
        (ABI49_0_0YGConfigIsExperimentalFeatureEnabled(
             child->getConfig(), ABI49_0_0YGExperimentalFeatureWebFlexBasis) &&
         child->getLayout().computedFlexBasisGeneration != generationCount)) {
      const ABI49_0_0YGFloatOptional paddingAndBorder = ABI49_0_0YGFloatOptional(
          ABI49_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth));
      child->setLayoutComputedFlexBasis(
          ABI49_0_0YGFloatOptionalMax(resolvedFlexBasis, paddingAndBorder));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    const ABI49_0_0YGFloatOptional paddingAndBorder = ABI49_0_0YGFloatOptional(
        ABI49_0_0YGNodePaddingAndBorderForAxis(child, ABI49_0_0YGFlexDirectionRow, ownerWidth));

    child->setLayoutComputedFlexBasis(ABI49_0_0YGFloatOptionalMax(
        ABI49_0_0YGResolveValue(
            child->getResolvedDimensions()[ABI49_0_0YGDimensionWidth], ownerWidth),
        paddingAndBorder));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    const ABI49_0_0YGFloatOptional paddingAndBorder =
        ABI49_0_0YGFloatOptional(ABI49_0_0YGNodePaddingAndBorderForAxis(
            child, ABI49_0_0YGFlexDirectionColumn, ownerWidth));
    child->setLayoutComputedFlexBasis(ABI49_0_0YGFloatOptionalMax(
        ABI49_0_0YGResolveValue(
            child->getResolvedDimensions()[ABI49_0_0YGDimensionHeight], ownerHeight),
        paddingAndBorder));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped flex
    // basis).
    childWidth = ABI49_0_0YGUndefined;
    childHeight = ABI49_0_0YGUndefined;
    childWidthMeasureMode = ABI49_0_0YGMeasureModeUndefined;
    childHeightMeasureMode = ABI49_0_0YGMeasureModeUndefined;

    auto marginRow =
        child->getMarginForAxis(ABI49_0_0YGFlexDirectionRow, ownerWidth).unwrap();
    auto marginColumn =
        child->getMarginForAxis(ABI49_0_0YGFlexDirectionColumn, ownerWidth).unwrap();

    if (isRowStyleDimDefined) {
      childWidth =
          ABI49_0_0YGResolveValue(
              child->getResolvedDimensions()[ABI49_0_0YGDimensionWidth], ownerWidth)
              .unwrap() +
          marginRow;
      childWidthMeasureMode = ABI49_0_0YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          ABI49_0_0YGResolveValue(
              child->getResolvedDimensions()[ABI49_0_0YGDimensionHeight], ownerHeight)
              .unwrap() +
          marginColumn;
      childHeightMeasureMode = ABI49_0_0YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property, but all
    // major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->getStyle().overflow() == ABI49_0_0YGOverflowScroll) ||
        node->getStyle().overflow() != ABI49_0_0YGOverflowScroll) {
      if (ABI49_0_0YGFloatIsUndefined(childWidth) && !ABI49_0_0YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = ABI49_0_0YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->getStyle().overflow() == ABI49_0_0YGOverflowScroll) ||
        node->getStyle().overflow() != ABI49_0_0YGOverflowScroll) {
      if (ABI49_0_0YGFloatIsUndefined(childHeight) && !ABI49_0_0YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = ABI49_0_0YGMeasureModeAtMost;
      }
    }

    const auto& childStyle = child->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      if (!isMainAxisRow && childWidthMeasureMode == ABI49_0_0YGMeasureModeExactly) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = ABI49_0_0YGMeasureModeExactly;
      } else if (
          isMainAxisRow && childHeightMeasureMode == ABI49_0_0YGMeasureModeExactly) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = ABI49_0_0YGMeasureModeExactly;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch, set
    // the cross axis to be measured exactly with the available inner width

    const bool hasExactWidth =
        !ABI49_0_0YGFloatIsUndefined(width) && widthMode == ABI49_0_0YGMeasureModeExactly;
    const bool childWidthStretch =
        ABI49_0_0YGNodeAlignItem(node, child) == ABI49_0_0YGAlignStretch &&
        childWidthMeasureMode != ABI49_0_0YGMeasureModeExactly;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth &&
        childWidthStretch) {
      childWidth = width;
      childWidthMeasureMode = ABI49_0_0YGMeasureModeExactly;
      if (!childStyle.aspectRatio().isUndefined()) {
        childHeight =
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
        childHeightMeasureMode = ABI49_0_0YGMeasureModeExactly;
      }
    }

    const bool hasExactHeight =
        !ABI49_0_0YGFloatIsUndefined(height) && heightMode == ABI49_0_0YGMeasureModeExactly;
    const bool childHeightStretch =
        ABI49_0_0YGNodeAlignItem(node, child) == ABI49_0_0YGAlignStretch &&
        childHeightMeasureMode != ABI49_0_0YGMeasureModeExactly;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight &&
        childHeightStretch) {
      childHeight = height;
      childHeightMeasureMode = ABI49_0_0YGMeasureModeExactly;

      if (!childStyle.aspectRatio().isUndefined()) {
        childWidth =
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
        childWidthMeasureMode = ABI49_0_0YGMeasureModeExactly;
      }
    }

    ABI49_0_0YGConstrainMaxSizeForMode(
        child,
        ABI49_0_0YGFlexDirectionRow,
        ownerWidth,
        ownerWidth,
        &childWidthMeasureMode,
        &childWidth);
    ABI49_0_0YGConstrainMaxSizeForMode(
        child,
        ABI49_0_0YGFlexDirectionColumn,
        ownerHeight,
        ownerWidth,
        &childHeightMeasureMode,
        &childHeight);

    // Measure the child
    ABI49_0_0YGLayoutNodeInternal(
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

    child->setLayoutComputedFlexBasis(ABI49_0_0YGFloatOptional(ABI49_0_0YGFloatMax(
        child->getLayout().measuredDimensions[dim[mainAxis]],
        ABI49_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth))));
  }
  child->setLayoutComputedFlexBasisGeneration(generationCount);
}

static void ABI49_0_0YGNodeAbsoluteLayoutChild(
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGNodeRef child,
    const float width,
    const ABI49_0_0YGMeasureMode widthMode,
    const float height,
    const ABI49_0_0YGDirection direction,
    const ABI49_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const ABI49_0_0YGFlexDirection mainAxis =
      ABI49_0_0YGResolveFlexDirection(node->getStyle().flexDirection(), direction);
  const ABI49_0_0YGFlexDirection crossAxis = ABI49_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI49_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth = ABI49_0_0YGUndefined;
  float childHeight = ABI49_0_0YGUndefined;
  ABI49_0_0YGMeasureMode childWidthMeasureMode = ABI49_0_0YGMeasureModeUndefined;
  ABI49_0_0YGMeasureMode childHeightMeasureMode = ABI49_0_0YGMeasureModeUndefined;

  auto marginRow = child->getMarginForAxis(ABI49_0_0YGFlexDirectionRow, width).unwrap();
  auto marginColumn =
      child->getMarginForAxis(ABI49_0_0YGFlexDirectionColumn, width).unwrap();

  if (ABI49_0_0YGNodeIsStyleDimDefined(child, ABI49_0_0YGFlexDirectionRow, width)) {
    childWidth =
        ABI49_0_0YGResolveValue(child->getResolvedDimensions()[ABI49_0_0YGDimensionWidth], width)
            .unwrap() +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based on
    // the left/right offsets if they're defined.
    if (child->isLeadingPositionDefined(ABI49_0_0YGFlexDirectionRow) &&
        child->isTrailingPosDefined(ABI49_0_0YGFlexDirectionRow)) {
      childWidth = node->getLayout().measuredDimensions[ABI49_0_0YGDimensionWidth] -
          (node->getLeadingBorder(ABI49_0_0YGFlexDirectionRow) +
           node->getTrailingBorder(ABI49_0_0YGFlexDirectionRow)) -
          (child->getLeadingPosition(ABI49_0_0YGFlexDirectionRow, width) +
           child->getTrailingPosition(ABI49_0_0YGFlexDirectionRow, width))
              .unwrap();
      childWidth =
          ABI49_0_0YGNodeBoundAxis(child, ABI49_0_0YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (ABI49_0_0YGNodeIsStyleDimDefined(child, ABI49_0_0YGFlexDirectionColumn, height)) {
    childHeight = ABI49_0_0YGResolveValue(
                      child->getResolvedDimensions()[ABI49_0_0YGDimensionHeight], height)
                      .unwrap() +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height based on
    // the top/bottom offsets if they're defined.
    if (child->isLeadingPositionDefined(ABI49_0_0YGFlexDirectionColumn) &&
        child->isTrailingPosDefined(ABI49_0_0YGFlexDirectionColumn)) {
      childHeight = node->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight] -
          (node->getLeadingBorder(ABI49_0_0YGFlexDirectionColumn) +
           node->getTrailingBorder(ABI49_0_0YGFlexDirectionColumn)) -
          (child->getLeadingPosition(ABI49_0_0YGFlexDirectionColumn, height) +
           child->getTrailingPosition(ABI49_0_0YGFlexDirectionColumn, height))
              .unwrap();
      childHeight = ABI49_0_0YGNodeBoundAxis(
          child, ABI49_0_0YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect
  // ratio calculation. One dimension being the anchor and the other being
  // flexible.
  const auto& childStyle = child->getStyle();
  if (ABI49_0_0YGFloatIsUndefined(childWidth) ^ ABI49_0_0YGFloatIsUndefined(childHeight)) {
    if (!childStyle.aspectRatio().isUndefined()) {
      if (ABI49_0_0YGFloatIsUndefined(childWidth)) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
      } else if (ABI49_0_0YGFloatIsUndefined(childHeight)) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (ABI49_0_0YGFloatIsUndefined(childWidth) || ABI49_0_0YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode = ABI49_0_0YGFloatIsUndefined(childWidth)
        ? ABI49_0_0YGMeasureModeUndefined
        : ABI49_0_0YGMeasureModeExactly;
    childHeightMeasureMode = ABI49_0_0YGFloatIsUndefined(childHeight)
        ? ABI49_0_0YGMeasureModeUndefined
        : ABI49_0_0YGMeasureModeExactly;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child to
    // wrap to the size of its owner. This is the same behavior as many browsers
    // implement.
    if (!isMainAxisRow && ABI49_0_0YGFloatIsUndefined(childWidth) &&
        widthMode != ABI49_0_0YGMeasureModeUndefined && !ABI49_0_0YGFloatIsUndefined(width) &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = ABI49_0_0YGMeasureModeAtMost;
    }

    ABI49_0_0YGLayoutNodeInternal(
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
    childWidth = child->getLayout().measuredDimensions[ABI49_0_0YGDimensionWidth] +
        child->getMarginForAxis(ABI49_0_0YGFlexDirectionRow, width).unwrap();
    childHeight = child->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight] +
        child->getMarginForAxis(ABI49_0_0YGFlexDirectionColumn, width).unwrap();
  }

  ABI49_0_0YGLayoutNodeInternal(
      child,
      childWidth,
      childHeight,
      direction,
      ABI49_0_0YGMeasureModeExactly,
      ABI49_0_0YGMeasureModeExactly,
      childWidth,
      childHeight,
      true,
      LayoutPassReason::kAbsLayout,
      config,
      layoutMarkerData,
      layoutContext,
      depth,
      generationCount);

  auto trailingMarginOuterSize =
      ABI49_0_0YGConfigIsExperimentalFeatureEnabled(
          node->getConfig(),
          ABI49_0_0YGExperimentalFeatureFixAbsoluteTrailingColumnMargin)
      ? isMainAxisRow ? height : width
      : width;

  if (child->isTrailingPosDefined(mainAxis) &&
      !child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[mainAxis]] -
            child->getLayout().measuredDimensions[dim[mainAxis]] -
            node->getTrailingBorder(mainAxis) -
            child->getTrailingMargin(mainAxis, trailingMarginOuterSize)
                .unwrap() -
            child->getTrailingPosition(mainAxis, isMainAxisRow ? width : height)
                .unwrap(),
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == ABI49_0_0YGJustifyCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]) /
            2.0f,
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent() == ABI49_0_0YGJustifyFlexEnd) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]),
        leading[mainAxis]);
  } else if (
      ABI49_0_0YGConfigIsExperimentalFeatureEnabled(
          node->getConfig(),
          ABI49_0_0YGExperimentalFeatureAbsolutePercentageAgainstPaddingEdge) &&
      child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        child->getLeadingPosition(
                 mainAxis, node->getLayout().measuredDimensions[dim[mainAxis]])
                .unwrap() +
            node->getLeadingBorder(mainAxis) +
            child
                ->getLeadingMargin(
                    mainAxis,
                    node->getLayout().measuredDimensions[dim[mainAxis]])
                .unwrap(),
        leading[mainAxis]);
  }

  if (child->isTrailingPosDefined(crossAxis) &&
      !child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[crossAxis]] -
            child->getLayout().measuredDimensions[dim[crossAxis]] -
            node->getTrailingBorder(crossAxis) -
            child->getTrailingMargin(crossAxis, trailingMarginOuterSize)
                .unwrap() -
            child
                ->getTrailingPosition(crossAxis, isMainAxisRow ? height : width)
                .unwrap(),
        leading[crossAxis]);

  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ABI49_0_0YGNodeAlignItem(node, child) == ABI49_0_0YGAlignCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]) /
            2.0f,
        leading[crossAxis]);
  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ((ABI49_0_0YGNodeAlignItem(node, child) == ABI49_0_0YGAlignFlexEnd) ^
       (node->getStyle().flexWrap() == ABI49_0_0YGWrapWrapReverse))) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]),
        leading[crossAxis]);
  } else if (
      ABI49_0_0YGConfigIsExperimentalFeatureEnabled(
          node->getConfig(),
          ABI49_0_0YGExperimentalFeatureAbsolutePercentageAgainstPaddingEdge) &&
      child->isLeadingPositionDefined(crossAxis)) {
    child->setLayoutPosition(
        child->getLeadingPosition(
                 crossAxis,
                 node->getLayout().measuredDimensions[dim[crossAxis]])
                .unwrap() +
            node->getLeadingBorder(crossAxis) +
            child
                ->getLeadingMargin(
                    crossAxis,
                    node->getLayout().measuredDimensions[dim[crossAxis]])
                .unwrap(),
        leading[crossAxis]);
  }
}

static void ABI49_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(
    const ABI49_0_0YGNodeRef node,
    float availableWidth,
    float availableHeight,
    const ABI49_0_0YGMeasureMode widthMeasureMode,
    const ABI49_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const LayoutPassReason reason) {
  ABI49_0_0YGAssertWithNode(
      node,
      node->hasMeasureFunc(),
      "Expected node to have custom measure function");

  if (widthMeasureMode == ABI49_0_0YGMeasureModeUndefined) {
    availableWidth = ABI49_0_0YGUndefined;
  }
  if (heightMeasureMode == ABI49_0_0YGMeasureModeUndefined) {
    availableHeight = ABI49_0_0YGUndefined;
  }

  const auto& padding = node->getLayout().padding;
  const auto& border = node->getLayout().border;
  const float paddingAndBorderAxisRow = padding[ABI49_0_0YGEdgeLeft] +
      padding[ABI49_0_0YGEdgeRight] + border[ABI49_0_0YGEdgeLeft] + border[ABI49_0_0YGEdgeRight];
  const float paddingAndBorderAxisColumn = padding[ABI49_0_0YGEdgeTop] +
      padding[ABI49_0_0YGEdgeBottom] + border[ABI49_0_0YGEdgeTop] + border[ABI49_0_0YGEdgeBottom];

  // We want to make sure we don't call measure with negative size
  const float innerWidth = ABI49_0_0YGFloatIsUndefined(availableWidth)
      ? availableWidth
      : ABI49_0_0YGFloatMax(0, availableWidth - paddingAndBorderAxisRow);
  const float innerHeight = ABI49_0_0YGFloatIsUndefined(availableHeight)
      ? availableHeight
      : ABI49_0_0YGFloatMax(0, availableHeight - paddingAndBorderAxisColumn);

  if (widthMeasureMode == ABI49_0_0YGMeasureModeExactly &&
      heightMeasureMode == ABI49_0_0YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->setLayoutMeasuredDimension(
        ABI49_0_0YGNodeBoundAxis(
            node, ABI49_0_0YGFlexDirectionRow, availableWidth, ownerWidth, ownerWidth),
        ABI49_0_0YGDimensionWidth);
    node->setLayoutMeasuredDimension(
        ABI49_0_0YGNodeBoundAxis(
            node,
            ABI49_0_0YGFlexDirectionColumn,
            availableHeight,
            ownerHeight,
            ownerWidth),
        ABI49_0_0YGDimensionHeight);
  } else {
    Event::publish<Event::MeasureCallbackStart>(node);

    // Measure the text under the current constraints.
    const ABI49_0_0YGSize measuredSize = node->measure(
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
        ABI49_0_0YGNodeBoundAxis(
            node,
            ABI49_0_0YGFlexDirectionRow,
            (widthMeasureMode == ABI49_0_0YGMeasureModeUndefined ||
             widthMeasureMode == ABI49_0_0YGMeasureModeAtMost)
                ? measuredSize.width + paddingAndBorderAxisRow
                : availableWidth,
            ownerWidth,
            ownerWidth),
        ABI49_0_0YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        ABI49_0_0YGNodeBoundAxis(
            node,
            ABI49_0_0YGFlexDirectionColumn,
            (heightMeasureMode == ABI49_0_0YGMeasureModeUndefined ||
             heightMeasureMode == ABI49_0_0YGMeasureModeAtMost)
                ? measuredSize.height + paddingAndBorderAxisColumn
                : availableHeight,
            ownerHeight,
            ownerWidth),
        ABI49_0_0YGDimensionHeight);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void ABI49_0_0YGNodeEmptyContainerSetMeasuredDimensions(
    const ABI49_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI49_0_0YGMeasureMode widthMeasureMode,
    const ABI49_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  const auto& padding = node->getLayout().padding;
  const auto& border = node->getLayout().border;

  float width = availableWidth;
  if (widthMeasureMode == ABI49_0_0YGMeasureModeUndefined ||
      widthMeasureMode == ABI49_0_0YGMeasureModeAtMost) {
    width = padding[ABI49_0_0YGEdgeLeft] + padding[ABI49_0_0YGEdgeRight] + border[ABI49_0_0YGEdgeLeft] +
        border[ABI49_0_0YGEdgeRight];
  }
  node->setLayoutMeasuredDimension(
      ABI49_0_0YGNodeBoundAxis(node, ABI49_0_0YGFlexDirectionRow, width, ownerWidth, ownerWidth),
      ABI49_0_0YGDimensionWidth);

  float height = availableHeight;
  if (heightMeasureMode == ABI49_0_0YGMeasureModeUndefined ||
      heightMeasureMode == ABI49_0_0YGMeasureModeAtMost) {
    height = padding[ABI49_0_0YGEdgeTop] + padding[ABI49_0_0YGEdgeBottom] + border[ABI49_0_0YGEdgeTop] +
        border[ABI49_0_0YGEdgeBottom];
  }
  node->setLayoutMeasuredDimension(
      ABI49_0_0YGNodeBoundAxis(
          node, ABI49_0_0YGFlexDirectionColumn, height, ownerHeight, ownerWidth),
      ABI49_0_0YGDimensionHeight);
}

static bool ABI49_0_0YGNodeFixedSizeSetMeasuredDimensions(
    const ABI49_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI49_0_0YGMeasureMode widthMeasureMode,
    const ABI49_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  if ((!ABI49_0_0YGFloatIsUndefined(availableWidth) &&
       widthMeasureMode == ABI49_0_0YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (!ABI49_0_0YGFloatIsUndefined(availableHeight) &&
       heightMeasureMode == ABI49_0_0YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == ABI49_0_0YGMeasureModeExactly &&
       heightMeasureMode == ABI49_0_0YGMeasureModeExactly)) {
    node->setLayoutMeasuredDimension(
        ABI49_0_0YGNodeBoundAxis(
            node,
            ABI49_0_0YGFlexDirectionRow,
            ABI49_0_0YGFloatIsUndefined(availableWidth) ||
                    (widthMeasureMode == ABI49_0_0YGMeasureModeAtMost &&
                     availableWidth < 0.0f)
                ? 0.0f
                : availableWidth,
            ownerWidth,
            ownerWidth),
        ABI49_0_0YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        ABI49_0_0YGNodeBoundAxis(
            node,
            ABI49_0_0YGFlexDirectionColumn,
            ABI49_0_0YGFloatIsUndefined(availableHeight) ||
                    (heightMeasureMode == ABI49_0_0YGMeasureModeAtMost &&
                     availableHeight < 0.0f)
                ? 0.0f
                : availableHeight,
            ownerHeight,
            ownerWidth),
        ABI49_0_0YGDimensionHeight);
    return true;
  }

  return false;
}

static void ABI49_0_0YGZeroOutLayoutRecursivly(
    const ABI49_0_0YGNodeRef node,
    void* layoutContext) {
  node->getLayout() = {};
  node->setLayoutDimension(0, 0);
  node->setLayoutDimension(0, 1);
  node->setHasNewLayout(true);

  node->iterChildrenAfterCloningIfNeeded(
      ABI49_0_0YGZeroOutLayoutRecursivly, layoutContext);
}

static float ABI49_0_0YGNodeCalculateAvailableInnerDim(
    const ABI49_0_0YGNodeConstRef node,
    const ABI49_0_0YGDimension dimension,
    const float availableDim,
    const float paddingAndBorder,
    const float ownerDim) {
  float availableInnerDim = availableDim - paddingAndBorder;
  // Max dimension overrides predefined dimension value; Min dimension in turn
  // overrides both of the above
  if (!ABI49_0_0YGFloatIsUndefined(availableInnerDim)) {
    // We want to make sure our available height does not violate min and max
    // constraints
    const ABI49_0_0YGFloatOptional minDimensionOptional =
        ABI49_0_0YGResolveValue(node->getStyle().minDimensions()[dimension], ownerDim);
    const float minInnerDim = minDimensionOptional.isUndefined()
        ? 0.0f
        : minDimensionOptional.unwrap() - paddingAndBorder;

    const ABI49_0_0YGFloatOptional maxDimensionOptional =
        ABI49_0_0YGResolveValue(node->getStyle().maxDimensions()[dimension], ownerDim);

    const float maxInnerDim = maxDimensionOptional.isUndefined()
        ? FLT_MAX
        : maxDimensionOptional.unwrap() - paddingAndBorder;
    availableInnerDim =
        ABI49_0_0YGFloatMax(ABI49_0_0YGFloatMin(availableInnerDim, maxInnerDim), minInnerDim);
  }

  return availableInnerDim;
}

static float ABI49_0_0YGNodeComputeFlexBasisForChildren(
    const ABI49_0_0YGNodeRef node,
    const float availableInnerWidth,
    const float availableInnerHeight,
    ABI49_0_0YGMeasureMode widthMeasureMode,
    ABI49_0_0YGMeasureMode heightMeasureMode,
    ABI49_0_0YGDirection direction,
    ABI49_0_0YGFlexDirection mainAxis,
    const ABI49_0_0YGConfigRef config,
    bool performLayout,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  float totalOuterFlexBasis = 0.0f;
  ABI49_0_0YGNodeRef singleFlexChild = nullptr;
  const ABI49_0_0YGVector& children = node->getChildren();
  ABI49_0_0YGMeasureMode measureModeMainDim =
      ABI49_0_0YGFlexDirectionIsRow(mainAxis) ? widthMeasureMode : heightMeasureMode;
  // If there is only one child with flexGrow + flexShrink it means we can set
  // the computedFlexBasis to 0 instead of measuring and shrinking / flexing the
  // child to exactly match the remaining space
  if (measureModeMainDim == ABI49_0_0YGMeasureModeExactly) {
    for (auto child : children) {
      if (child->isNodeFlexible()) {
        if (singleFlexChild != nullptr ||
            ABI49_0_0YGFloatsEqual(child->resolveFlexGrow(), 0.0f) ||
            ABI49_0_0YGFloatsEqual(child->resolveFlexShrink(), 0.0f)) {
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
    if (child->getStyle().display() == ABI49_0_0YGDisplayNone) {
      ABI49_0_0YGZeroOutLayoutRecursivly(child, layoutContext);
      child->setHasNewLayout(true);
      child->setDirty(false);
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const ABI49_0_0YGDirection childDirection = child->resolveDirection(direction);
      const float mainDim = ABI49_0_0YGFlexDirectionIsRow(mainAxis)
          ? availableInnerWidth
          : availableInnerHeight;
      const float crossDim = ABI49_0_0YGFlexDirectionIsRow(mainAxis)
          ? availableInnerHeight
          : availableInnerWidth;
      child->setPosition(
          childDirection, mainDim, crossDim, availableInnerWidth);
    }

    if (child->getStyle().positionType() == ABI49_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (child == singleFlexChild) {
      child->setLayoutComputedFlexBasisGeneration(generationCount);
      child->setLayoutComputedFlexBasis(ABI49_0_0YGFloatOptional(0));
    } else {
      ABI49_0_0YGNodeComputeFlexBasisForChild(
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
// ABI49_0_0YGNodeComputeFlexBasisForChildren function). This function calculates
// ABI49_0_0YGCollectFlexItemsRowMeasurement
static ABI49_0_0YGCollectFlexItemsRowValues ABI49_0_0YGCalculateCollectFlexItemsRowValues(
    const ABI49_0_0YGNodeRef& node,
    const ABI49_0_0YGDirection ownerDirection,
    const float mainAxisownerSize,
    const float availableInnerWidth,
    const float availableInnerMainDim,
    const uint32_t startOfLineIndex,
    const uint32_t lineCount) {
  ABI49_0_0YGCollectFlexItemsRowValues flexAlgoRowMeasurement = {};
  flexAlgoRowMeasurement.relativeChildren.reserve(node->getChildren().size());

  float sizeConsumedOnCurrentLineIncludingMinConstraint = 0;
  const ABI49_0_0YGFlexDirection mainAxis = ABI49_0_0YGResolveFlexDirection(
      node->getStyle().flexDirection(), node->resolveDirection(ownerDirection));
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != ABI49_0_0YGWrapNoWrap;
  const float gap = node->getGapForAxis(mainAxis, availableInnerWidth).unwrap();

  // Add items to the current line until it's full or we run out of items.
  uint32_t endOfLineIndex = startOfLineIndex;
  for (; endOfLineIndex < node->getChildren().size(); endOfLineIndex++) {
    const ABI49_0_0YGNodeRef child = node->getChild(endOfLineIndex);
    if (child->getStyle().display() == ABI49_0_0YGDisplayNone ||
        child->getStyle().positionType() == ABI49_0_0YGPositionTypeAbsolute) {
      continue;
    }

    const bool isFirstElementInLine = (endOfLineIndex - startOfLineIndex) == 0;

    child->setLineIndex(lineCount);
    const float childMarginMainAxis =
        child->getMarginForAxis(mainAxis, availableInnerWidth).unwrap();
    const float childLeadingGapMainAxis = isFirstElementInLine ? 0.0f : gap;
    const float flexBasisWithMinAndMaxConstraints =
        ABI49_0_0YGNodeBoundAxisWithinMinAndMax(
            child,
            mainAxis,
            child->getLayout().computedFlexBasis,
            mainAxisownerSize)
            .unwrap();

    // If this is a multi-line flow and this item pushes us over the available
    // size, we've hit the end of the current line. Break out of the loop and
    // lay out the current line.
    if (sizeConsumedOnCurrentLineIncludingMinConstraint +
                flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
                childLeadingGapMainAxis >
            availableInnerMainDim &&
        isNodeFlexWrap && flexAlgoRowMeasurement.itemsOnLine > 0) {
      break;
    }

    sizeConsumedOnCurrentLineIncludingMinConstraint +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
        childLeadingGapMainAxis;
    flexAlgoRowMeasurement.sizeConsumedOnCurrentLine +=
        flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
        childLeadingGapMainAxis;
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
// please ensure that ABI49_0_0YGDistributeFreeSpaceFirstPass is called.
static float ABI49_0_0YGDistributeFreeSpaceSecondPass(
    ABI49_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI49_0_0YGNodeRef node,
    const ABI49_0_0YGFlexDirection mainAxis,
    const ABI49_0_0YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool mainAxisOverflows,
    const ABI49_0_0YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const ABI49_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  float childFlexBasis = 0;
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float deltaFreeSpace = 0;
  const bool isMainAxisRow = ABI49_0_0YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != ABI49_0_0YGWrapNoWrap;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    childFlexBasis = ABI49_0_0YGNodeBoundAxisWithinMinAndMax(
                         currentRelativeChild,
                         mainAxis,
                         currentRelativeChild->getLayout().computedFlexBasis,
                         mainAxisownerSize)
                         .unwrap();
    float updatedMainSize = childFlexBasis;

    if (!ABI49_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;
      // Is this child able to shrink?
      if (flexShrinkScaledFactor != 0) {
        float childSize;

        if (!ABI49_0_0YGFloatIsUndefined(
                collectedFlexItemsValues.totalFlexShrinkScaledFactors) &&
            collectedFlexItemsValues.totalFlexShrinkScaledFactors == 0) {
          childSize = childFlexBasis + flexShrinkScaledFactor;
        } else {
          childSize = childFlexBasis +
              (collectedFlexItemsValues.remainingFreeSpace /
               collectedFlexItemsValues.totalFlexShrinkScaledFactors) *
                  flexShrinkScaledFactor;
        }

        updatedMainSize = ABI49_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            childSize,
            availableInnerMainDim,
            availableInnerWidth);
      }
    } else if (
        !ABI49_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!ABI49_0_0YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        updatedMainSize = ABI49_0_0YGNodeBoundAxis(
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
    ABI49_0_0YGMeasureMode childCrossMeasureMode;
    ABI49_0_0YGMeasureMode childMainMeasureMode = ABI49_0_0YGMeasureModeExactly;

    const auto& childStyle = currentRelativeChild->getStyle();
    if (!childStyle.aspectRatio().isUndefined()) {
      childCrossSize = isMainAxisRow
          ? (childMainSize - marginMain) / childStyle.aspectRatio().unwrap()
          : (childMainSize - marginMain) * childStyle.aspectRatio().unwrap();
      childCrossMeasureMode = ABI49_0_0YGMeasureModeExactly;

      childCrossSize += marginCross;
    } else if (
        !ABI49_0_0YGFloatIsUndefined(availableInnerCrossDim) &&
        !ABI49_0_0YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        measureModeCrossDim == ABI49_0_0YGMeasureModeExactly &&
        !(isNodeFlexWrap && mainAxisOverflows) &&
        ABI49_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI49_0_0YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            ABI49_0_0YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit !=
            ABI49_0_0YGUnitAuto) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = ABI49_0_0YGMeasureModeExactly;
    } else if (!ABI49_0_0YGNodeIsStyleDimDefined(
                   currentRelativeChild, crossAxis, availableInnerCrossDim)) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = ABI49_0_0YGFloatIsUndefined(childCrossSize)
          ? ABI49_0_0YGMeasureModeUndefined
          : ABI49_0_0YGMeasureModeAtMost;
    } else {
      childCrossSize =
          ABI49_0_0YGResolveValue(
              currentRelativeChild->getResolvedDimension(dim[crossAxis]),
              availableInnerCrossDim)
              .unwrap() +
          marginCross;
      const bool isLoosePercentageMeasurement =
          currentRelativeChild->getResolvedDimension(dim[crossAxis]).unit ==
              ABI49_0_0YGUnitPercent &&
          measureModeCrossDim != ABI49_0_0YGMeasureModeExactly;
      childCrossMeasureMode =
          ABI49_0_0YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
          ? ABI49_0_0YGMeasureModeUndefined
          : ABI49_0_0YGMeasureModeExactly;
    }

    ABI49_0_0YGConstrainMaxSizeForMode(
        currentRelativeChild,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        &childMainMeasureMode,
        &childMainSize);
    ABI49_0_0YGConstrainMaxSizeForMode(
        currentRelativeChild,
        crossAxis,
        availableInnerCrossDim,
        availableInnerWidth,
        &childCrossMeasureMode,
        &childCrossSize);

    const bool requiresStretchLayout =
        !ABI49_0_0YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        ABI49_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI49_0_0YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            ABI49_0_0YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit != ABI49_0_0YGUnitAuto;

    const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
    const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

    const ABI49_0_0YGMeasureMode childWidthMeasureMode =
        isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
    const ABI49_0_0YGMeasureMode childHeightMeasureMode =
        !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

    const bool isLayoutPass = performLayout && !requiresStretchLayout;
    // Recursively call the layout algorithm for this child with the updated
    // main size.
    ABI49_0_0YGLayoutNodeInternal(
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
        node->getLayout().hadOverflow() ||
        currentRelativeChild->getLayout().hadOverflow());
  }
  return deltaFreeSpace;
}

// It distributes the free space to the flexible items.For those flexible items
// whose min and max constraints are triggered, those flex item's clamped size
// is removed from the remaingfreespace.
static void ABI49_0_0YGDistributeFreeSpaceFirstPass(
    ABI49_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI49_0_0YGFlexDirection mainAxis,
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
        ABI49_0_0YGNodeBoundAxisWithinMinAndMax(
            currentRelativeChild,
            mainAxis,
            currentRelativeChild->getLayout().computedFlexBasis,
            mainAxisownerSize)
            .unwrap();

    if (collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;

      // Is this child able to shrink?
      if (!ABI49_0_0YGFloatIsUndefined(flexShrinkScaledFactor) &&
          flexShrinkScaledFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexShrinkScaledFactors *
                flexShrinkScaledFactor;
        boundMainSize = ABI49_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);
        if (!ABI49_0_0YGFloatIsUndefined(baseMainSize) &&
            !ABI49_0_0YGFloatIsUndefined(boundMainSize) &&
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
        !ABI49_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!ABI49_0_0YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexGrowFactors * flexGrowFactor;
        boundMainSize = ABI49_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);

        if (!ABI49_0_0YGFloatIsUndefined(baseMainSize) &&
            !ABI49_0_0YGFloatIsUndefined(boundMainSize) &&
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
static void ABI49_0_0YGResolveFlexibleLength(
    const ABI49_0_0YGNodeRef node,
    ABI49_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI49_0_0YGFlexDirection mainAxis,
    const ABI49_0_0YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool mainAxisOverflows,
    const ABI49_0_0YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const ABI49_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount) {
  const float originalFreeSpace = collectedFlexItemsValues.remainingFreeSpace;
  // First pass: detect the flex items whose min/max constraints trigger
  ABI49_0_0YGDistributeFreeSpaceFirstPass(
      collectedFlexItemsValues,
      mainAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerWidth);

  // Second pass: resolve the sizes of the flexible items
  const float distributedFreeSpace = ABI49_0_0YGDistributeFreeSpaceSecondPass(
      collectedFlexItemsValues,
      node,
      mainAxis,
      crossAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerCrossDim,
      availableInnerWidth,
      availableInnerHeight,
      mainAxisOverflows,
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

static void ABI49_0_0YGJustifyMainAxis(
    const ABI49_0_0YGNodeRef node,
    ABI49_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const uint32_t startOfLineIndex,
    const ABI49_0_0YGFlexDirection mainAxis,
    const ABI49_0_0YGFlexDirection crossAxis,
    const ABI49_0_0YGMeasureMode measureModeMainDim,
    const ABI49_0_0YGMeasureMode measureModeCrossDim,
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
  const float gap = node->getGapForAxis(mainAxis, ownerWidth).unwrap();
  // If we are using "at most" rules in the main axis, make sure that
  // remainingFreeSpace is 0 when min main dimension is not given
  if (measureModeMainDim == ABI49_0_0YGMeasureModeAtMost &&
      collectedFlexItemsValues.remainingFreeSpace > 0) {
    if (!style.minDimensions()[dim[mainAxis]].isUndefined() &&
        !ABI49_0_0YGResolveValue(style.minDimensions()[dim[mainAxis]], mainAxisownerSize)
             .isUndefined()) {
      // This condition makes sure that if the size of main dimension(after
      // considering child nodes main dim, leading and trailing padding etc)
      // falls below min dimension, then the remainingFreeSpace is reassigned
      // considering the min dimension

      // `minAvailableMainDim` denotes minimum available space in which child
      // can be laid out, it will exclude space consumed by padding and border.
      const float minAvailableMainDim =
          ABI49_0_0YGResolveValue(
              style.minDimensions()[dim[mainAxis]], mainAxisownerSize)
              .unwrap() -
          leadingPaddingAndBorderMain - trailingPaddingAndBorderMain;
      const float occupiedSpaceByChildNodes =
          availableInnerMainDim - collectedFlexItemsValues.remainingFreeSpace;
      collectedFlexItemsValues.remainingFreeSpace =
          ABI49_0_0YGFloatMax(0, minAvailableMainDim - occupiedSpaceByChildNodes);
    } else {
      collectedFlexItemsValues.remainingFreeSpace = 0;
    }
  }

  int numberOfAutoMarginsOnCurrentLine = 0;
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const ABI49_0_0YGNodeRef child = node->getChild(i);
    if (child->getStyle().positionType() != ABI49_0_0YGPositionTypeAbsolute) {
      if (child->marginLeadingValue(mainAxis).unit == ABI49_0_0YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
      if (child->marginTrailingValue(mainAxis).unit == ABI49_0_0YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
    }
  }

  // In order to position the elements in the main axis, we have two controls.
  // The space between the beginning and the first element and the space between
  // each two elements.
  float leadingMainDim = 0;
  float betweenMainDim = gap;
  const ABI49_0_0YGJustify justifyContent = node->getStyle().justifyContent();

  if (numberOfAutoMarginsOnCurrentLine == 0) {
    switch (justifyContent) {
      case ABI49_0_0YGJustifyCenter:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace / 2;
        break;
      case ABI49_0_0YGJustifyFlexEnd:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace;
        break;
      case ABI49_0_0YGJustifySpaceBetween:
        if (collectedFlexItemsValues.itemsOnLine > 1) {
          betweenMainDim +=
              ABI49_0_0YGFloatMax(collectedFlexItemsValues.remainingFreeSpace, 0) /
              (collectedFlexItemsValues.itemsOnLine - 1);
        }
        break;
      case ABI49_0_0YGJustifySpaceEvenly:
        // Space is distributed evenly across all elements
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace /
            (collectedFlexItemsValues.itemsOnLine + 1);
        betweenMainDim += leadingMainDim;
        break;
      case ABI49_0_0YGJustifySpaceAround:
        // Space on the edges is half of the space between elements
        leadingMainDim = 0.5f * collectedFlexItemsValues.remainingFreeSpace /
            collectedFlexItemsValues.itemsOnLine;
        betweenMainDim += leadingMainDim * 2;
        break;
      case ABI49_0_0YGJustifyFlexStart:
        break;
    }
  }

  collectedFlexItemsValues.mainDim =
      leadingPaddingAndBorderMain + leadingMainDim;
  collectedFlexItemsValues.crossDim = 0;

  float maxAscentForCurrentLine = 0;
  float maxDescentForCurrentLine = 0;
  bool isNodeBaselineLayout = ABI49_0_0YGIsBaselineLayout(node);
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const ABI49_0_0YGNodeRef child = node->getChild(i);
    const ABI49_0_0YGStyle& childStyle = child->getStyle();
    const ABI49_0_0YGLayout childLayout = child->getLayout();
    const bool isLastChild = i == collectedFlexItemsValues.endOfLineIndex - 1;
    // remove the gap if it is the last element of the line
    if (isLastChild) {
      betweenMainDim -= gap;
    }
    if (childStyle.display() == ABI49_0_0YGDisplayNone) {
      continue;
    }
    if (childStyle.positionType() == ABI49_0_0YGPositionTypeAbsolute &&
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
      if (childStyle.positionType() != ABI49_0_0YGPositionTypeAbsolute) {
        if (child->marginLeadingValue(mainAxis).unit == ABI49_0_0YGUnitAuto) {
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

        if (child->marginTrailingValue(mainAxis).unit == ABI49_0_0YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              numberOfAutoMarginsOnCurrentLine;
        }
        bool canSkipFlex =
            !performLayout && measureModeCrossDim == ABI49_0_0YGMeasureModeExactly;
        if (canSkipFlex) {
          // If we skipped the flex step, then we can't rely on the measuredDims
          // because they weren't computed. This means we can't call
          // ABI49_0_0YGNodeDimWithMargin.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              child->getMarginForAxis(mainAxis, availableInnerWidth).unwrap() +
              childLayout.computedFlexBasis.unwrap();
          collectedFlexItemsValues.crossDim = availableInnerCrossDim;
        } else {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              ABI49_0_0YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

          if (isNodeBaselineLayout) {
            // If the child is baseline aligned then the cross dimension is
            // calculated by adding maxAscent and maxDescent from the baseline.
            const float ascent = ABI49_0_0YGBaseline(child, layoutContext) +
                child
                    ->getLeadingMargin(
                        ABI49_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight] +
                child
                    ->getMarginForAxis(
                        ABI49_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap() -
                ascent;

            maxAscentForCurrentLine =
                ABI49_0_0YGFloatMax(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                ABI49_0_0YGFloatMax(maxDescentForCurrentLine, descent);
          } else {
            // The cross dimension is the max of the elements dimension since
            // there can only be one element in that cross dimension in the case
            // when the items are not baseline aligned
            collectedFlexItemsValues.crossDim = ABI49_0_0YGFloatMax(
                collectedFlexItemsValues.crossDim,
                ABI49_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
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
//    - node: current node to be sized and laid out
//    - availableWidth & availableHeight: available size to be used for sizing
//      the node or ABI49_0_0YGUndefined if the size is not available; interpretation
//      depends on layout flags
//    - ownerDirection: the inline (text) direction within the owner
//      (left-to-right or right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//      for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//      for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//      dimensions of the node or it requires the entire node and its subtree to
//      be laid out (with final positions)
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
//      - ABI49_0_0YGMeasureModeUndefined: max content
//      - ABI49_0_0YGMeasureModeExactly: fill available
//      - ABI49_0_0YGMeasureModeAtMost: fit content
//
//    When calling ABI49_0_0YGNodelayoutImpl and ABI49_0_0YGLayoutNodeInternal, if the caller
//    passes an available size of undefined then it must also pass a measure
//    mode of ABI49_0_0YGMeasureModeUndefined in that dimension.
//
static void ABI49_0_0YGNodelayoutImpl(
    const ABI49_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI49_0_0YGDirection ownerDirection,
    const ABI49_0_0YGMeasureMode widthMeasureMode,
    const ABI49_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const ABI49_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    const uint32_t depth,
    const uint32_t generationCount,
    const LayoutPassReason reason) {
  ABI49_0_0YGAssertWithNode(
      node,
      ABI49_0_0YGFloatIsUndefined(availableWidth)
          ? widthMeasureMode == ABI49_0_0YGMeasureModeUndefined
          : true,
      "availableWidth is indefinite so widthMeasureMode must be "
      "YGMeasureModeUndefined");
  ABI49_0_0YGAssertWithNode(
      node,
      ABI49_0_0YGFloatIsUndefined(availableHeight)
          ? heightMeasureMode == ABI49_0_0YGMeasureModeUndefined
          : true,
      "availableHeight is indefinite so heightMeasureMode must be "
      "YGMeasureModeUndefined");

  (performLayout ? layoutMarkerData.layouts : layoutMarkerData.measures) += 1;

  // Set the resolved resolution in the node's layout.
  const ABI49_0_0YGDirection direction = node->resolveDirection(ownerDirection);
  node->setLayoutDirection(direction);

  const ABI49_0_0YGFlexDirection flexRowDirection =
      ABI49_0_0YGResolveFlexDirection(ABI49_0_0YGFlexDirectionRow, direction);
  const ABI49_0_0YGFlexDirection flexColumnDirection =
      ABI49_0_0YGResolveFlexDirection(ABI49_0_0YGFlexDirectionColumn, direction);

  const ABI49_0_0YGEdge startEdge =
      direction == ABI49_0_0YGDirectionLTR ? ABI49_0_0YGEdgeLeft : ABI49_0_0YGEdgeRight;
  const ABI49_0_0YGEdge endEdge = direction == ABI49_0_0YGDirectionLTR ? ABI49_0_0YGEdgeRight : ABI49_0_0YGEdgeLeft;

  const float marginRowLeading =
      node->getLeadingMargin(flexRowDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginRowLeading, startEdge);
  const float marginRowTrailing =
      node->getTrailingMargin(flexRowDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginRowTrailing, endEdge);
  const float marginColumnLeading =
      node->getLeadingMargin(flexColumnDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginColumnLeading, ABI49_0_0YGEdgeTop);
  const float marginColumnTrailing =
      node->getTrailingMargin(flexColumnDirection, ownerWidth).unwrap();
  node->setLayoutMargin(marginColumnTrailing, ABI49_0_0YGEdgeBottom);

  const float marginAxisRow = marginRowLeading + marginRowTrailing;
  const float marginAxisColumn = marginColumnLeading + marginColumnTrailing;

  node->setLayoutBorder(node->getLeadingBorder(flexRowDirection), startEdge);
  node->setLayoutBorder(node->getTrailingBorder(flexRowDirection), endEdge);
  node->setLayoutBorder(node->getLeadingBorder(flexColumnDirection), ABI49_0_0YGEdgeTop);
  node->setLayoutBorder(
      node->getTrailingBorder(flexColumnDirection), ABI49_0_0YGEdgeBottom);

  node->setLayoutPadding(
      node->getLeadingPadding(flexRowDirection, ownerWidth).unwrap(),
      startEdge);
  node->setLayoutPadding(
      node->getTrailingPadding(flexRowDirection, ownerWidth).unwrap(), endEdge);
  node->setLayoutPadding(
      node->getLeadingPadding(flexColumnDirection, ownerWidth).unwrap(),
      ABI49_0_0YGEdgeTop);
  node->setLayoutPadding(
      node->getTrailingPadding(flexColumnDirection, ownerWidth).unwrap(),
      ABI49_0_0YGEdgeBottom);

  if (node->hasMeasureFunc()) {
    ABI49_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(
        node,
        availableWidth - marginAxisRow,
        availableHeight - marginAxisColumn,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight,
        layoutMarkerData,
        layoutContext,
        reason);
    return;
  }

  const uint32_t childCount = ABI49_0_0YGNodeGetChildCount(node);
  if (childCount == 0) {
    ABI49_0_0YGNodeEmptyContainerSetMeasuredDimensions(
        node,
        availableWidth - marginAxisRow,
        availableHeight - marginAxisColumn,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm
  // if we already know the size
  if (!performLayout &&
      ABI49_0_0YGNodeFixedSizeSetMeasuredDimensions(
          node,
          availableWidth - marginAxisRow,
          availableHeight - marginAxisColumn,
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
  const ABI49_0_0YGFlexDirection mainAxis =
      ABI49_0_0YGResolveFlexDirection(node->getStyle().flexDirection(), direction);
  const ABI49_0_0YGFlexDirection crossAxis = ABI49_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI49_0_0YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap() != ABI49_0_0YGWrapNoWrap;

  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;
  const float crossAxisownerSize = isMainAxisRow ? ownerHeight : ownerWidth;

  const float paddingAndBorderAxisMain =
      ABI49_0_0YGNodePaddingAndBorderForAxis(node, mainAxis, ownerWidth);
  const float leadingPaddingAndBorderCross =
      node->getLeadingPaddingAndBorder(crossAxis, ownerWidth).unwrap();
  const float trailingPaddingAndBorderCross =
      node->getTrailingPaddingAndBorder(crossAxis, ownerWidth).unwrap();
  const float paddingAndBorderAxisCross =
      leadingPaddingAndBorderCross + trailingPaddingAndBorderCross;

  ABI49_0_0YGMeasureMode measureModeMainDim =
      isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  ABI49_0_0YGMeasureMode measureModeCrossDim =
      isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS

  float availableInnerWidth = ABI49_0_0YGNodeCalculateAvailableInnerDim(
      node,
      ABI49_0_0YGDimensionWidth,
      availableWidth - marginAxisRow,
      paddingAndBorderAxisRow,
      ownerWidth);
  float availableInnerHeight = ABI49_0_0YGNodeCalculateAvailableInnerDim(
      node,
      ABI49_0_0YGDimensionHeight,
      availableHeight - marginAxisColumn,
      paddingAndBorderAxisColumn,
      ownerHeight);

  float availableInnerMainDim =
      isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim =
      isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM

  // Computed basis + margins + gap
  float totalMainDim = 0;
  totalMainDim += ABI49_0_0YGNodeComputeFlexBasisForChildren(
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

  if (childCount > 1) {
    totalMainDim +=
        node->getGapForAxis(mainAxis, availableInnerCrossDim).unwrap() *
        (childCount - 1);
  }

  const bool mainAxisOverflows =
      (measureModeMainDim != ABI49_0_0YGMeasureModeUndefined) &&
      totalMainDim > availableInnerMainDim;

  if (isNodeFlexWrap && mainAxisOverflows &&
      measureModeMainDim == ABI49_0_0YGMeasureModeAtMost) {
    measureModeMainDim = ABI49_0_0YGMeasureModeExactly;
  }
  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  uint32_t startOfLineIndex = 0;
  uint32_t endOfLineIndex = 0;

  // Number of lines.
  uint32_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  const float crossAxisGap =
      node->getGapForAxis(crossAxis, availableInnerCrossDim).unwrap();

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;
  ABI49_0_0YGCollectFlexItemsRowValues collectedFlexItemsValues;
  for (; endOfLineIndex < childCount;
       lineCount++, startOfLineIndex = endOfLineIndex) {
    collectedFlexItemsValues = ABI49_0_0YGCalculateCollectFlexItemsRowValues(
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
        !performLayout && measureModeCrossDim == ABI49_0_0YGMeasureModeExactly;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated. If
    // the main dimension size isn't known, it is computed based on the line
    // length, so there's no more space left to distribute.

    bool sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't
    // violate min and max
    if (measureModeMainDim != ABI49_0_0YGMeasureModeExactly) {
      const auto& minDimensions = node->getStyle().minDimensions();
      const auto& maxDimensions = node->getStyle().maxDimensions();
      const float minInnerWidth =
          ABI49_0_0YGResolveValue(minDimensions[ABI49_0_0YGDimensionWidth], ownerWidth).unwrap() -
          paddingAndBorderAxisRow;
      const float maxInnerWidth =
          ABI49_0_0YGResolveValue(maxDimensions[ABI49_0_0YGDimensionWidth], ownerWidth).unwrap() -
          paddingAndBorderAxisRow;
      const float minInnerHeight =
          ABI49_0_0YGResolveValue(minDimensions[ABI49_0_0YGDimensionHeight], ownerHeight)
              .unwrap() -
          paddingAndBorderAxisColumn;
      const float maxInnerHeight =
          ABI49_0_0YGResolveValue(maxDimensions[ABI49_0_0YGDimensionHeight], ownerHeight)
              .unwrap() -
          paddingAndBorderAxisColumn;

      const float minInnerMainDim =
          isMainAxisRow ? minInnerWidth : minInnerHeight;
      const float maxInnerMainDim =
          isMainAxisRow ? maxInnerWidth : maxInnerHeight;

      if (!ABI49_0_0YGFloatIsUndefined(minInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine <
              minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (
          !ABI49_0_0YGFloatIsUndefined(maxInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine >
              maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        if (!node->getConfig()->useLegacyStretchBehaviour &&
            ((!ABI49_0_0YGFloatIsUndefined(
                  collectedFlexItemsValues.totalFlexGrowFactors) &&
              collectedFlexItemsValues.totalFlexGrowFactors == 0) ||
             (!ABI49_0_0YGFloatIsUndefined(node->resolveFlexGrow()) &&
              node->resolveFlexGrow() == 0))) {
          // If we don't have any children to flex or we can't flex the node
          // itself, space we've used is all space we need. Root node also
          // should be shrunk to minimum
          availableInnerMainDim =
              collectedFlexItemsValues.sizeConsumedOnCurrentLine;
        }

        sizeBasedOnContent = !node->getConfig()->useLegacyStretchBehaviour;
      }
    }

    if (!sizeBasedOnContent && !ABI49_0_0YGFloatIsUndefined(availableInnerMainDim)) {
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
      ABI49_0_0YGResolveFlexibleLength(
          node,
          collectedFlexItemsValues,
          mainAxis,
          crossAxis,
          mainAxisownerSize,
          availableInnerMainDim,
          availableInnerCrossDim,
          availableInnerWidth,
          availableInnerHeight,
          mainAxisOverflows,
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

    ABI49_0_0YGJustifyMainAxis(
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
    if (measureModeCrossDim == ABI49_0_0YGMeasureModeUndefined ||
        measureModeCrossDim == ABI49_0_0YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
          ABI49_0_0YGNodeBoundAxis(
              node,
              crossAxis,
              collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
              crossAxisownerSize,
              ownerWidth) -
          paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI49_0_0YGMeasureModeExactly) {
      collectedFlexItemsValues.crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    collectedFlexItemsValues.crossDim =
        ABI49_0_0YGNodeBoundAxis(
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
        const ABI49_0_0YGNodeRef child = node->getChild(i);
        if (child->getStyle().display() == ABI49_0_0YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType() == ABI49_0_0YGPositionTypeAbsolute) {
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
              ABI49_0_0YGFloatIsUndefined(child->getLayout().position[pos[crossAxis]])) {
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
          const ABI49_0_0YGAlign alignItem = ABI49_0_0YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time forcing the cross-axis size to be the computed
          // cross size for the current line.
          if (alignItem == ABI49_0_0YGAlignStretch &&
              child->marginLeadingValue(crossAxis).unit != ABI49_0_0YGUnitAuto &&
              child->marginTrailingValue(crossAxis).unit != ABI49_0_0YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!ABI49_0_0YGNodeIsStyleDimDefined(
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

              ABI49_0_0YGMeasureMode childMainMeasureMode = ABI49_0_0YGMeasureModeExactly;
              ABI49_0_0YGMeasureMode childCrossMeasureMode = ABI49_0_0YGMeasureModeExactly;
              ABI49_0_0YGConstrainMaxSizeForMode(
                  child,
                  mainAxis,
                  availableInnerMainDim,
                  availableInnerWidth,
                  &childMainMeasureMode,
                  &childMainSize);
              ABI49_0_0YGConstrainMaxSizeForMode(
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
                  alignContent != ABI49_0_0YGAlignStretch && isNodeFlexWrap;
              const ABI49_0_0YGMeasureMode childWidthMeasureMode =
                  ABI49_0_0YGFloatIsUndefined(childWidth) ||
                      (!isMainAxisRow && crossAxisDoesNotGrow)
                  ? ABI49_0_0YGMeasureModeUndefined
                  : ABI49_0_0YGMeasureModeExactly;
              const ABI49_0_0YGMeasureMode childHeightMeasureMode =
                  ABI49_0_0YGFloatIsUndefined(childHeight) ||
                      (isMainAxisRow && crossAxisDoesNotGrow)
                  ? ABI49_0_0YGMeasureModeUndefined
                  : ABI49_0_0YGMeasureModeExactly;

              ABI49_0_0YGLayoutNodeInternal(
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
                ABI49_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (child->marginLeadingValue(crossAxis).unit == ABI49_0_0YGUnitAuto &&
                child->marginTrailingValue(crossAxis).unit == ABI49_0_0YGUnitAuto) {
              leadingCrossDim += ABI49_0_0YGFloatMax(0.0f, remainingCrossDim / 2);
            } else if (
                child->marginTrailingValue(crossAxis).unit == ABI49_0_0YGUnitAuto) {
              // No-Op
            } else if (
                child->marginLeadingValue(crossAxis).unit == ABI49_0_0YGUnitAuto) {
              leadingCrossDim += ABI49_0_0YGFloatMax(0.0f, remainingCrossDim);
            } else if (alignItem == ABI49_0_0YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == ABI49_0_0YGAlignCenter) {
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

    const float appliedCrossGap = lineCount != 0 ? crossAxisGap : 0.0f;
    totalLineCrossDim += collectedFlexItemsValues.crossDim + appliedCrossGap;
    maxLineMainDim =
        ABI49_0_0YGFloatMax(maxLineMainDim, collectedFlexItemsValues.mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  // currentLead stores the size of the cross dim
  if (performLayout && (isNodeFlexWrap || ABI49_0_0YGIsBaselineLayout(node))) {
    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;
    if (!ABI49_0_0YGFloatIsUndefined(availableInnerCrossDim)) {
      const float remainingAlignContentDim =
          availableInnerCrossDim - totalLineCrossDim;
      switch (node->getStyle().alignContent()) {
        case ABI49_0_0YGAlignFlexEnd:
          currentLead += remainingAlignContentDim;
          break;
        case ABI49_0_0YGAlignCenter:
          currentLead += remainingAlignContentDim / 2;
          break;
        case ABI49_0_0YGAlignStretch:
          if (availableInnerCrossDim > totalLineCrossDim) {
            crossDimLead = remainingAlignContentDim / lineCount;
          }
          break;
        case ABI49_0_0YGAlignSpaceAround:
          if (availableInnerCrossDim > totalLineCrossDim) {
            currentLead += remainingAlignContentDim / (2 * lineCount);
            if (lineCount > 1) {
              crossDimLead = remainingAlignContentDim / lineCount;
            }
          } else {
            currentLead += remainingAlignContentDim / 2;
          }
          break;
        case ABI49_0_0YGAlignSpaceBetween:
          if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
            crossDimLead = remainingAlignContentDim / (lineCount - 1);
          }
          break;
        case ABI49_0_0YGAlignAuto:
        case ABI49_0_0YGAlignFlexStart:
        case ABI49_0_0YGAlignBaseline:
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
        const ABI49_0_0YGNodeRef child = node->getChild(ii);
        if (child->getStyle().display() == ABI49_0_0YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType() != ABI49_0_0YGPositionTypeAbsolute) {
          if (child->getLineIndex() != i) {
            break;
          }
          if (ABI49_0_0YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = ABI49_0_0YGFloatMax(
                lineHeight,
                child->getLayout().measuredDimensions[dim[crossAxis]] +
                    child->getMarginForAxis(crossAxis, availableInnerWidth)
                        .unwrap());
          }
          if (ABI49_0_0YGNodeAlignItem(node, child) == ABI49_0_0YGAlignBaseline) {
            const float ascent = ABI49_0_0YGBaseline(child, layoutContext) +
                child
                    ->getLeadingMargin(
                        ABI49_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap();
            const float descent =
                child->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight] +
                child
                    ->getMarginForAxis(
                        ABI49_0_0YGFlexDirectionColumn, availableInnerWidth)
                    .unwrap() -
                ascent;
            maxAscentForCurrentLine =
                ABI49_0_0YGFloatMax(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                ABI49_0_0YGFloatMax(maxDescentForCurrentLine, descent);
            lineHeight = ABI49_0_0YGFloatMax(
                lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;
      currentLead += i != 0 ? crossAxisGap : 0;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const ABI49_0_0YGNodeRef child = node->getChild(ii);
          if (child->getStyle().display() == ABI49_0_0YGDisplayNone) {
            continue;
          }
          if (child->getStyle().positionType() != ABI49_0_0YGPositionTypeAbsolute) {
            switch (ABI49_0_0YGNodeAlignItem(node, child)) {
              case ABI49_0_0YGAlignFlexStart: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    pos[crossAxis]);
                break;
              }
              case ABI49_0_0YGAlignFlexEnd: {
                child->setLayoutPosition(
                    currentLead + lineHeight -
                        child->getTrailingMargin(crossAxis, availableInnerWidth)
                            .unwrap() -
                        child->getLayout().measuredDimensions[dim[crossAxis]],
                    pos[crossAxis]);
                break;
              }
              case ABI49_0_0YGAlignCenter: {
                float childHeight =
                    child->getLayout().measuredDimensions[dim[crossAxis]];

                child->setLayoutPosition(
                    currentLead + (lineHeight - childHeight) / 2,
                    pos[crossAxis]);
                break;
              }
              case ABI49_0_0YGAlignStretch: {
                child->setLayoutPosition(
                    currentLead +
                        child->getLeadingMargin(crossAxis, availableInnerWidth)
                            .unwrap(),
                    pos[crossAxis]);

                // Remeasure child with the line height as it as been only
                // measured with the owners height yet.
                if (!ABI49_0_0YGNodeIsStyleDimDefined(
                        child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth = isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[ABI49_0_0YGDimensionWidth] +
                         child->getMarginForAxis(mainAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  const float childHeight = !isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[ABI49_0_0YGDimensionHeight] +
                         child->getMarginForAxis(crossAxis, availableInnerWidth)
                             .unwrap())
                      : lineHeight;

                  if (!(ABI49_0_0YGFloatsEqual(
                            childWidth,
                            child->getLayout()
                                .measuredDimensions[ABI49_0_0YGDimensionWidth]) &&
                        ABI49_0_0YGFloatsEqual(
                            childHeight,
                            child->getLayout()
                                .measuredDimensions[ABI49_0_0YGDimensionHeight]))) {
                    ABI49_0_0YGLayoutNodeInternal(
                        child,
                        childWidth,
                        childHeight,
                        direction,
                        ABI49_0_0YGMeasureModeExactly,
                        ABI49_0_0YGMeasureModeExactly,
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
              case ABI49_0_0YGAlignBaseline: {
                child->setLayoutPosition(
                    currentLead + maxAscentForCurrentLine -
                        ABI49_0_0YGBaseline(child, layoutContext) +
                        child
                            ->getLeadingPosition(
                                ABI49_0_0YGFlexDirectionColumn, availableInnerCrossDim)
                            .unwrap(),
                    ABI49_0_0YGEdgeTop);

                break;
              }
              case ABI49_0_0YGAlignAuto:
              case ABI49_0_0YGAlignSpaceBetween:
              case ABI49_0_0YGAlignSpaceAround:
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
      ABI49_0_0YGNodeBoundAxis(
          node,
          ABI49_0_0YGFlexDirectionRow,
          availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      ABI49_0_0YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      ABI49_0_0YGNodeBoundAxis(
          node,
          ABI49_0_0YGFlexDirectionColumn,
          availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      ABI49_0_0YGDimensionHeight);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI49_0_0YGMeasureModeUndefined ||
      (node->getStyle().overflow() != ABI49_0_0YGOverflowScroll &&
       measureModeMainDim == ABI49_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        ABI49_0_0YGNodeBoundAxis(
            node, mainAxis, maxLineMainDim, mainAxisownerSize, ownerWidth),
        dim[mainAxis]);

  } else if (
      measureModeMainDim == ABI49_0_0YGMeasureModeAtMost &&
      node->getStyle().overflow() == ABI49_0_0YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        ABI49_0_0YGFloatMax(
            ABI49_0_0YGFloatMin(
                availableInnerMainDim + paddingAndBorderAxisMain,
                ABI49_0_0YGNodeBoundAxisWithinMinAndMax(
                    node,
                    mainAxis,
                    ABI49_0_0YGFloatOptional{maxLineMainDim},
                    mainAxisownerSize)
                    .unwrap()),
            paddingAndBorderAxisMain),
        dim[mainAxis]);
  }

  if (measureModeCrossDim == ABI49_0_0YGMeasureModeUndefined ||
      (node->getStyle().overflow() != ABI49_0_0YGOverflowScroll &&
       measureModeCrossDim == ABI49_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        ABI49_0_0YGNodeBoundAxis(
            node,
            crossAxis,
            totalLineCrossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth),
        dim[crossAxis]);

  } else if (
      measureModeCrossDim == ABI49_0_0YGMeasureModeAtMost &&
      node->getStyle().overflow() == ABI49_0_0YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        ABI49_0_0YGFloatMax(
            ABI49_0_0YGFloatMin(
                availableInnerCrossDim + paddingAndBorderAxisCross,
                ABI49_0_0YGNodeBoundAxisWithinMinAndMax(
                    node,
                    crossAxis,
                    ABI49_0_0YGFloatOptional{
                        totalLineCrossDim + paddingAndBorderAxisCross},
                    crossAxisownerSize)
                    .unwrap()),
            paddingAndBorderAxisCross),
        dim[crossAxis]);
  }

  // As we only wrapped in normal direction yet, we need to reverse the
  // positions on wrap-reverse.
  if (performLayout && node->getStyle().flexWrap() == ABI49_0_0YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI49_0_0YGNodeRef child = ABI49_0_0YGNodeGetChild(node, i);
      if (child->getStyle().positionType() != ABI49_0_0YGPositionTypeAbsolute) {
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
      if (child->getStyle().display() == ABI49_0_0YGDisplayNone ||
          child->getStyle().positionType() != ABI49_0_0YGPositionTypeAbsolute) {
        continue;
      }
      ABI49_0_0YGNodeAbsoluteLayoutChild(
          node,
          child,
          ABI49_0_0YGConfigIsExperimentalFeatureEnabled(
              node->getConfig(),
              ABI49_0_0YGExperimentalFeatureAbsolutePercentageAgainstPaddingEdge)
              ? node->getLayout().measuredDimensions[ABI49_0_0YGDimensionWidth]
              : availableInnerWidth,
          isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
          ABI49_0_0YGConfigIsExperimentalFeatureEnabled(
              node->getConfig(),
              ABI49_0_0YGExperimentalFeatureAbsolutePercentageAgainstPaddingEdge)
              ? node->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight]
              : availableInnerHeight,
          direction,
          config,
          layoutMarkerData,
          layoutContext,
          depth,
          generationCount);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos = mainAxis == ABI49_0_0YGFlexDirectionRowReverse ||
        mainAxis == ABI49_0_0YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos = crossAxis == ABI49_0_0YGFlexDirectionRowReverse ||
        crossAxis == ABI49_0_0YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI49_0_0YGNodeRef child = node->getChild(i);
        if (child->getStyle().display() == ABI49_0_0YGDisplayNone) {
          continue;
        }
        if (needsMainTrailingPos) {
          ABI49_0_0YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          ABI49_0_0YGNodeSetChildTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

bool gPrintChanges = false;
bool gPrintSkips = false;

static const char* spacer =
    "                                                            ";

static const char* ABI49_0_0YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char* ABI49_0_0YGMeasureModeName(
    const ABI49_0_0YGMeasureMode mode,
    const bool performLayout) {
  constexpr auto N = enums::count<ABI49_0_0YGMeasureMode>();
  const char* kMeasureModeNames[N] = {"UNDEFINED", "ABI49_0_0EXACTLY", "AT_MOST"};
  const char* kLayoutModeNames[N] = {
      "LAY_UNDEFINED", "LAY_EXACTLY", "LAY_AT_MOST"};

  if (mode >= N) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool ABI49_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
    ABI49_0_0YGMeasureMode sizeMode,
    float size,
    float lastComputedSize) {
  return sizeMode == ABI49_0_0YGMeasureModeExactly &&
      ABI49_0_0YGFloatsEqual(size, lastComputedSize);
}

static inline bool ABI49_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
    ABI49_0_0YGMeasureMode sizeMode,
    float size,
    ABI49_0_0YGMeasureMode lastSizeMode,
    float lastComputedSize) {
  return sizeMode == ABI49_0_0YGMeasureModeAtMost &&
      lastSizeMode == ABI49_0_0YGMeasureModeUndefined &&
      (size >= lastComputedSize || ABI49_0_0YGFloatsEqual(size, lastComputedSize));
}

static inline bool ABI49_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
    ABI49_0_0YGMeasureMode sizeMode,
    float size,
    ABI49_0_0YGMeasureMode lastSizeMode,
    float lastSize,
    float lastComputedSize) {
  return lastSizeMode == ABI49_0_0YGMeasureModeAtMost &&
      sizeMode == ABI49_0_0YGMeasureModeAtMost && !ABI49_0_0YGFloatIsUndefined(lastSize) &&
      !ABI49_0_0YGFloatIsUndefined(size) && !ABI49_0_0YGFloatIsUndefined(lastComputedSize) &&
      lastSize > size &&
      (lastComputedSize <= size || ABI49_0_0YGFloatsEqual(size, lastComputedSize));
}

YOGA_EXPORT float ABI49_0_0YGRoundValueToPixelGrid(
    const double value,
    const double pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor) {
  double scaledValue = value * pointScaleFactor;
  // We want to calculate `fractial` such that `floor(scaledValue) = scaledValue
  // - fractial`.
  double fractial = fmod(scaledValue, 1.0);
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
  if (ABI49_0_0YGDoubleEqual(fractial, 0)) {
    // First we check if the value is already rounded
    scaledValue = scaledValue - fractial;
  } else if (ABI49_0_0YGDoubleEqual(fractial, 1.0)) {
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceCeil) {
    // Next we check if we need to use forced rounding
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    // Finally we just round the value
    scaledValue = scaledValue - fractial +
        (!ABI49_0_0YGDoubleIsUndefined(fractial) &&
                 (fractial > 0.5 || ABI49_0_0YGDoubleEqual(fractial, 0.5))
             ? 1.0
             : 0.0);
  }
  return (ABI49_0_0YGDoubleIsUndefined(scaledValue) ||
          ABI49_0_0YGDoubleIsUndefined(pointScaleFactor))
      ? ABI49_0_0YGUndefined
      : (float) (scaledValue / pointScaleFactor);
}

YOGA_EXPORT bool ABI49_0_0YGNodeCanUseCachedMeasurement(
    const ABI49_0_0YGMeasureMode widthMode,
    const float width,
    const ABI49_0_0YGMeasureMode heightMode,
    const float height,
    const ABI49_0_0YGMeasureMode lastWidthMode,
    const float lastWidth,
    const ABI49_0_0YGMeasureMode lastHeightMode,
    const float lastHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const ABI49_0_0YGConfigRef config) {
  if ((!ABI49_0_0YGFloatIsUndefined(lastComputedHeight) && lastComputedHeight < 0) ||
      (!ABI49_0_0YGFloatIsUndefined(lastComputedWidth) && lastComputedWidth < 0)) {
    return false;
  }
  bool useRoundedComparison =
      config != nullptr && config->pointScaleFactor != 0;
  const float effectiveWidth = useRoundedComparison
      ? ABI49_0_0YGRoundValueToPixelGrid(width, config->pointScaleFactor, false, false)
      : width;
  const float effectiveHeight = useRoundedComparison
      ? ABI49_0_0YGRoundValueToPixelGrid(height, config->pointScaleFactor, false, false)
      : height;
  const float effectiveLastWidth = useRoundedComparison
      ? ABI49_0_0YGRoundValueToPixelGrid(
            lastWidth, config->pointScaleFactor, false, false)
      : lastWidth;
  const float effectiveLastHeight = useRoundedComparison
      ? ABI49_0_0YGRoundValueToPixelGrid(
            lastHeight, config->pointScaleFactor, false, false)
      : lastHeight;

  const bool hasSameWidthSpec = lastWidthMode == widthMode &&
      ABI49_0_0YGFloatsEqual(effectiveLastWidth, effectiveWidth);
  const bool hasSameHeightSpec = lastHeightMode == heightMode &&
      ABI49_0_0YGFloatsEqual(effectiveLastHeight, effectiveHeight);

  const bool widthIsCompatible =
      hasSameWidthSpec ||
      ABI49_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
          widthMode, width - marginRow, lastComputedWidth) ||
      ABI49_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
          widthMode, width - marginRow, lastWidthMode, lastComputedWidth) ||
      ABI49_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode,
          width - marginRow,
          lastWidthMode,
          lastWidth,
          lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec ||
      ABI49_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
          heightMode, height - marginColumn, lastComputedHeight) ||
      ABI49_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
          heightMode,
          height - marginColumn,
          lastHeightMode,
          lastComputedHeight) ||
      ABI49_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode,
          height - marginColumn,
          lastHeightMode,
          lastHeight,
          lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the ABI49_0_0YGNodelayoutImpl function. It determines whether
// the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as ABI49_0_0YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool ABI49_0_0YGLayoutNodeInternal(
    const ABI49_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI49_0_0YGDirection ownerDirection,
    const ABI49_0_0YGMeasureMode widthMeasureMode,
    const ABI49_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const LayoutPassReason reason,
    const ABI49_0_0YGConfigRef config,
    LayoutData& layoutMarkerData,
    void* const layoutContext,
    uint32_t depth,
    const uint32_t generationCount) {
  ABI49_0_0YGLayout* layout = &node->getLayout();

  depth++;

  const bool needToVisitNode =
      (node->isDirty() && layout->generationCount != generationCount) ||
      layout->lastOwnerDirection != ownerDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.availableWidth = -1;
    layout->cachedLayout.availableHeight = -1;
    layout->cachedLayout.widthMeasureMode = ABI49_0_0YGMeasureModeUndefined;
    layout->cachedLayout.heightMeasureMode = ABI49_0_0YGMeasureModeUndefined;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  ABI49_0_0YGCachedMeasurement* cachedResults = nullptr;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions and dimensions for nodes in the subtree. The algorithm assumes
  // that each node gets laid out a maximum of one time per tree layout, but
  // multiple measurements may be required to resolve all of the flex
  // dimensions. We handle nodes with measure functions specially here because
  // they are the most expensive to measure, so it's worth avoiding redundant
  // measurements if at all possible.
  if (node->hasMeasureFunc()) {
    const float marginAxisRow =
        node->getMarginForAxis(ABI49_0_0YGFlexDirectionRow, ownerWidth).unwrap();
    const float marginAxisColumn =
        node->getMarginForAxis(ABI49_0_0YGFlexDirectionColumn, ownerWidth).unwrap();

    // First, try to use the layout cache.
    if (ABI49_0_0YGNodeCanUseCachedMeasurement(
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
        if (ABI49_0_0YGNodeCanUseCachedMeasurement(
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
    if (ABI49_0_0YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        ABI49_0_0YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (ABI49_0_0YGFloatsEqual(
              layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          ABI49_0_0YGFloatsEqual(
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
    layout->measuredDimensions[ABI49_0_0YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI49_0_0YGDimensionHeight] =
        cachedResults->computedHeight;

    (performLayout ? layoutMarkerData.cachedLayouts
                   : layoutMarkerData.cachedMeasures) += 1;

    if (gPrintChanges && gPrintSkips) {
      Log::log(
          node,
          ABI49_0_0YGLogLevelVerbose,
          nullptr,
          "%s%d.{[skipped] ",
          ABI49_0_0YGSpacer(depth),
          depth);
      node->print(layoutContext);
      Log::log(
          node,
          ABI49_0_0YGLogLevelVerbose,
          nullptr,
          "wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
          ABI49_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI49_0_0YGMeasureModeName(heightMeasureMode, performLayout),
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
          ABI49_0_0YGLogLevelVerbose,
          nullptr,
          "%s%d.{%s",
          ABI49_0_0YGSpacer(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print(layoutContext);
      Log::log(
          node,
          ABI49_0_0YGLogLevelVerbose,
          nullptr,
          "wm: %s, hm: %s, aw: %f ah: %f %s\n",
          ABI49_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI49_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          LayoutPassReasonToString(reason));
    }

    ABI49_0_0YGNodelayoutImpl(
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
          ABI49_0_0YGLogLevelVerbose,
          nullptr,
          "%s%d.}%s",
          ABI49_0_0YGSpacer(depth),
          depth,
          needToVisitNode ? "*" : "");
      node->print(layoutContext);
      Log::log(
          node,
          ABI49_0_0YGLogLevelVerbose,
          nullptr,
          "wm: %s, hm: %s, d: (%f, %f) %s\n",
          ABI49_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI49_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          layout->measuredDimensions[ABI49_0_0YGDimensionWidth],
          layout->measuredDimensions[ABI49_0_0YGDimensionHeight],
          LayoutPassReasonToString(reason));
    }

    layout->lastOwnerDirection = ownerDirection;

    if (cachedResults == nullptr) {
      if (layout->nextCachedMeasurementsIndex + 1 >
          (uint32_t) layoutMarkerData.maxMeasureCache) {
        layoutMarkerData.maxMeasureCache =
            layout->nextCachedMeasurementsIndex + 1;
      }
      if (layout->nextCachedMeasurementsIndex == ABI49_0_0YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          Log::log(node, ABI49_0_0YGLogLevelVerbose, nullptr, "Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI49_0_0YGCachedMeasurement* newCacheEntry;
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
          layout->measuredDimensions[ABI49_0_0YGDimensionWidth];
      newCacheEntry->computedHeight =
          layout->measuredDimensions[ABI49_0_0YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[ABI49_0_0YGDimensionWidth],
        ABI49_0_0YGDimensionWidth);
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[ABI49_0_0YGDimensionHeight],
        ABI49_0_0YGDimensionHeight);

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

YOGA_EXPORT void ABI49_0_0YGConfigSetPointScaleFactor(
    const ABI49_0_0YGConfigRef config,
    const float pixelsInPoint) {
  ABI49_0_0YGAssertWithConfig(
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

static void ABI49_0_0YGRoundToPixelGrid(
    const ABI49_0_0YGNodeRef node,
    const double pointScaleFactor,
    const double absoluteLeft,
    const double absoluteTop) {
  if (pointScaleFactor == 0.0f) {
    return;
  }

  const double nodeLeft = node->getLayout().position[ABI49_0_0YGEdgeLeft];
  const double nodeTop = node->getLayout().position[ABI49_0_0YGEdgeTop];

  const double nodeWidth = node->getLayout().dimensions[ABI49_0_0YGDimensionWidth];
  const double nodeHeight = node->getLayout().dimensions[ABI49_0_0YGDimensionHeight];

  const double absoluteNodeLeft = absoluteLeft + nodeLeft;
  const double absoluteNodeTop = absoluteTop + nodeTop;

  const double absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const double absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  // If a node has a custom measure function we never want to round down its
  // size as this could lead to unwanted text truncation.
  const bool textRounding = node->getNodeType() == ABI49_0_0YGNodeTypeText;

  node->setLayoutPosition(
      ABI49_0_0YGRoundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding),
      ABI49_0_0YGEdgeLeft);

  node->setLayoutPosition(
      ABI49_0_0YGRoundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding),
      ABI49_0_0YGEdgeTop);

  // We multiply dimension by scale factor and if the result is close to the
  // whole number, we don't have any fraction To verify if the result is close
  // to whole number we want to check both floor and ceil numbers
  const bool hasFractionalWidth =
      !ABI49_0_0YGDoubleEqual(fmod(nodeWidth * pointScaleFactor, 1.0), 0) &&
      !ABI49_0_0YGDoubleEqual(fmod(nodeWidth * pointScaleFactor, 1.0), 1.0);
  const bool hasFractionalHeight =
      !ABI49_0_0YGDoubleEqual(fmod(nodeHeight * pointScaleFactor, 1.0), 0) &&
      !ABI49_0_0YGDoubleEqual(fmod(nodeHeight * pointScaleFactor, 1.0), 1.0);

  node->setLayoutDimension(
      ABI49_0_0YGRoundValueToPixelGrid(
          absoluteNodeRight,
          pointScaleFactor,
          (textRounding && hasFractionalWidth),
          (textRounding && !hasFractionalWidth)) -
          ABI49_0_0YGRoundValueToPixelGrid(
              absoluteNodeLeft, pointScaleFactor, false, textRounding),
      ABI49_0_0YGDimensionWidth);

  node->setLayoutDimension(
      ABI49_0_0YGRoundValueToPixelGrid(
          absoluteNodeBottom,
          pointScaleFactor,
          (textRounding && hasFractionalHeight),
          (textRounding && !hasFractionalHeight)) -
          ABI49_0_0YGRoundValueToPixelGrid(
              absoluteNodeTop, pointScaleFactor, false, textRounding),
      ABI49_0_0YGDimensionHeight);

  const uint32_t childCount = ABI49_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    ABI49_0_0YGRoundToPixelGrid(
        ABI49_0_0YGNodeGetChild(node, i),
        pointScaleFactor,
        absoluteNodeLeft,
        absoluteNodeTop);
  }
}

YOGA_EXPORT void ABI49_0_0YGNodeCalculateLayoutWithContext(
    const ABI49_0_0YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const ABI49_0_0YGDirection ownerDirection,
    void* layoutContext) {

  Event::publish<Event::LayoutPassStart>(node, {layoutContext});
  LayoutData markerData = {};

  // Increment the generation count. This will force the recursive routine to
  // visit all dirty nodes at least once. Subsequent visits will be skipped if
  // the input parameters don't change.
  gCurrentGenerationCount.fetch_add(1, std::memory_order_relaxed);
  node->resolveDimension();
  float width = ABI49_0_0YGUndefined;
  ABI49_0_0YGMeasureMode widthMeasureMode = ABI49_0_0YGMeasureModeUndefined;
  const auto& maxDimensions = node->getStyle().maxDimensions();
  if (ABI49_0_0YGNodeIsStyleDimDefined(node, ABI49_0_0YGFlexDirectionRow, ownerWidth)) {
    width =
        (ABI49_0_0YGResolveValue(
             node->getResolvedDimension(dim[ABI49_0_0YGFlexDirectionRow]), ownerWidth) +
         node->getMarginForAxis(ABI49_0_0YGFlexDirectionRow, ownerWidth))
            .unwrap();
    widthMeasureMode = ABI49_0_0YGMeasureModeExactly;
  } else if (!ABI49_0_0YGResolveValue(maxDimensions[ABI49_0_0YGDimensionWidth], ownerWidth)
                  .isUndefined()) {
    width =
        ABI49_0_0YGResolveValue(maxDimensions[ABI49_0_0YGDimensionWidth], ownerWidth).unwrap();
    widthMeasureMode = ABI49_0_0YGMeasureModeAtMost;
  } else {
    width = ownerWidth;
    widthMeasureMode = ABI49_0_0YGFloatIsUndefined(width) ? ABI49_0_0YGMeasureModeUndefined
                                                 : ABI49_0_0YGMeasureModeExactly;
  }

  float height = ABI49_0_0YGUndefined;
  ABI49_0_0YGMeasureMode heightMeasureMode = ABI49_0_0YGMeasureModeUndefined;
  if (ABI49_0_0YGNodeIsStyleDimDefined(node, ABI49_0_0YGFlexDirectionColumn, ownerHeight)) {
    height = (ABI49_0_0YGResolveValue(
                  node->getResolvedDimension(dim[ABI49_0_0YGFlexDirectionColumn]),
                  ownerHeight) +
              node->getMarginForAxis(ABI49_0_0YGFlexDirectionColumn, ownerWidth))
                 .unwrap();
    heightMeasureMode = ABI49_0_0YGMeasureModeExactly;
  } else if (!ABI49_0_0YGResolveValue(maxDimensions[ABI49_0_0YGDimensionHeight], ownerHeight)
                  .isUndefined()) {
    height =
        ABI49_0_0YGResolveValue(maxDimensions[ABI49_0_0YGDimensionHeight], ownerHeight).unwrap();
    heightMeasureMode = ABI49_0_0YGMeasureModeAtMost;
  } else {
    height = ownerHeight;
    heightMeasureMode = ABI49_0_0YGFloatIsUndefined(height) ? ABI49_0_0YGMeasureModeUndefined
                                                   : ABI49_0_0YGMeasureModeExactly;
  }
  if (ABI49_0_0YGLayoutNodeInternal(
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
    ABI49_0_0YGRoundToPixelGrid(node, node->getConfig()->pointScaleFactor, 0.0f, 0.0f);

#ifdef DEBUG
    if (node->getConfig()->printTree) {
      ABI49_0_0YGNodePrint(
          node,
          (ABI49_0_0YGPrintOptions) (ABI49_0_0YGPrintOptionsLayout | ABI49_0_0YGPrintOptionsChildren | ABI49_0_0YGPrintOptionsStyle));
    }
#endif
  }

  Event::publish<Event::LayoutPassEnd>(node, {layoutContext, &markerData});
}

YOGA_EXPORT void ABI49_0_0YGNodeCalculateLayout(
    const ABI49_0_0YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const ABI49_0_0YGDirection ownerDirection) {
  ABI49_0_0YGNodeCalculateLayoutWithContext(
      node, ownerWidth, ownerHeight, ownerDirection, nullptr);
}

YOGA_EXPORT void ABI49_0_0YGConfigSetLogger(const ABI49_0_0YGConfigRef config, ABI49_0_0YGLogger logger) {
  if (logger != nullptr) {
    config->setLogger(logger);
  } else {
#ifdef ANDROID
    config->setLogger(&ABI49_0_0YGAndroidLog);
#else
    config->setLogger(&ABI49_0_0YGDefaultLog);
#endif
  }
}

void ABI49_0_0YGAssert(const bool condition, const char* message) {
  if (!condition) {
    Log::log(ABI49_0_0YGNodeRef{nullptr}, ABI49_0_0YGLogLevelFatal, nullptr, "%s\n", message);
    throwLogicalErrorWithMessage(message);
  }
}

void ABI49_0_0YGAssertWithNode(
    const ABI49_0_0YGNodeRef node,
    const bool condition,
    const char* message) {
  if (!condition) {
    Log::log(node, ABI49_0_0YGLogLevelFatal, nullptr, "%s\n", message);
    throwLogicalErrorWithMessage(message);
  }
}

void ABI49_0_0YGAssertWithConfig(
    const ABI49_0_0YGConfigRef config,
    const bool condition,
    const char* message) {
  if (!condition) {
    Log::log(config, ABI49_0_0YGLogLevelFatal, nullptr, "%s\n", message);
    throwLogicalErrorWithMessage(message);
  }
}

YOGA_EXPORT void ABI49_0_0YGConfigSetExperimentalFeatureEnabled(
    const ABI49_0_0YGConfigRef config,
    const ABI49_0_0YGExperimentalFeature feature,
    const bool enabled) {
  config->experimentalFeatures[feature] = enabled;
}

YOGA_EXPORT bool ABI49_0_0YGConfigIsExperimentalFeatureEnabled(
    const ABI49_0_0YGConfigRef config,
    const ABI49_0_0YGExperimentalFeature feature) {
  return config->experimentalFeatures[feature];
}

YOGA_EXPORT void ABI49_0_0YGConfigSetUseWebDefaults(
    const ABI49_0_0YGConfigRef config,
    const bool enabled) {
  config->useWebDefaults = enabled;
}

YOGA_EXPORT bool ABI49_0_0YGConfigGetUseLegacyStretchBehaviour(
    const ABI49_0_0YGConfigRef config) {
  return config->useLegacyStretchBehaviour;
}

YOGA_EXPORT void ABI49_0_0YGConfigSetUseLegacyStretchBehaviour(
    const ABI49_0_0YGConfigRef config,
    const bool useLegacyStretchBehaviour) {
  config->useLegacyStretchBehaviour = useLegacyStretchBehaviour;
}

bool ABI49_0_0YGConfigGetUseWebDefaults(const ABI49_0_0YGConfigRef config) {
  return config->useWebDefaults;
}

YOGA_EXPORT void ABI49_0_0YGConfigSetContext(const ABI49_0_0YGConfigRef config, void* context) {
  config->context = context;
}

YOGA_EXPORT void* ABI49_0_0YGConfigGetContext(const ABI49_0_0YGConfigRef config) {
  return config->context;
}

YOGA_EXPORT void ABI49_0_0YGConfigSetCloneNodeFunc(
    const ABI49_0_0YGConfigRef config,
    const ABI49_0_0YGCloneNodeFunc callback) {
  config->setCloneNodeCallback(callback);
}

static void ABI49_0_0YGTraverseChildrenPreOrder(
    const ABI49_0_0YGVector& children,
    const std::function<void(ABI49_0_0YGNodeRef node)>& f) {
  for (ABI49_0_0YGNodeRef node : children) {
    f(node);
    ABI49_0_0YGTraverseChildrenPreOrder(node->getChildren(), f);
  }
}

void ABI49_0_0YGTraversePreOrder(
    ABI49_0_0YGNodeRef const node,
    std::function<void(ABI49_0_0YGNodeRef node)>&& f) {
  if (!node) {
    return;
  }
  f(node);
  ABI49_0_0YGTraverseChildrenPreOrder(node->getChildren(), f);
}
