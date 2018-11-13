/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#include "ABI31_0_0Yoga.h"
#include <float.h>
#include <string.h>
#include <algorithm>
#include "ABI31_0_0Utils.h"
#include "ABI31_0_0YGNode.h"
#include "ABI31_0_0YGNodePrint.h"
#include "ABI31_0_0Yoga-internal.h"
#ifdef _MSC_VER
#include <float.h>

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  if (!ABI31_0_0YGFloatIsUndefined(a) && !ABI31_0_0YGFloatIsUndefined(b)) {
    return (a > b) ? a : b;
  }
  return ABI31_0_0YGFloatIsUndefined(a) ? b : a;
}
#endif
#endif

#ifdef ANDROID
static int ABI31_0_0YGAndroidLog(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGLogLevel level,
    const char* format,
    va_list args);
#else
static int ABI31_0_0YGDefaultLog(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGLogLevel level,
    const char* format,
    va_list args);
#endif

const ABI31_0_0YGValue ABI31_0_0YGValueZero = {0, ABI31_0_0YGUnitPoint};
const ABI31_0_0YGValue ABI31_0_0YGValueUndefined = {ABI31_0_0YGUndefined, ABI31_0_0YGUnitUndefined};
const ABI31_0_0YGValue ABI31_0_0YGValueAuto = {ABI31_0_0YGUndefined, ABI31_0_0YGUnitAuto};

bool operator==(const ABI31_0_0YGValue& lhs, const ABI31_0_0YGValue& rhs) {
  if ((lhs.unit == ABI31_0_0YGUnitUndefined && rhs.unit == ABI31_0_0YGUnitUndefined) ||
      (lhs.unit == ABI31_0_0YGUnitAuto && rhs.unit == ABI31_0_0YGUnitAuto)) {
    return true;
  }

  return lhs.unit == rhs.unit && lhs.value == rhs.value;
}

bool operator!=(const ABI31_0_0YGValue& lhs, const ABI31_0_0YGValue& rhs) {
  return !(lhs == rhs);
}

#ifdef ANDROID
#include <android/log.h>
static int ABI31_0_0YGAndroidLog(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGLogLevel level,
    const char* format,
    va_list args) {
  int androidLevel = ABI31_0_0YGLogLevelDebug;
  switch (level) {
    case ABI31_0_0YGLogLevelFatal:
      androidLevel = ANDROID_LOG_FATAL;
      break;
    case ABI31_0_0YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case ABI31_0_0YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case ABI31_0_0YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case ABI31_0_0YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case ABI31_0_0YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
  }
  const int result = __android_log_vprint(androidLevel, "yoga", format, args);
  return result;
}
#else
#define ABI31_0_0YG_UNUSED(x) (void)(x);

static int ABI31_0_0YGDefaultLog(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGLogLevel level,
    const char* format,
    va_list args) {
  ABI31_0_0YG_UNUSED(config);
  ABI31_0_0YG_UNUSED(node);
  switch (level) {
    case ABI31_0_0YGLogLevelError:
    case ABI31_0_0YGLogLevelFatal:
      return vfprintf(stderr, format, args);
    case ABI31_0_0YGLogLevelWarn:
    case ABI31_0_0YGLogLevelInfo:
    case ABI31_0_0YGLogLevelDebug:
    case ABI31_0_0YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}

#undef ABI31_0_0YG_UNUSED
#endif

bool ABI31_0_0YGFloatIsUndefined(const float value) {
  return facebook::yoga::isUndefined(value);
}

const ABI31_0_0YGValue* ABI31_0_0YGComputedEdgeValue(
    const std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount>& edges,
    const ABI31_0_0YGEdge edge,
    const ABI31_0_0YGValue* const defaultValue) {
  if (edges[edge].unit != ABI31_0_0YGUnitUndefined) {
    return &edges[edge];
  }

  if ((edge == ABI31_0_0YGEdgeTop || edge == ABI31_0_0YGEdgeBottom) &&
      edges[ABI31_0_0YGEdgeVertical].unit != ABI31_0_0YGUnitUndefined) {
    return &edges[ABI31_0_0YGEdgeVertical];
  }

  if ((edge == ABI31_0_0YGEdgeLeft || edge == ABI31_0_0YGEdgeRight || edge == ABI31_0_0YGEdgeStart ||
       edge == ABI31_0_0YGEdgeEnd) &&
      edges[ABI31_0_0YGEdgeHorizontal].unit != ABI31_0_0YGUnitUndefined) {
    return &edges[ABI31_0_0YGEdgeHorizontal];
  }

  if (edges[ABI31_0_0YGEdgeAll].unit != ABI31_0_0YGUnitUndefined) {
    return &edges[ABI31_0_0YGEdgeAll];
  }

  if (edge == ABI31_0_0YGEdgeStart || edge == ABI31_0_0YGEdgeEnd) {
    return &ABI31_0_0YGValueUndefined;
  }

  return defaultValue;
}

void* ABI31_0_0YGNodeGetContext(ABI31_0_0YGNodeRef node) {
  return node->getContext();
}

void ABI31_0_0YGNodeSetContext(ABI31_0_0YGNodeRef node, void* context) {
  return node->setContext(context);
}

ABI31_0_0YGMeasureFunc ABI31_0_0YGNodeGetMeasureFunc(ABI31_0_0YGNodeRef node) {
  return node->getMeasure();
}

void ABI31_0_0YGNodeSetMeasureFunc(ABI31_0_0YGNodeRef node, ABI31_0_0YGMeasureFunc measureFunc) {
  node->setMeasureFunc(measureFunc);
}

ABI31_0_0YGBaselineFunc ABI31_0_0YGNodeGetBaselineFunc(ABI31_0_0YGNodeRef node) {
  return node->getBaseline();
}

void ABI31_0_0YGNodeSetBaselineFunc(ABI31_0_0YGNodeRef node, ABI31_0_0YGBaselineFunc baselineFunc) {
  node->setBaseLineFunc(baselineFunc);
}

ABI31_0_0YGDirtiedFunc ABI31_0_0YGNodeGetDirtiedFunc(ABI31_0_0YGNodeRef node) {
  return node->getDirtied();
}

void ABI31_0_0YGNodeSetDirtiedFunc(ABI31_0_0YGNodeRef node, ABI31_0_0YGDirtiedFunc dirtiedFunc) {
  node->setDirtiedFunc(dirtiedFunc);
}

ABI31_0_0YGPrintFunc ABI31_0_0YGNodeGetPrintFunc(ABI31_0_0YGNodeRef node) {
  return node->getPrintFunc();
}

void ABI31_0_0YGNodeSetPrintFunc(ABI31_0_0YGNodeRef node, ABI31_0_0YGPrintFunc printFunc) {
  node->setPrintFunc(printFunc);
}

bool ABI31_0_0YGNodeGetHasNewLayout(ABI31_0_0YGNodeRef node) {
  return node->getHasNewLayout();
}

void ABI31_0_0YGNodeSetHasNewLayout(ABI31_0_0YGNodeRef node, bool hasNewLayout) {
  node->setHasNewLayout(hasNewLayout);
}

ABI31_0_0YGNodeType ABI31_0_0YGNodeGetNodeType(ABI31_0_0YGNodeRef node) {
  return node->getNodeType();
}

void ABI31_0_0YGNodeSetNodeType(ABI31_0_0YGNodeRef node, ABI31_0_0YGNodeType nodeType) {
  return node->setNodeType(nodeType);
}

bool ABI31_0_0YGNodeIsDirty(ABI31_0_0YGNodeRef node) {
  return node->isDirty();
}

bool ABI31_0_0YGNodeLayoutGetDidUseLegacyFlag(const ABI31_0_0YGNodeRef node) {
  return node->didUseLegacyFlag();
}

void ABI31_0_0YGNodeMarkDirtyAndPropogateToDescendants(const ABI31_0_0YGNodeRef node) {
  return node->markDirtyAndPropogateDownwards();
}

int32_t gNodeInstanceCount = 0;
int32_t gConfigInstanceCount = 0;

WIN_EXPORT ABI31_0_0YGNodeRef ABI31_0_0YGNodeNewWithConfig(const ABI31_0_0YGConfigRef config) {
  const ABI31_0_0YGNodeRef node = new ABI31_0_0YGNode();
  ABI31_0_0YGAssertWithConfig(
      config, node != nullptr, "Could not allocate memory for node");
  gNodeInstanceCount++;

  if (config->useWebDefaults) {
    node->setStyleFlexDirection(ABI31_0_0YGFlexDirectionRow);
    node->setStyleAlignContent(ABI31_0_0YGAlignStretch);
  }
  node->setConfig(config);
  return node;
}

ABI31_0_0YGConfigRef ABI31_0_0YGConfigGetDefault() {
  static ABI31_0_0YGConfigRef defaultConfig = ABI31_0_0YGConfigNew();
  return defaultConfig;
}

ABI31_0_0YGNodeRef ABI31_0_0YGNodeNew(void) {
  return ABI31_0_0YGNodeNewWithConfig(ABI31_0_0YGConfigGetDefault());
}

ABI31_0_0YGNodeRef ABI31_0_0YGNodeClone(ABI31_0_0YGNodeRef oldNode) {
  ABI31_0_0YGNodeRef node = new ABI31_0_0YGNode(*oldNode);
  ABI31_0_0YGAssertWithConfig(
      oldNode->getConfig(),
      node != nullptr,
      "Could not allocate memory for node");
  gNodeInstanceCount++;
  node->setOwner(nullptr);
  return node;
}

static ABI31_0_0YGConfigRef ABI31_0_0YGConfigClone(const ABI31_0_0YGConfig& oldConfig) {
  const ABI31_0_0YGConfigRef config = new ABI31_0_0YGConfig(oldConfig);
  ABI31_0_0YGAssert(config != nullptr, "Could not allocate memory for config");
  if (config == nullptr) {
    abort();
  }
  gConfigInstanceCount++;
  return config;
}

static ABI31_0_0YGNodeRef ABI31_0_0YGNodeDeepClone(ABI31_0_0YGNodeRef oldNode) {
  ABI31_0_0YGNodeRef node = ABI31_0_0YGNodeClone(oldNode);
  ABI31_0_0YGVector vec = ABI31_0_0YGVector();
  vec.reserve(oldNode->getChildren().size());
  ABI31_0_0YGNodeRef childNode = nullptr;
  for (auto* item : oldNode->getChildren()) {
    childNode = ABI31_0_0YGNodeDeepClone(item);
    childNode->setOwner(node);
    vec.push_back(childNode);
  }
  node->setChildren(vec);

  if (oldNode->getConfig() != nullptr) {
    node->setConfig(ABI31_0_0YGConfigClone(*(oldNode->getConfig())));
  }

  return node;
}

void ABI31_0_0YGNodeFree(const ABI31_0_0YGNodeRef node) {
  if (ABI31_0_0YGNodeRef owner = node->getOwner()) {
    owner->removeChild(node);
    node->setOwner(nullptr);
  }

  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI31_0_0YGNodeRef child = ABI31_0_0YGNodeGetChild(node, i);
    child->setOwner(nullptr);
  }

  node->clearChildren();
  delete node;
  gNodeInstanceCount--;
}

static void ABI31_0_0YGConfigFreeRecursive(const ABI31_0_0YGNodeRef root) {
  if (root->getConfig() != nullptr) {
    gConfigInstanceCount--;
    delete root->getConfig();
  }
  // Delete configs recursively for childrens
  for (auto* child : root->getChildren()) {
    ABI31_0_0YGConfigFreeRecursive(child);
  }
}

void ABI31_0_0YGNodeFreeRecursive(const ABI31_0_0YGNodeRef root) {
  while (ABI31_0_0YGNodeGetChildCount(root) > 0) {
    const ABI31_0_0YGNodeRef child = ABI31_0_0YGNodeGetChild(root, 0);
    if (child->getOwner() != root) {
      // Don't free shared nodes that we don't own.
      break;
    }
    ABI31_0_0YGNodeRemoveChild(root, child);
    ABI31_0_0YGNodeFreeRecursive(child);
  }
  ABI31_0_0YGNodeFree(root);
}

void ABI31_0_0YGNodeReset(const ABI31_0_0YGNodeRef node) {
  ABI31_0_0YGAssertWithNode(
      node,
      ABI31_0_0YGNodeGetChildCount(node) == 0,
      "Cannot reset a node which still has children attached");
  ABI31_0_0YGAssertWithNode(
      node,
      node->getOwner() == nullptr,
      "Cannot reset a node still attached to a owner");

  node->clearChildren();

  const ABI31_0_0YGConfigRef config = node->getConfig();
  *node = ABI31_0_0YGNode();
  if (config->useWebDefaults) {
    node->setStyleFlexDirection(ABI31_0_0YGFlexDirectionRow);
    node->setStyleAlignContent(ABI31_0_0YGAlignStretch);
  }
  node->setConfig(config);
}

int32_t ABI31_0_0YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

int32_t ABI31_0_0YGConfigGetInstanceCount(void) {
  return gConfigInstanceCount;
}

ABI31_0_0YGConfigRef ABI31_0_0YGConfigNew(void) {
#ifdef ANDROID
  const ABI31_0_0YGConfigRef config = new ABI31_0_0YGConfig(ABI31_0_0YGAndroidLog);
#else
  const ABI31_0_0YGConfigRef config = new ABI31_0_0YGConfig(ABI31_0_0YGDefaultLog);
#endif
  gConfigInstanceCount++;
  return config;
}

void ABI31_0_0YGConfigFree(const ABI31_0_0YGConfigRef config) {
  delete config;
  gConfigInstanceCount--;
}

void ABI31_0_0YGConfigCopy(const ABI31_0_0YGConfigRef dest, const ABI31_0_0YGConfigRef src) {
  memcpy(dest, src, sizeof(ABI31_0_0YGConfig));
}

void ABI31_0_0YGNodeInsertChild(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGNodeRef child,
    const uint32_t index) {
  ABI31_0_0YGAssertWithNode(
      node,
      child->getOwner() == nullptr,
      "Child already has a owner, it must be removed first.");

  ABI31_0_0YGAssertWithNode(
      node,
      node->getMeasure() == nullptr,
      "Cannot add child: Nodes with measure functions cannot have children.");

  node->cloneChildrenIfNeeded();
  node->insertChild(child, index);
  ABI31_0_0YGNodeRef owner = child->getOwner() ? nullptr : node;
  child->setOwner(owner);
  node->markDirtyAndPropogate();
}

void ABI31_0_0YGNodeInsertSharedChild(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGNodeRef child,
    const uint32_t index) {
  ABI31_0_0YGAssertWithNode(
      node,
      node->getMeasure() == nullptr,
      "Cannot add child: Nodes with measure functions cannot have children.");

  node->insertChild(child, index);
  child->setOwner(nullptr);
  node->markDirtyAndPropogate();
}

void ABI31_0_0YGNodeRemoveChild(const ABI31_0_0YGNodeRef owner, const ABI31_0_0YGNodeRef excludedChild) {
  // This algorithm is a forked variant from cloneChildrenIfNeeded in ABI31_0_0YGNode
  // that excludes a child.
  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(owner);

  if (childCount == 0) {
    // This is an empty set. Nothing to remove.
    return;
  }
  const ABI31_0_0YGNodeRef firstChild = ABI31_0_0YGNodeGetChild(owner, 0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that it is
    // already unique. We can now try to delete a child in this list.
    if (owner->removeChild(excludedChild)) {
      excludedChild->setLayout(
          ABI31_0_0YGNode().getLayout()); // layout is no longer valid
      excludedChild->setOwner(nullptr);
      owner->markDirtyAndPropogate();
    }
    return;
  }
  // Otherwise we have to clone the node list except for the child we're trying
  // to delete. We don't want to simply clone all children, because then the
  // host will need to free the clone of the child that was just deleted.
  const ABI31_0_0YGCloneNodeFunc cloneNodeCallback =
      owner->getConfig()->cloneNodeCallback;
  uint32_t nextInsertIndex = 0;
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI31_0_0YGNodeRef oldChild = owner->getChild(i);
    if (excludedChild == oldChild) {
      // Ignore the deleted child. Don't reset its layout or owner since it is
      // still valid in the other owner. However, since this owner has now
      // changed, we need to mark it as dirty.
      owner->markDirtyAndPropogate();
      continue;
    }
    ABI31_0_0YGNodeRef newChild = nullptr;
    if (cloneNodeCallback) {
      newChild = cloneNodeCallback(oldChild, owner, nextInsertIndex);
    }
    if (newChild == nullptr) {
      newChild = ABI31_0_0YGNodeClone(oldChild);
    }
    owner->replaceChild(newChild, nextInsertIndex);
    newChild->setOwner(owner);

    nextInsertIndex++;
  }
  while (nextInsertIndex < childCount) {
    owner->removeChild(nextInsertIndex);
    nextInsertIndex++;
  }
}

void ABI31_0_0YGNodeRemoveAllChildren(const ABI31_0_0YGNodeRef owner) {
  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(owner);
  if (childCount == 0) {
    // This is an empty set already. Nothing to do.
    return;
  }
  const ABI31_0_0YGNodeRef firstChild = ABI31_0_0YGNodeGetChild(owner, 0);
  if (firstChild->getOwner() == owner) {
    // If the first child has this node as its owner, we assume that this child
    // set is unique.
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI31_0_0YGNodeRef oldChild = ABI31_0_0YGNodeGetChild(owner, i);
      oldChild->setLayout(ABI31_0_0YGNode().getLayout()); // layout is no longer valid
      oldChild->setOwner(nullptr);
    }
    owner->clearChildren();
    owner->markDirtyAndPropogate();
    return;
  }
  // Otherwise, we are not the owner of the child set. We don't have to do
  // anything to clear it.
  owner->setChildren(ABI31_0_0YGVector());
  owner->markDirtyAndPropogate();
}

static void ABI31_0_0YGNodeSetChildrenInternal(
    ABI31_0_0YGNodeRef const owner,
    const std::vector<ABI31_0_0YGNodeRef>& children) {
  if (!owner) {
    return;
  }
  if (children.size() == 0) {
    if (ABI31_0_0YGNodeGetChildCount(owner) > 0) {
      for (ABI31_0_0YGNodeRef const child : owner->getChildren()) {
        child->setLayout(ABI31_0_0YGLayout());
        child->setOwner(nullptr);
      }
      owner->setChildren(ABI31_0_0YGVector());
      owner->markDirtyAndPropogate();
    }
  } else {
    if (ABI31_0_0YGNodeGetChildCount(owner) > 0) {
      for (ABI31_0_0YGNodeRef const oldChild : owner->getChildren()) {
        // Our new children may have nodes in common with the old children. We
        // don't reset these common nodes.
        if (std::find(children.begin(), children.end(), oldChild) ==
            children.end()) {
          oldChild->setLayout(ABI31_0_0YGLayout());
          oldChild->setOwner(nullptr);
        }
      }
    }
    owner->setChildren(children);
    for (ABI31_0_0YGNodeRef child : children) {
      child->setOwner(owner);
    }
    owner->markDirtyAndPropogate();
  }
}

void ABI31_0_0YGNodeSetChildren(
    ABI31_0_0YGNodeRef const owner,
    const ABI31_0_0YGNodeRef c[],
    const uint32_t count) {
  const ABI31_0_0YGVector children = {c, c + count};
  ABI31_0_0YGNodeSetChildrenInternal(owner, children);
}

void ABI31_0_0YGNodeSetChildren(
    ABI31_0_0YGNodeRef const owner,
    const std::vector<ABI31_0_0YGNodeRef>& children) {
  ABI31_0_0YGNodeSetChildrenInternal(owner, children);
}

ABI31_0_0YGNodeRef ABI31_0_0YGNodeGetChild(const ABI31_0_0YGNodeRef node, const uint32_t index) {
  if (index < node->getChildren().size()) {
    return node->getChild(index);
  }
  return nullptr;
}

uint32_t ABI31_0_0YGNodeGetChildCount(const ABI31_0_0YGNodeRef node) {
  return static_cast<uint32_t>(node->getChildren().size());
}

ABI31_0_0YGNodeRef ABI31_0_0YGNodeGetOwner(const ABI31_0_0YGNodeRef node) {
  return node->getOwner();
}

ABI31_0_0YGNodeRef ABI31_0_0YGNodeGetParent(const ABI31_0_0YGNodeRef node) {
  return node->getOwner();
}

void ABI31_0_0YGNodeMarkDirty(const ABI31_0_0YGNodeRef node) {
  ABI31_0_0YGAssertWithNode(
      node,
      node->getMeasure() != nullptr,
      "Only leaf nodes with custom measure functions"
      "should manually mark themselves as dirty");

  node->markDirtyAndPropogate();
}

void ABI31_0_0YGNodeCopyStyle(const ABI31_0_0YGNodeRef dstNode, const ABI31_0_0YGNodeRef srcNode) {
  if (!(dstNode->getStyle() == srcNode->getStyle())) {
    dstNode->setStyle(srcNode->getStyle());
    dstNode->markDirtyAndPropogate();
  }
}

float ABI31_0_0YGNodeStyleGetFlexGrow(const ABI31_0_0YGNodeRef node) {
  return node->getStyle().flexGrow.isUndefined()
      ? kDefaultFlexGrow
      : node->getStyle().flexGrow.getValue();
}

float ABI31_0_0YGNodeStyleGetFlexShrink(const ABI31_0_0YGNodeRef node) {
  return node->getStyle().flexShrink.isUndefined()
      ? (node->getConfig()->useWebDefaults ? kWebDefaultFlexShrink
                                           : kDefaultFlexShrink)
      : node->getStyle().flexShrink.getValue();
}

namespace {

template <typename T, T ABI31_0_0YGStyle::*P>
struct StyleProp {
  static T get(ABI31_0_0YGNodeRef node) {
    return node->getStyle().*P;
  }
  static void set(ABI31_0_0YGNodeRef node, T newValue) {
    if (node->getStyle().*P != newValue) {
      ABI31_0_0YGStyle style = node->getStyle();
      style.*P = newValue;
      node->setStyle(style);
      node->markDirtyAndPropogate();
    }
  }
};

} // namespace

#define ABI31_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(                          \
    type, name, paramName, instanceName)                                  \
  void ABI31_0_0YGNodeStyleSet##name(const ABI31_0_0YGNodeRef node, const type paramName) { \
    ABI31_0_0YGValue value = {                                                     \
        ABI31_0_0YGFloatSanitize(paramName),                                       \
        ABI31_0_0YGFloatIsUndefined(paramName) ? ABI31_0_0YGUnitUndefined : ABI31_0_0YGUnitPoint,    \
    };                                                                    \
    if ((node->getStyle().instanceName.value != value.value &&            \
         value.unit != ABI31_0_0YGUnitUndefined) ||                                \
        node->getStyle().instanceName.unit != value.unit) {               \
      ABI31_0_0YGStyle style = node->getStyle();                                   \
      style.instanceName = value;                                         \
      node->setStyle(style);                                              \
      node->markDirtyAndPropogate();                                      \
    }                                                                     \
  }                                                                       \
                                                                          \
  void ABI31_0_0YGNodeStyleSet##name##Percent(                                     \
      const ABI31_0_0YGNodeRef node, const type paramName) {                       \
    ABI31_0_0YGValue value = {                                                     \
        ABI31_0_0YGFloatSanitize(paramName),                                       \
        ABI31_0_0YGFloatIsUndefined(paramName) ? ABI31_0_0YGUnitUndefined : ABI31_0_0YGUnitPercent,  \
    };                                                                    \
    if ((node->getStyle().instanceName.value != value.value &&            \
         value.unit != ABI31_0_0YGUnitUndefined) ||                                \
        node->getStyle().instanceName.unit != value.unit) {               \
      ABI31_0_0YGStyle style = node->getStyle();                                   \
                                                                          \
      style.instanceName = value;                                         \
      node->setStyle(style);                                              \
      node->markDirtyAndPropogate();                                      \
    }                                                                     \
  }

#define ABI31_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(                        \
    type, name, paramName, instanceName)                                     \
  void ABI31_0_0YGNodeStyleSet##name(const ABI31_0_0YGNodeRef node, const type paramName) {    \
    ABI31_0_0YGValue value = {                                                        \
        ABI31_0_0YGFloatSanitize(paramName),                                          \
        ABI31_0_0YGFloatIsUndefined(paramName) ? ABI31_0_0YGUnitUndefined : ABI31_0_0YGUnitPoint,       \
    };                                                                       \
    if ((node->getStyle().instanceName.value != value.value &&               \
         value.unit != ABI31_0_0YGUnitUndefined) ||                                   \
        node->getStyle().instanceName.unit != value.unit) {                  \
      ABI31_0_0YGStyle style = node->getStyle();                                      \
      style.instanceName = value;                                            \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }                                                                          \
                                                                             \
  void ABI31_0_0YGNodeStyleSet##name##Percent(                                        \
      const ABI31_0_0YGNodeRef node, const type paramName) {                          \
    if (node->getStyle().instanceName.value != ABI31_0_0YGFloatSanitize(paramName) || \
        node->getStyle().instanceName.unit != ABI31_0_0YGUnitPercent) {               \
      ABI31_0_0YGStyle style = node->getStyle();                                      \
      style.instanceName.value = ABI31_0_0YGFloatSanitize(paramName);                 \
      style.instanceName.unit =                                              \
          ABI31_0_0YGFloatIsUndefined(paramName) ? ABI31_0_0YGUnitAuto : ABI31_0_0YGUnitPercent;        \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }                                                                          \
                                                                             \
  void ABI31_0_0YGNodeStyleSet##name##Auto(const ABI31_0_0YGNodeRef node) {                    \
    if (node->getStyle().instanceName.unit != ABI31_0_0YGUnitAuto) {                  \
      ABI31_0_0YGStyle style = node->getStyle();                                      \
      style.instanceName.value = 0;                                          \
      style.instanceName.unit = ABI31_0_0YGUnitAuto;                                  \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }

#define ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName) \
  ABI31_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(                                    \
      float, name, paramName, instanceName)                                   \
                                                                              \
  type ABI31_0_0YGNodeStyleGet##name(const ABI31_0_0YGNodeRef node) {                           \
    ABI31_0_0YGValue value = node->getStyle().instanceName;                            \
    if (value.unit == ABI31_0_0YGUnitUndefined || value.unit == ABI31_0_0YGUnitAuto) {          \
      value.value = ABI31_0_0YGUndefined;                                              \
    }                                                                         \
    return value;                                                             \
  }

#define ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(                       \
    type, name, paramName, instanceName)                             \
  ABI31_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(                      \
      float, name, paramName, instanceName)                          \
                                                                     \
  type ABI31_0_0YGNodeStyleGet##name(const ABI31_0_0YGNodeRef node) {                  \
    ABI31_0_0YGValue value = node->getStyle().instanceName;                   \
    if (value.unit == ABI31_0_0YGUnitUndefined || value.unit == ABI31_0_0YGUnitAuto) { \
      value.value = ABI31_0_0YGUndefined;                                     \
    }                                                                \
    return value;                                                    \
  }

#define ABI31_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(type, name, instanceName) \
  void ABI31_0_0YGNodeStyleSet##name##Auto(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGEdge edge) { \
    if (node->getStyle().instanceName[edge].unit != ABI31_0_0YGUnitAuto) {            \
      ABI31_0_0YGStyle style = node->getStyle();                                      \
      style.instanceName[edge].value = 0;                                    \
      style.instanceName[edge].unit = ABI31_0_0YGUnitAuto;                            \
      node->setStyle(style);                                                 \
      node->markDirtyAndPropogate();                                         \
    }                                                                        \
  }

#define ABI31_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(                           \
    type, name, paramName, instanceName)                                 \
  void ABI31_0_0YGNodeStyleSet##name(                                             \
      const ABI31_0_0YGNodeRef node, const ABI31_0_0YGEdge edge, const float paramName) {  \
    ABI31_0_0YGValue value = {                                                    \
        ABI31_0_0YGFloatSanitize(paramName),                                      \
        ABI31_0_0YGFloatIsUndefined(paramName) ? ABI31_0_0YGUnitUndefined : ABI31_0_0YGUnitPoint,   \
    };                                                                   \
    if ((node->getStyle().instanceName[edge].value != value.value &&     \
         value.unit != ABI31_0_0YGUnitUndefined) ||                               \
        node->getStyle().instanceName[edge].unit != value.unit) {        \
      ABI31_0_0YGStyle style = node->getStyle();                                  \
      style.instanceName[edge] = value;                                  \
      node->setStyle(style);                                             \
      node->markDirtyAndPropogate();                                     \
    }                                                                    \
  }                                                                      \
                                                                         \
  void ABI31_0_0YGNodeStyleSet##name##Percent(                                    \
      const ABI31_0_0YGNodeRef node, const ABI31_0_0YGEdge edge, const float paramName) {  \
    ABI31_0_0YGValue value = {                                                    \
        ABI31_0_0YGFloatSanitize(paramName),                                      \
        ABI31_0_0YGFloatIsUndefined(paramName) ? ABI31_0_0YGUnitUndefined : ABI31_0_0YGUnitPercent, \
    };                                                                   \
    if ((node->getStyle().instanceName[edge].value != value.value &&     \
         value.unit != ABI31_0_0YGUnitUndefined) ||                               \
        node->getStyle().instanceName[edge].unit != value.unit) {        \
      ABI31_0_0YGStyle style = node->getStyle();                                  \
      style.instanceName[edge] = value;                                  \
      node->setStyle(style);                                             \
      node->markDirtyAndPropogate();                                     \
    }                                                                    \
  }                                                                      \
                                                                         \
  WIN_STRUCT(type)                                                       \
  ABI31_0_0YGNodeStyleGet##name(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGEdge edge) {        \
    ABI31_0_0YGValue value = node->getStyle().instanceName[edge];                 \
    if (value.unit == ABI31_0_0YGUnitUndefined || value.unit == ABI31_0_0YGUnitAuto) {     \
      value.value = ABI31_0_0YGUndefined;                                         \
    }                                                                    \
    return WIN_STRUCT_REF(value);                                        \
  }

#define ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type ABI31_0_0YGNodeLayoutGet##name(const ABI31_0_0YGNodeRef node) {           \
    return node->getLayout().instanceName;                     \
  }

#define ABI31_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName) \
  type ABI31_0_0YGNodeLayoutGet##name(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGEdge edge) { \
    ABI31_0_0YGAssertWithNode(                                                   \
        node,                                                           \
        edge <= ABI31_0_0YGEdgeEnd,                                              \
        "Cannot get layout properties of multi-edge shorthands");       \
                                                                        \
    if (edge == ABI31_0_0YGEdgeLeft) {                                           \
      if (node->getLayout().direction == ABI31_0_0YGDirectionRTL) {              \
        return node->getLayout().instanceName[ABI31_0_0YGEdgeEnd];               \
      } else {                                                          \
        return node->getLayout().instanceName[ABI31_0_0YGEdgeStart];             \
      }                                                                 \
    }                                                                   \
                                                                        \
    if (edge == ABI31_0_0YGEdgeRight) {                                          \
      if (node->getLayout().direction == ABI31_0_0YGDirectionRTL) {              \
        return node->getLayout().instanceName[ABI31_0_0YGEdgeStart];             \
      } else {                                                          \
        return node->getLayout().instanceName[ABI31_0_0YGEdgeEnd];               \
      }                                                                 \
    }                                                                   \
                                                                        \
    return node->getLayout().instanceName[edge];                        \
  }

void ABI31_0_0YGNodeStyleSetDirection(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGDirection direction) {
  StyleProp<ABI31_0_0YGDirection, &ABI31_0_0YGStyle::direction>::set(node, direction);
}
ABI31_0_0YGDirection ABI31_0_0YGNodeStyleGetDirection(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGDirection, &ABI31_0_0YGStyle::direction>::get(node);
}

void ABI31_0_0YGNodeStyleSetFlexDirection(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection flexDirection) {
  StyleProp<ABI31_0_0YGFlexDirection, &ABI31_0_0YGStyle::flexDirection>::set(node, flexDirection);
}
ABI31_0_0YGFlexDirection ABI31_0_0YGNodeStyleGetFlexDirection(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGFlexDirection, &ABI31_0_0YGStyle::flexDirection>::get(node);
}

void ABI31_0_0YGNodeStyleSetJustifyContent(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGJustify justifyContent) {
  StyleProp<ABI31_0_0YGJustify, &ABI31_0_0YGStyle::justifyContent>::set(node, justifyContent);
}
ABI31_0_0YGJustify ABI31_0_0YGNodeStyleGetJustifyContent(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGJustify, &ABI31_0_0YGStyle::justifyContent>::get(node);
}

void ABI31_0_0YGNodeStyleSetAlignContent(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGAlign alignContent) {
  StyleProp<ABI31_0_0YGAlign, &ABI31_0_0YGStyle::alignContent>::set(node, alignContent);
}
ABI31_0_0YGAlign ABI31_0_0YGNodeStyleGetAlignContent(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGAlign, &ABI31_0_0YGStyle::alignContent>::get(node);
}

void ABI31_0_0YGNodeStyleSetAlignItems(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGAlign alignItems) {
  StyleProp<ABI31_0_0YGAlign, &ABI31_0_0YGStyle::alignItems>::set(node, alignItems);
}
ABI31_0_0YGAlign ABI31_0_0YGNodeStyleGetAlignItems(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGAlign, &ABI31_0_0YGStyle::alignItems>::get(node);
}

void ABI31_0_0YGNodeStyleSetAlignSelf(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGAlign alignSelf) {
  StyleProp<ABI31_0_0YGAlign, &ABI31_0_0YGStyle::alignSelf>::set(node, alignSelf);
}
ABI31_0_0YGAlign ABI31_0_0YGNodeStyleGetAlignSelf(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGAlign, &ABI31_0_0YGStyle::alignSelf>::get(node);
}

void ABI31_0_0YGNodeStyleSetPositionType(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGPositionType positionType) {
  StyleProp<ABI31_0_0YGPositionType, &ABI31_0_0YGStyle::positionType>::set(node, positionType);
}
ABI31_0_0YGPositionType ABI31_0_0YGNodeStyleGetPositionType(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGPositionType, &ABI31_0_0YGStyle::positionType>::get(node);
}

void ABI31_0_0YGNodeStyleSetFlexWrap(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGWrap flexWrap) {
  StyleProp<ABI31_0_0YGWrap, &ABI31_0_0YGStyle::flexWrap>::set(node, flexWrap);
}
ABI31_0_0YGWrap ABI31_0_0YGNodeStyleGetFlexWrap(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGWrap, &ABI31_0_0YGStyle::flexWrap>::get(node);
}

void ABI31_0_0YGNodeStyleSetOverflow(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGOverflow overflow) {
  StyleProp<ABI31_0_0YGOverflow, &ABI31_0_0YGStyle::overflow>::set(node, overflow);
}
ABI31_0_0YGOverflow ABI31_0_0YGNodeStyleGetOverflow(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGOverflow, &ABI31_0_0YGStyle::overflow>::get(node);
}

void ABI31_0_0YGNodeStyleSetDisplay(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGDisplay display) {
  StyleProp<ABI31_0_0YGDisplay, &ABI31_0_0YGStyle::display>::set(node, display);
}
ABI31_0_0YGDisplay ABI31_0_0YGNodeStyleGetDisplay(const ABI31_0_0YGNodeRef node) {
  return StyleProp<ABI31_0_0YGDisplay, &ABI31_0_0YGStyle::display>::get(node);
}

// TODO(T26792433): Change the API to accept ABI31_0_0YGFloatOptional.
void ABI31_0_0YGNodeStyleSetFlex(const ABI31_0_0YGNodeRef node, const float flex) {
  if (node->getStyle().flex != flex) {
    ABI31_0_0YGStyle style = node->getStyle();
    if (ABI31_0_0YGFloatIsUndefined(flex)) {
      style.flex = ABI31_0_0YGFloatOptional();
    } else {
      style.flex = ABI31_0_0YGFloatOptional(flex);
    }
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

// TODO(T26792433): Change the API to accept ABI31_0_0YGFloatOptional.
float ABI31_0_0YGNodeStyleGetFlex(const ABI31_0_0YGNodeRef node) {
  return node->getStyle().flex.isUndefined() ? ABI31_0_0YGUndefined
                                             : node->getStyle().flex.getValue();
}

// TODO(T26792433): Change the API to accept ABI31_0_0YGFloatOptional.
void ABI31_0_0YGNodeStyleSetFlexGrow(const ABI31_0_0YGNodeRef node, const float flexGrow) {
  if (node->getStyle().flexGrow != flexGrow) {
    ABI31_0_0YGStyle style = node->getStyle();
    if (ABI31_0_0YGFloatIsUndefined(flexGrow)) {
      style.flexGrow = ABI31_0_0YGFloatOptional();
    } else {
      style.flexGrow = ABI31_0_0YGFloatOptional(flexGrow);
    }
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

// TODO(T26792433): Change the API to accept ABI31_0_0YGFloatOptional.
void ABI31_0_0YGNodeStyleSetFlexShrink(const ABI31_0_0YGNodeRef node, const float flexShrink) {
  if (node->getStyle().flexShrink != flexShrink) {
    ABI31_0_0YGStyle style = node->getStyle();
    if (ABI31_0_0YGFloatIsUndefined(flexShrink)) {
      style.flexShrink = ABI31_0_0YGFloatOptional();
    } else {
      style.flexShrink = ABI31_0_0YGFloatOptional(flexShrink);
    }
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

ABI31_0_0YGValue ABI31_0_0YGNodeStyleGetFlexBasis(const ABI31_0_0YGNodeRef node) {
  ABI31_0_0YGValue flexBasis = node->getStyle().flexBasis;
  if (flexBasis.unit == ABI31_0_0YGUnitUndefined || flexBasis.unit == ABI31_0_0YGUnitAuto) {
    // TODO(T26792433): Get rid off the use of ABI31_0_0YGUndefined at client side
    flexBasis.value = ABI31_0_0YGUndefined;
  }
  return flexBasis;
}

void ABI31_0_0YGNodeStyleSetFlexBasis(const ABI31_0_0YGNodeRef node, const float flexBasis) {
  ABI31_0_0YGValue value = {
      ABI31_0_0YGFloatSanitize(flexBasis),
      ABI31_0_0YGFloatIsUndefined(flexBasis) ? ABI31_0_0YGUnitUndefined : ABI31_0_0YGUnitPoint,
  };
  if ((node->getStyle().flexBasis.value != value.value &&
       value.unit != ABI31_0_0YGUnitUndefined) ||
      node->getStyle().flexBasis.unit != value.unit) {
    ABI31_0_0YGStyle style = node->getStyle();
    style.flexBasis = value;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

void ABI31_0_0YGNodeStyleSetFlexBasisPercent(
    const ABI31_0_0YGNodeRef node,
    const float flexBasisPercent) {
  if (node->getStyle().flexBasis.value != flexBasisPercent ||
      node->getStyle().flexBasis.unit != ABI31_0_0YGUnitPercent) {
    ABI31_0_0YGStyle style = node->getStyle();
    style.flexBasis.value = ABI31_0_0YGFloatSanitize(flexBasisPercent);
    style.flexBasis.unit =
        ABI31_0_0YGFloatIsUndefined(flexBasisPercent) ? ABI31_0_0YGUnitAuto : ABI31_0_0YGUnitPercent;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

void ABI31_0_0YGNodeStyleSetFlexBasisAuto(const ABI31_0_0YGNodeRef node) {
  if (node->getStyle().flexBasis.unit != ABI31_0_0YGUnitAuto) {
    ABI31_0_0YGStyle style = node->getStyle();
    style.flexBasis.value = 0;
    style.flexBasis.unit = ABI31_0_0YGUnitAuto;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

ABI31_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI31_0_0YGValue, Position, position, position);
ABI31_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI31_0_0YGValue, Margin, margin, margin);
ABI31_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(ABI31_0_0YGValue, Margin, margin);
ABI31_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI31_0_0YGValue, Padding, padding, padding);

// TODO(T26792433): Change the API to accept ABI31_0_0YGFloatOptional.
void ABI31_0_0YGNodeStyleSetBorder(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGEdge edge,
    const float border) {
  ABI31_0_0YGValue value = {
      ABI31_0_0YGFloatSanitize(border),
      ABI31_0_0YGFloatIsUndefined(border) ? ABI31_0_0YGUnitUndefined : ABI31_0_0YGUnitPoint,
  };
  if ((node->getStyle().border[edge].value != value.value &&
       value.unit != ABI31_0_0YGUnitUndefined) ||
      node->getStyle().border[edge].unit != value.unit) {
    ABI31_0_0YGStyle style = node->getStyle();
    style.border[edge] = value;
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

float ABI31_0_0YGNodeStyleGetBorder(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGEdge edge) {
  if (node->getStyle().border[edge].unit == ABI31_0_0YGUnitUndefined ||
      node->getStyle().border[edge].unit == ABI31_0_0YGUnitAuto) {
    // TODO(T26792433): Rather than returning ABI31_0_0YGUndefined, change the api to
    // return ABI31_0_0YGFloatOptional.
    return ABI31_0_0YGUndefined;
  }

  return node->getStyle().border[edge].value;
}

// Yoga specific properties, not compatible with flexbox specification

// TODO(T26792433): Change the API to accept ABI31_0_0YGFloatOptional.
float ABI31_0_0YGNodeStyleGetAspectRatio(const ABI31_0_0YGNodeRef node) {
  const ABI31_0_0YGFloatOptional op = node->getStyle().aspectRatio;
  return op.isUndefined() ? ABI31_0_0YGUndefined : op.getValue();
}

// TODO(T26792433): Change the API to accept ABI31_0_0YGFloatOptional.
void ABI31_0_0YGNodeStyleSetAspectRatio(const ABI31_0_0YGNodeRef node, const float aspectRatio) {
  if (node->getStyle().aspectRatio != aspectRatio) {
    ABI31_0_0YGStyle style = node->getStyle();
    style.aspectRatio = ABI31_0_0YGFloatOptional(aspectRatio);
    node->setStyle(style);
    node->markDirtyAndPropogate();
  }
}

ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(
    ABI31_0_0YGValue,
    Width,
    width,
    dimensions[ABI31_0_0YGDimensionWidth]);
ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(
    ABI31_0_0YGValue,
    Height,
    height,
    dimensions[ABI31_0_0YGDimensionHeight]);
ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(
    ABI31_0_0YGValue,
    MinWidth,
    minWidth,
    minDimensions[ABI31_0_0YGDimensionWidth]);
ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(
    ABI31_0_0YGValue,
    MinHeight,
    minHeight,
    minDimensions[ABI31_0_0YGDimensionHeight]);
ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(
    ABI31_0_0YGValue,
    MaxWidth,
    maxWidth,
    maxDimensions[ABI31_0_0YGDimensionWidth]);
ABI31_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(
    ABI31_0_0YGValue,
    MaxHeight,
    maxHeight,
    maxDimensions[ABI31_0_0YGDimensionHeight]);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI31_0_0YGEdgeLeft]);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI31_0_0YGEdgeTop]);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI31_0_0YGEdgeRight]);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI31_0_0YGEdgeBottom]);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI31_0_0YGDimensionWidth]);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI31_0_0YGDimensionHeight]);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(ABI31_0_0YGDirection, Direction, direction);
ABI31_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(bool, HadOverflow, hadOverflow);

ABI31_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
ABI31_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
ABI31_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

bool ABI31_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(const ABI31_0_0YGNodeRef node) {
  return node->getLayout().doesLegacyStretchFlagAffectsLayout;
}

uint32_t gCurrentGenerationCount = 0;

bool ABI31_0_0YGLayoutNodeInternal(
    const ABI31_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI31_0_0YGDirection ownerDirection,
    const ABI31_0_0YGMeasureMode widthMeasureMode,
    const ABI31_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const char* reason,
    const ABI31_0_0YGConfigRef config);

static void ABI31_0_0YGNodePrintInternal(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGPrintOptions options) {
  std::string str;
  facebook::yoga::ABI31_0_0YGNodeToString(&str, node, options, 0);
  ABI31_0_0YGLog(node, ABI31_0_0YGLogLevelDebug, str.c_str());
}

void ABI31_0_0YGNodePrint(const ABI31_0_0YGNodeRef node, const ABI31_0_0YGPrintOptions options) {
  ABI31_0_0YGNodePrintInternal(node, options);
}

const std::array<ABI31_0_0YGEdge, 4> leading = {
    {ABI31_0_0YGEdgeTop, ABI31_0_0YGEdgeBottom, ABI31_0_0YGEdgeLeft, ABI31_0_0YGEdgeRight}};

const std::array<ABI31_0_0YGEdge, 4> trailing = {
    {ABI31_0_0YGEdgeBottom, ABI31_0_0YGEdgeTop, ABI31_0_0YGEdgeRight, ABI31_0_0YGEdgeLeft}};
static const std::array<ABI31_0_0YGEdge, 4> pos = {{
    ABI31_0_0YGEdgeTop,
    ABI31_0_0YGEdgeBottom,
    ABI31_0_0YGEdgeLeft,
    ABI31_0_0YGEdgeRight,
}};

static const std::array<ABI31_0_0YGDimension, 4> dim = {
    {ABI31_0_0YGDimensionHeight, ABI31_0_0YGDimensionHeight, ABI31_0_0YGDimensionWidth, ABI31_0_0YGDimensionWidth}};

static inline float ABI31_0_0YGNodePaddingAndBorderForAxis(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection axis,
    const float widthSize) {
  return ABI31_0_0YGUnwrapFloatOptional(
      node->getLeadingPaddingAndBorder(axis, widthSize) +
      node->getTrailingPaddingAndBorder(axis, widthSize));
}

static inline ABI31_0_0YGAlign ABI31_0_0YGNodeAlignItem(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGNodeRef child) {
  const ABI31_0_0YGAlign align = child->getStyle().alignSelf == ABI31_0_0YGAlignAuto
      ? node->getStyle().alignItems
      : child->getStyle().alignSelf;
  if (align == ABI31_0_0YGAlignBaseline &&
      ABI31_0_0YGFlexDirectionIsColumn(node->getStyle().flexDirection)) {
    return ABI31_0_0YGAlignFlexStart;
  }
  return align;
}

static float ABI31_0_0YGBaseline(const ABI31_0_0YGNodeRef node) {
  if (node->getBaseline() != nullptr) {
    const float baseline = node->getBaseline()(
        node,
        node->getLayout().measuredDimensions[ABI31_0_0YGDimensionWidth],
        node->getLayout().measuredDimensions[ABI31_0_0YGDimensionHeight]);
    ABI31_0_0YGAssertWithNode(
        node,
        !ABI31_0_0YGFloatIsUndefined(baseline),
        "Expect custom baseline function to not return NaN");
    return baseline;
  }

  ABI31_0_0YGNodeRef baselineChild = nullptr;
  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI31_0_0YGNodeRef child = ABI31_0_0YGNodeGetChild(node, i);
    if (child->getLineIndex() > 0) {
      break;
    }
    if (child->getStyle().positionType == ABI31_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (ABI31_0_0YGNodeAlignItem(node, child) == ABI31_0_0YGAlignBaseline) {
      baselineChild = child;
      break;
    }

    if (baselineChild == nullptr) {
      baselineChild = child;
    }
  }

  if (baselineChild == nullptr) {
    return node->getLayout().measuredDimensions[ABI31_0_0YGDimensionHeight];
  }

  const float baseline = ABI31_0_0YGBaseline(baselineChild);
  return baseline + baselineChild->getLayout().position[ABI31_0_0YGEdgeTop];
}

static bool ABI31_0_0YGIsBaselineLayout(const ABI31_0_0YGNodeRef node) {
  if (ABI31_0_0YGFlexDirectionIsColumn(node->getStyle().flexDirection)) {
    return false;
  }
  if (node->getStyle().alignItems == ABI31_0_0YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI31_0_0YGNodeRef child = ABI31_0_0YGNodeGetChild(node, i);
    if (child->getStyle().positionType == ABI31_0_0YGPositionTypeRelative &&
        child->getStyle().alignSelf == ABI31_0_0YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float ABI31_0_0YGNodeDimWithMargin(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection axis,
    const float widthSize) {
  return node->getLayout().measuredDimensions[dim[axis]] +
      ABI31_0_0YGUnwrapFloatOptional(
             node->getLeadingMargin(axis, widthSize) +
             node->getTrailingMargin(axis, widthSize));
}

static inline bool ABI31_0_0YGNodeIsStyleDimDefined(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection axis,
    const float ownerSize) {
  bool isUndefined =
      ABI31_0_0YGFloatIsUndefined(node->getResolvedDimension(dim[axis]).value);
  return !(
      node->getResolvedDimension(dim[axis]).unit == ABI31_0_0YGUnitAuto ||
      node->getResolvedDimension(dim[axis]).unit == ABI31_0_0YGUnitUndefined ||
      (node->getResolvedDimension(dim[axis]).unit == ABI31_0_0YGUnitPoint &&
       !isUndefined && node->getResolvedDimension(dim[axis]).value < 0.0f) ||
      (node->getResolvedDimension(dim[axis]).unit == ABI31_0_0YGUnitPercent &&
       !isUndefined &&
       (node->getResolvedDimension(dim[axis]).value < 0.0f ||
        ABI31_0_0YGFloatIsUndefined(ownerSize))));
}

static inline bool ABI31_0_0YGNodeIsLayoutDimDefined(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection axis) {
  const float value = node->getLayout().measuredDimensions[dim[axis]];
  return !ABI31_0_0YGFloatIsUndefined(value) && value >= 0.0f;
}

static ABI31_0_0YGFloatOptional ABI31_0_0YGNodeBoundAxisWithinMinAndMax(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection& axis,
    const float& value,
    const float& axisSize) {
  ABI31_0_0YGFloatOptional min;
  ABI31_0_0YGFloatOptional max;

  if (ABI31_0_0YGFlexDirectionIsColumn(axis)) {
    min = ABI31_0_0YGResolveValue(
        node->getStyle().minDimensions[ABI31_0_0YGDimensionHeight], axisSize);
    max = ABI31_0_0YGResolveValue(
        node->getStyle().maxDimensions[ABI31_0_0YGDimensionHeight], axisSize);
  } else if (ABI31_0_0YGFlexDirectionIsRow(axis)) {
    min = ABI31_0_0YGResolveValue(
        node->getStyle().minDimensions[ABI31_0_0YGDimensionWidth], axisSize);
    max = ABI31_0_0YGResolveValue(
        node->getStyle().maxDimensions[ABI31_0_0YGDimensionWidth], axisSize);
  }

  if (!max.isUndefined() && max.getValue() >= 0 && value > max.getValue()) {
    return max;
  }

  if (!min.isUndefined() && min.getValue() >= 0 && value < min.getValue()) {
    return min;
  }

  return ABI31_0_0YGFloatOptional(value);
}

// Like ABI31_0_0YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't
// go below the padding and border amount.
static inline float ABI31_0_0YGNodeBoundAxis(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection axis,
    const float value,
    const float axisSize,
    const float widthSize) {
  return ABI31_0_0YGFloatMax(
      ABI31_0_0YGUnwrapFloatOptional(
          ABI31_0_0YGNodeBoundAxisWithinMinAndMax(node, axis, value, axisSize)),
      ABI31_0_0YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void ABI31_0_0YGNodeSetChildTrailingPosition(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGNodeRef child,
    const ABI31_0_0YGFlexDirection axis) {
  const float size = child->getLayout().measuredDimensions[dim[axis]];
  child->setLayoutPosition(
      node->getLayout().measuredDimensions[dim[axis]] - size -
          child->getLayout().position[pos[axis]],
      trailing[axis]);
}

static void ABI31_0_0YGConstrainMaxSizeForMode(
    const ABI31_0_0YGNodeRef node,
    const enum ABI31_0_0YGFlexDirection axis,
    const float ownerAxisSize,
    const float ownerWidth,
    ABI31_0_0YGMeasureMode* mode,
    float* size) {
  const ABI31_0_0YGFloatOptional maxSize =
      ABI31_0_0YGResolveValue(node->getStyle().maxDimensions[dim[axis]], ownerAxisSize) +
      ABI31_0_0YGFloatOptional(node->getMarginForAxis(axis, ownerWidth));
  switch (*mode) {
    case ABI31_0_0YGMeasureModeExactly:
    case ABI31_0_0YGMeasureModeAtMost:
      *size = (maxSize.isUndefined() || *size < maxSize.getValue())
          ? *size
          : maxSize.getValue();
      break;
    case ABI31_0_0YGMeasureModeUndefined:
      if (!maxSize.isUndefined()) {
        *mode = ABI31_0_0YGMeasureModeAtMost;
        *size = maxSize.getValue();
      }
      break;
  }
}

static void ABI31_0_0YGNodeComputeFlexBasisForChild(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGNodeRef child,
    const float width,
    const ABI31_0_0YGMeasureMode widthMode,
    const float height,
    const float ownerWidth,
    const float ownerHeight,
    const ABI31_0_0YGMeasureMode heightMode,
    const ABI31_0_0YGDirection direction,
    const ABI31_0_0YGConfigRef config) {
  const ABI31_0_0YGFlexDirection mainAxis =
      ABI31_0_0YGResolveFlexDirection(node->getStyle().flexDirection, direction);
  const bool isMainAxisRow = ABI31_0_0YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;

  float childWidth;
  float childHeight;
  ABI31_0_0YGMeasureMode childWidthMeasureMode;
  ABI31_0_0YGMeasureMode childHeightMeasureMode;

  const ABI31_0_0YGFloatOptional resolvedFlexBasis =
      ABI31_0_0YGResolveValue(child->resolveFlexBasisPtr(), mainAxisownerSize);
  const bool isRowStyleDimDefined =
      ABI31_0_0YGNodeIsStyleDimDefined(child, ABI31_0_0YGFlexDirectionRow, ownerWidth);
  const bool isColumnStyleDimDefined =
      ABI31_0_0YGNodeIsStyleDimDefined(child, ABI31_0_0YGFlexDirectionColumn, ownerHeight);

  if (!resolvedFlexBasis.isUndefined() && !ABI31_0_0YGFloatIsUndefined(mainAxisSize)) {
    if (child->getLayout().computedFlexBasis.isUndefined() ||
        (ABI31_0_0YGConfigIsExperimentalFeatureEnabled(
             child->getConfig(), ABI31_0_0YGExperimentalFeatureWebFlexBasis) &&
         child->getLayout().computedFlexBasisGeneration !=
             gCurrentGenerationCount)) {
      const ABI31_0_0YGFloatOptional& paddingAndBorder = ABI31_0_0YGFloatOptional(
          ABI31_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth));
      child->setLayoutComputedFlexBasis(
          ABI31_0_0YGFloatOptionalMax(resolvedFlexBasis, paddingAndBorder));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    const ABI31_0_0YGFloatOptional& paddingAndBorder = ABI31_0_0YGFloatOptional(
        ABI31_0_0YGNodePaddingAndBorderForAxis(child, ABI31_0_0YGFlexDirectionRow, ownerWidth));

    child->setLayoutComputedFlexBasis(ABI31_0_0YGFloatOptionalMax(
        ABI31_0_0YGResolveValue(
            child->getResolvedDimension(ABI31_0_0YGDimensionWidth), ownerWidth),
        paddingAndBorder));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    const ABI31_0_0YGFloatOptional& paddingAndBorder =
        ABI31_0_0YGFloatOptional(ABI31_0_0YGNodePaddingAndBorderForAxis(
            child, ABI31_0_0YGFlexDirectionColumn, ownerWidth));
    child->setLayoutComputedFlexBasis(ABI31_0_0YGFloatOptionalMax(
        ABI31_0_0YGResolveValue(
            child->getResolvedDimension(ABI31_0_0YGDimensionHeight), ownerHeight),
        paddingAndBorder));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = ABI31_0_0YGUndefined;
    childHeight = ABI31_0_0YGUndefined;
    childWidthMeasureMode = ABI31_0_0YGMeasureModeUndefined;
    childHeightMeasureMode = ABI31_0_0YGMeasureModeUndefined;

    auto marginRow = ABI31_0_0YGUnwrapFloatOptional(
        child->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, ownerWidth));
    auto marginColumn = ABI31_0_0YGUnwrapFloatOptional(
        child->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, ownerWidth));

    if (isRowStyleDimDefined) {
      childWidth =
          ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
              child->getResolvedDimension(ABI31_0_0YGDimensionWidth), ownerWidth)) +
          marginRow;
      childWidthMeasureMode = ABI31_0_0YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
              child->getResolvedDimension(ABI31_0_0YGDimensionHeight), ownerHeight)) +
          marginColumn;
      childHeightMeasureMode = ABI31_0_0YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->getStyle().overflow == ABI31_0_0YGOverflowScroll) ||
        node->getStyle().overflow != ABI31_0_0YGOverflowScroll) {
      if (ABI31_0_0YGFloatIsUndefined(childWidth) && !ABI31_0_0YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = ABI31_0_0YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->getStyle().overflow == ABI31_0_0YGOverflowScroll) ||
        node->getStyle().overflow != ABI31_0_0YGOverflowScroll) {
      if (ABI31_0_0YGFloatIsUndefined(childHeight) && !ABI31_0_0YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = ABI31_0_0YGMeasureModeAtMost;
      }
    }

    if (!child->getStyle().aspectRatio.isUndefined()) {
      if (!isMainAxisRow && childWidthMeasureMode == ABI31_0_0YGMeasureModeExactly) {
        childHeight = marginColumn +
            (childWidth - marginRow) / child->getStyle().aspectRatio.getValue();
        childHeightMeasureMode = ABI31_0_0YGMeasureModeExactly;
      } else if (
          isMainAxisRow && childHeightMeasureMode == ABI31_0_0YGMeasureModeExactly) {
        childWidth = marginRow +
            (childHeight - marginColumn) *
                child->getStyle().aspectRatio.getValue();
        childWidthMeasureMode = ABI31_0_0YGMeasureModeExactly;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width

    const bool hasExactWidth =
        !ABI31_0_0YGFloatIsUndefined(width) && widthMode == ABI31_0_0YGMeasureModeExactly;
    const bool childWidthStretch =
        ABI31_0_0YGNodeAlignItem(node, child) == ABI31_0_0YGAlignStretch &&
        childWidthMeasureMode != ABI31_0_0YGMeasureModeExactly;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth &&
        childWidthStretch) {
      childWidth = width;
      childWidthMeasureMode = ABI31_0_0YGMeasureModeExactly;
      if (!child->getStyle().aspectRatio.isUndefined()) {
        childHeight =
            (childWidth - marginRow) / child->getStyle().aspectRatio.getValue();
        childHeightMeasureMode = ABI31_0_0YGMeasureModeExactly;
      }
    }

    const bool hasExactHeight =
        !ABI31_0_0YGFloatIsUndefined(height) && heightMode == ABI31_0_0YGMeasureModeExactly;
    const bool childHeightStretch =
        ABI31_0_0YGNodeAlignItem(node, child) == ABI31_0_0YGAlignStretch &&
        childHeightMeasureMode != ABI31_0_0YGMeasureModeExactly;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight &&
        childHeightStretch) {
      childHeight = height;
      childHeightMeasureMode = ABI31_0_0YGMeasureModeExactly;

      if (!child->getStyle().aspectRatio.isUndefined()) {
        childWidth = (childHeight - marginColumn) *
            child->getStyle().aspectRatio.getValue();
        childWidthMeasureMode = ABI31_0_0YGMeasureModeExactly;
      }
    }

    ABI31_0_0YGConstrainMaxSizeForMode(
        child,
        ABI31_0_0YGFlexDirectionRow,
        ownerWidth,
        ownerWidth,
        &childWidthMeasureMode,
        &childWidth);
    ABI31_0_0YGConstrainMaxSizeForMode(
        child,
        ABI31_0_0YGFlexDirectionColumn,
        ownerHeight,
        ownerWidth,
        &childHeightMeasureMode,
        &childHeight);

    // Measure the child
    ABI31_0_0YGLayoutNodeInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        ownerWidth,
        ownerHeight,
        false,
        "measure",
        config);

    child->setLayoutComputedFlexBasis(ABI31_0_0YGFloatOptional(ABI31_0_0YGFloatMax(
        child->getLayout().measuredDimensions[dim[mainAxis]],
        ABI31_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, ownerWidth))));
  }
  child->setLayoutComputedFlexBasisGeneration(gCurrentGenerationCount);
}

static void ABI31_0_0YGNodeAbsoluteLayoutChild(
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGNodeRef child,
    const float width,
    const ABI31_0_0YGMeasureMode widthMode,
    const float height,
    const ABI31_0_0YGDirection direction,
    const ABI31_0_0YGConfigRef config) {
  const ABI31_0_0YGFlexDirection mainAxis =
      ABI31_0_0YGResolveFlexDirection(node->getStyle().flexDirection, direction);
  const ABI31_0_0YGFlexDirection crossAxis = ABI31_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI31_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth = ABI31_0_0YGUndefined;
  float childHeight = ABI31_0_0YGUndefined;
  ABI31_0_0YGMeasureMode childWidthMeasureMode = ABI31_0_0YGMeasureModeUndefined;
  ABI31_0_0YGMeasureMode childHeightMeasureMode = ABI31_0_0YGMeasureModeUndefined;

  auto marginRow =
      ABI31_0_0YGUnwrapFloatOptional(child->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, width));
  auto marginColumn = ABI31_0_0YGUnwrapFloatOptional(
      child->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, width));

  if (ABI31_0_0YGNodeIsStyleDimDefined(child, ABI31_0_0YGFlexDirectionRow, width)) {
    childWidth = ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
                     child->getResolvedDimension(ABI31_0_0YGDimensionWidth), width)) +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (child->isLeadingPositionDefined(ABI31_0_0YGFlexDirectionRow) &&
        child->isTrailingPosDefined(ABI31_0_0YGFlexDirectionRow)) {
      childWidth = node->getLayout().measuredDimensions[ABI31_0_0YGDimensionWidth] -
          (node->getLeadingBorder(ABI31_0_0YGFlexDirectionRow) +
           node->getTrailingBorder(ABI31_0_0YGFlexDirectionRow)) -
          ABI31_0_0YGUnwrapFloatOptional(
                       child->getLeadingPosition(ABI31_0_0YGFlexDirectionRow, width) +
                       child->getTrailingPosition(ABI31_0_0YGFlexDirectionRow, width));
      childWidth =
          ABI31_0_0YGNodeBoundAxis(child, ABI31_0_0YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (ABI31_0_0YGNodeIsStyleDimDefined(child, ABI31_0_0YGFlexDirectionColumn, height)) {
    childHeight = ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
                      child->getResolvedDimension(ABI31_0_0YGDimensionHeight), height)) +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (child->isLeadingPositionDefined(ABI31_0_0YGFlexDirectionColumn) &&
        child->isTrailingPosDefined(ABI31_0_0YGFlexDirectionColumn)) {
      childHeight =
          node->getLayout().measuredDimensions[ABI31_0_0YGDimensionHeight] -
          (node->getLeadingBorder(ABI31_0_0YGFlexDirectionColumn) +
           node->getTrailingBorder(ABI31_0_0YGFlexDirectionColumn)) -
          ABI31_0_0YGUnwrapFloatOptional(
              child->getLeadingPosition(ABI31_0_0YGFlexDirectionColumn, height) +
              child->getTrailingPosition(ABI31_0_0YGFlexDirectionColumn, height));
      childHeight = ABI31_0_0YGNodeBoundAxis(
          child, ABI31_0_0YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect
  // ratio calculation. One dimension being the anchor and the other being
  // flexible.
  if (ABI31_0_0YGFloatIsUndefined(childWidth) ^ ABI31_0_0YGFloatIsUndefined(childHeight)) {
    if (!child->getStyle().aspectRatio.isUndefined()) {
      if (ABI31_0_0YGFloatIsUndefined(childWidth)) {
        childWidth = marginRow +
            (childHeight - marginColumn) *
                child->getStyle().aspectRatio.getValue();
      } else if (ABI31_0_0YGFloatIsUndefined(childHeight)) {
        childHeight = marginColumn +
            (childWidth - marginRow) / child->getStyle().aspectRatio.getValue();
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (ABI31_0_0YGFloatIsUndefined(childWidth) || ABI31_0_0YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode = ABI31_0_0YGFloatIsUndefined(childWidth)
        ? ABI31_0_0YGMeasureModeUndefined
        : ABI31_0_0YGMeasureModeExactly;
    childHeightMeasureMode = ABI31_0_0YGFloatIsUndefined(childHeight)
        ? ABI31_0_0YGMeasureModeUndefined
        : ABI31_0_0YGMeasureModeExactly;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child to
    // wrap to the size of its owner. This is the same behavior as many browsers
    // implement.
    if (!isMainAxisRow && ABI31_0_0YGFloatIsUndefined(childWidth) &&
        widthMode != ABI31_0_0YGMeasureModeUndefined && !ABI31_0_0YGFloatIsUndefined(width) &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = ABI31_0_0YGMeasureModeAtMost;
    }

    ABI31_0_0YGLayoutNodeInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        childWidth,
        childHeight,
        false,
        "abs-measure",
        config);
    childWidth = child->getLayout().measuredDimensions[ABI31_0_0YGDimensionWidth] +
        ABI31_0_0YGUnwrapFloatOptional(
                     child->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, width));
    childHeight = child->getLayout().measuredDimensions[ABI31_0_0YGDimensionHeight] +
        ABI31_0_0YGUnwrapFloatOptional(
                      child->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, width));
  }

  ABI31_0_0YGLayoutNodeInternal(
      child,
      childWidth,
      childHeight,
      direction,
      ABI31_0_0YGMeasureModeExactly,
      ABI31_0_0YGMeasureModeExactly,
      childWidth,
      childHeight,
      true,
      "abs-layout",
      config);

  if (child->isTrailingPosDefined(mainAxis) &&
      !child->isLeadingPositionDefined(mainAxis)) {
    child->setLayoutPosition(
        node->getLayout().measuredDimensions[dim[mainAxis]] -
            child->getLayout().measuredDimensions[dim[mainAxis]] -
            node->getTrailingBorder(mainAxis) -
            ABI31_0_0YGUnwrapFloatOptional(child->getTrailingMargin(mainAxis, width)) -
            ABI31_0_0YGUnwrapFloatOptional(child->getTrailingPosition(
                mainAxis, isMainAxisRow ? width : height)),
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent == ABI31_0_0YGJustifyCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[mainAxis]] -
         child->getLayout().measuredDimensions[dim[mainAxis]]) /
            2.0f,
        leading[mainAxis]);
  } else if (
      !child->isLeadingPositionDefined(mainAxis) &&
      node->getStyle().justifyContent == ABI31_0_0YGJustifyFlexEnd) {
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
            ABI31_0_0YGUnwrapFloatOptional(child->getTrailingMargin(crossAxis, width)) -
            ABI31_0_0YGUnwrapFloatOptional(child->getTrailingPosition(
                crossAxis, isMainAxisRow ? height : width)),
        leading[crossAxis]);

  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ABI31_0_0YGNodeAlignItem(node, child) == ABI31_0_0YGAlignCenter) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]) /
            2.0f,
        leading[crossAxis]);
  } else if (
      !child->isLeadingPositionDefined(crossAxis) &&
      ((ABI31_0_0YGNodeAlignItem(node, child) == ABI31_0_0YGAlignFlexEnd) ^
       (node->getStyle().flexWrap == ABI31_0_0YGWrapWrapReverse))) {
    child->setLayoutPosition(
        (node->getLayout().measuredDimensions[dim[crossAxis]] -
         child->getLayout().measuredDimensions[dim[crossAxis]]),
        leading[crossAxis]);
  }
}

static void ABI31_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(
    const ABI31_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI31_0_0YGMeasureMode widthMeasureMode,
    const ABI31_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  ABI31_0_0YGAssertWithNode(
      node,
      node->getMeasure() != nullptr,
      "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow =
      ABI31_0_0YGNodePaddingAndBorderForAxis(node, ABI31_0_0YGFlexDirectionRow, availableWidth);
  const float paddingAndBorderAxisColumn = ABI31_0_0YGNodePaddingAndBorderForAxis(
      node, ABI31_0_0YGFlexDirectionColumn, availableWidth);
  const float marginAxisRow = ABI31_0_0YGUnwrapFloatOptional(
      node->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, availableWidth));
  const float marginAxisColumn = ABI31_0_0YGUnwrapFloatOptional(
      node->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, availableWidth));

  // We want to make sure we don't call measure with negative size
  const float innerWidth = ABI31_0_0YGFloatIsUndefined(availableWidth)
      ? availableWidth
      : ABI31_0_0YGFloatMax(0, availableWidth - marginAxisRow - paddingAndBorderAxisRow);
  const float innerHeight = ABI31_0_0YGFloatIsUndefined(availableHeight)
      ? availableHeight
      : ABI31_0_0YGFloatMax(
            0, availableHeight - marginAxisColumn - paddingAndBorderAxisColumn);

  if (widthMeasureMode == ABI31_0_0YGMeasureModeExactly &&
      heightMeasureMode == ABI31_0_0YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node,
            ABI31_0_0YGFlexDirectionRow,
            availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        ABI31_0_0YGDimensionWidth);
    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node,
            ABI31_0_0YGFlexDirectionColumn,
            availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        ABI31_0_0YGDimensionHeight);
  } else {
    // Measure the text under the current constraints.
    const ABI31_0_0YGSize measuredSize = node->getMeasure()(
        node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node,
            ABI31_0_0YGFlexDirectionRow,
            (widthMeasureMode == ABI31_0_0YGMeasureModeUndefined ||
             widthMeasureMode == ABI31_0_0YGMeasureModeAtMost)
                ? measuredSize.width + paddingAndBorderAxisRow
                : availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        ABI31_0_0YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node,
            ABI31_0_0YGFlexDirectionColumn,
            (heightMeasureMode == ABI31_0_0YGMeasureModeUndefined ||
             heightMeasureMode == ABI31_0_0YGMeasureModeAtMost)
                ? measuredSize.height + paddingAndBorderAxisColumn
                : availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        ABI31_0_0YGDimensionHeight);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void ABI31_0_0YGNodeEmptyContainerSetMeasuredDimensions(
    const ABI31_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI31_0_0YGMeasureMode widthMeasureMode,
    const ABI31_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  const float paddingAndBorderAxisRow =
      ABI31_0_0YGNodePaddingAndBorderForAxis(node, ABI31_0_0YGFlexDirectionRow, ownerWidth);
  const float paddingAndBorderAxisColumn =
      ABI31_0_0YGNodePaddingAndBorderForAxis(node, ABI31_0_0YGFlexDirectionColumn, ownerWidth);
  const float marginAxisRow = ABI31_0_0YGUnwrapFloatOptional(
      node->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, ownerWidth));
  const float marginAxisColumn = ABI31_0_0YGUnwrapFloatOptional(
      node->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, ownerWidth));

  node->setLayoutMeasuredDimension(
      ABI31_0_0YGNodeBoundAxis(
          node,
          ABI31_0_0YGFlexDirectionRow,
          (widthMeasureMode == ABI31_0_0YGMeasureModeUndefined ||
           widthMeasureMode == ABI31_0_0YGMeasureModeAtMost)
              ? paddingAndBorderAxisRow
              : availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      ABI31_0_0YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      ABI31_0_0YGNodeBoundAxis(
          node,
          ABI31_0_0YGFlexDirectionColumn,
          (heightMeasureMode == ABI31_0_0YGMeasureModeUndefined ||
           heightMeasureMode == ABI31_0_0YGMeasureModeAtMost)
              ? paddingAndBorderAxisColumn
              : availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      ABI31_0_0YGDimensionHeight);
}

static bool ABI31_0_0YGNodeFixedSizeSetMeasuredDimensions(
    const ABI31_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI31_0_0YGMeasureMode widthMeasureMode,
    const ABI31_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight) {
  if ((!ABI31_0_0YGFloatIsUndefined(availableWidth) &&
       widthMeasureMode == ABI31_0_0YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (!ABI31_0_0YGFloatIsUndefined(availableHeight) &&
       heightMeasureMode == ABI31_0_0YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == ABI31_0_0YGMeasureModeExactly &&
       heightMeasureMode == ABI31_0_0YGMeasureModeExactly)) {
    auto marginAxisColumn = ABI31_0_0YGUnwrapFloatOptional(
        node->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, ownerWidth));
    auto marginAxisRow = ABI31_0_0YGUnwrapFloatOptional(
        node->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, ownerWidth));

    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node,
            ABI31_0_0YGFlexDirectionRow,
            ABI31_0_0YGFloatIsUndefined(availableWidth) ||
                    (widthMeasureMode == ABI31_0_0YGMeasureModeAtMost &&
                     availableWidth < 0.0f)
                ? 0.0f
                : availableWidth - marginAxisRow,
            ownerWidth,
            ownerWidth),
        ABI31_0_0YGDimensionWidth);

    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node,
            ABI31_0_0YGFlexDirectionColumn,
            ABI31_0_0YGFloatIsUndefined(availableHeight) ||
                    (heightMeasureMode == ABI31_0_0YGMeasureModeAtMost &&
                     availableHeight < 0.0f)
                ? 0.0f
                : availableHeight - marginAxisColumn,
            ownerHeight,
            ownerWidth),
        ABI31_0_0YGDimensionHeight);
    return true;
  }

  return false;
}

static void ABI31_0_0YGZeroOutLayoutRecursivly(const ABI31_0_0YGNodeRef node) {
  memset(&(node->getLayout()), 0, sizeof(ABI31_0_0YGLayout));
  node->setHasNewLayout(true);
  node->cloneChildrenIfNeeded();
  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI31_0_0YGNodeRef child = node->getChild(i);
    ABI31_0_0YGZeroOutLayoutRecursivly(child);
  }
}

static float ABI31_0_0YGNodeCalculateAvailableInnerDim(
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGFlexDirection axis,
    float availableDim,
    float ownerDim) {
  ABI31_0_0YGFlexDirection direction =
      ABI31_0_0YGFlexDirectionIsRow(axis) ? ABI31_0_0YGFlexDirectionRow : ABI31_0_0YGFlexDirectionColumn;
  ABI31_0_0YGDimension dimension =
      ABI31_0_0YGFlexDirectionIsRow(axis) ? ABI31_0_0YGDimensionWidth : ABI31_0_0YGDimensionHeight;

  const float margin =
      ABI31_0_0YGUnwrapFloatOptional(node->getMarginForAxis(direction, ownerDim));
  const float paddingAndBorder =
      ABI31_0_0YGNodePaddingAndBorderForAxis(node, direction, ownerDim);

  float availableInnerDim = availableDim - margin - paddingAndBorder;
  // Max dimension overrides predefined dimension value; Min dimension in turn
  // overrides both of the above
  if (!ABI31_0_0YGFloatIsUndefined(availableInnerDim)) {
    // We want to make sure our available height does not violate min and max
    // constraints
    const ABI31_0_0YGFloatOptional minDimensionOptional =
        ABI31_0_0YGResolveValue(node->getStyle().minDimensions[dimension], ownerDim);
    const float minInnerDim = minDimensionOptional.isUndefined()
        ? 0.0f
        : minDimensionOptional.getValue() - paddingAndBorder;

    const ABI31_0_0YGFloatOptional maxDimensionOptional =
        ABI31_0_0YGResolveValue(node->getStyle().maxDimensions[dimension], ownerDim);

    const float maxInnerDim = maxDimensionOptional.isUndefined()
        ? FLT_MAX
        : maxDimensionOptional.getValue() - paddingAndBorder;
    availableInnerDim =
        ABI31_0_0YGFloatMax(ABI31_0_0YGFloatMin(availableInnerDim, maxInnerDim), minInnerDim);
  }

  return availableInnerDim;
}

static void ABI31_0_0YGNodeComputeFlexBasisForChildren(
    const ABI31_0_0YGNodeRef node,
    const float availableInnerWidth,
    const float availableInnerHeight,
    ABI31_0_0YGMeasureMode widthMeasureMode,
    ABI31_0_0YGMeasureMode heightMeasureMode,
    ABI31_0_0YGDirection direction,
    ABI31_0_0YGFlexDirection mainAxis,
    const ABI31_0_0YGConfigRef config,
    bool performLayout,
    float& totalOuterFlexBasis) {
  ABI31_0_0YGNodeRef singleFlexChild = nullptr;
  ABI31_0_0YGVector children = node->getChildren();
  ABI31_0_0YGMeasureMode measureModeMainDim =
      ABI31_0_0YGFlexDirectionIsRow(mainAxis) ? widthMeasureMode : heightMeasureMode;
  // If there is only one child with flexGrow + flexShrink it means we can set
  // the computedFlexBasis to 0 instead of measuring and shrinking / flexing the
  // child to exactly match the remaining space
  if (measureModeMainDim == ABI31_0_0YGMeasureModeExactly) {
    for (auto child : children) {
      if (child->isNodeFlexible()) {
        if (singleFlexChild != nullptr ||
            ABI31_0_0YGFloatsEqual(child->resolveFlexGrow(), 0.0f) ||
            ABI31_0_0YGFloatsEqual(child->resolveFlexShrink(), 0.0f)) {
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
    if (child->getStyle().display == ABI31_0_0YGDisplayNone) {
      ABI31_0_0YGZeroOutLayoutRecursivly(child);
      child->setHasNewLayout(true);
      child->setDirty(false);
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const ABI31_0_0YGDirection childDirection = child->resolveDirection(direction);
      const float mainDim = ABI31_0_0YGFlexDirectionIsRow(mainAxis)
          ? availableInnerWidth
          : availableInnerHeight;
      const float crossDim = ABI31_0_0YGFlexDirectionIsRow(mainAxis)
          ? availableInnerHeight
          : availableInnerWidth;
      child->setPosition(
          childDirection, mainDim, crossDim, availableInnerWidth);
    }

    if (child->getStyle().positionType == ABI31_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (child == singleFlexChild) {
      child->setLayoutComputedFlexBasisGeneration(gCurrentGenerationCount);
      child->setLayoutComputedFlexBasis(ABI31_0_0YGFloatOptional(0));
    } else {
      ABI31_0_0YGNodeComputeFlexBasisForChild(
          node,
          child,
          availableInnerWidth,
          widthMeasureMode,
          availableInnerHeight,
          availableInnerWidth,
          availableInnerHeight,
          heightMeasureMode,
          direction,
          config);
    }

    totalOuterFlexBasis += ABI31_0_0YGUnwrapFloatOptional(
        child->getLayout().computedFlexBasis +
        child->getMarginForAxis(mainAxis, availableInnerWidth));
  }
}

// This function assumes that all the children of node have their
// computedFlexBasis properly computed(To do this use
// ABI31_0_0YGNodeComputeFlexBasisForChildren function).
// This function calculates ABI31_0_0YGCollectFlexItemsRowMeasurement
static ABI31_0_0YGCollectFlexItemsRowValues ABI31_0_0YGCalculateCollectFlexItemsRowValues(
    const ABI31_0_0YGNodeRef& node,
    const ABI31_0_0YGDirection ownerDirection,
    const float mainAxisownerSize,
    const float availableInnerWidth,
    const float availableInnerMainDim,
    const uint32_t startOfLineIndex,
    const uint32_t lineCount) {
  ABI31_0_0YGCollectFlexItemsRowValues flexAlgoRowMeasurement = {};
  flexAlgoRowMeasurement.relativeChildren.reserve(node->getChildren().size());

  float sizeConsumedOnCurrentLineIncludingMinConstraint = 0;
  const ABI31_0_0YGFlexDirection mainAxis = ABI31_0_0YGResolveFlexDirection(
      node->getStyle().flexDirection, node->resolveDirection(ownerDirection));
  const bool isNodeFlexWrap = node->getStyle().flexWrap != ABI31_0_0YGWrapNoWrap;

  // Add items to the current line until it's full or we run out of items.
  uint32_t endOfLineIndex = startOfLineIndex;
  for (; endOfLineIndex < node->getChildren().size(); endOfLineIndex++) {
    const ABI31_0_0YGNodeRef child = node->getChild(endOfLineIndex);
    if (child->getStyle().display == ABI31_0_0YGDisplayNone ||
        child->getStyle().positionType == ABI31_0_0YGPositionTypeAbsolute) {
      continue;
    }
    child->setLineIndex(lineCount);
    const float childMarginMainAxis = ABI31_0_0YGUnwrapFloatOptional(
        child->getMarginForAxis(mainAxis, availableInnerWidth));
    const float flexBasisWithMinAndMaxConstraints =
        ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGNodeBoundAxisWithinMinAndMax(
            child,
            mainAxis,
            ABI31_0_0YGUnwrapFloatOptional(child->getLayout().computedFlexBasis),
            mainAxisownerSize));

    // If this is a multi-line flow and this item pushes us over the
    // available size, we've
    // hit the end of the current line. Break out of the loop and lay out
    // the current line.
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
          ABI31_0_0YGUnwrapFloatOptional(child->getLayout().computedFlexBasis);
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
// please ensure that ABI31_0_0YGDistributeFreeSpaceFirstPass is called.
static float ABI31_0_0YGDistributeFreeSpaceSecondPass(
    ABI31_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI31_0_0YGNodeRef node,
    const ABI31_0_0YGFlexDirection mainAxis,
    const ABI31_0_0YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool flexBasisOverflows,
    const ABI31_0_0YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const ABI31_0_0YGConfigRef config) {
  float childFlexBasis = 0;
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float deltaFreeSpace = 0;
  const bool isMainAxisRow = ABI31_0_0YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap != ABI31_0_0YGWrapNoWrap;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    childFlexBasis = ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGNodeBoundAxisWithinMinAndMax(
        currentRelativeChild,
        mainAxis,
        ABI31_0_0YGUnwrapFloatOptional(
            currentRelativeChild->getLayout().computedFlexBasis),
        mainAxisownerSize));
    float updatedMainSize = childFlexBasis;

    if (!ABI31_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;
      // Is this child able to shrink?
      if (flexShrinkScaledFactor != 0) {
        float childSize;

        if (!ABI31_0_0YGFloatIsUndefined(
                collectedFlexItemsValues.totalFlexShrinkScaledFactors) &&
            collectedFlexItemsValues.totalFlexShrinkScaledFactors == 0) {
          childSize = childFlexBasis + flexShrinkScaledFactor;
        } else {
          childSize = childFlexBasis +
              (collectedFlexItemsValues.remainingFreeSpace /
               collectedFlexItemsValues.totalFlexShrinkScaledFactors) *
                  flexShrinkScaledFactor;
        }

        updatedMainSize = ABI31_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            childSize,
            availableInnerMainDim,
            availableInnerWidth);
      }
    } else if (
        !ABI31_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!ABI31_0_0YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        updatedMainSize = ABI31_0_0YGNodeBoundAxis(
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

    const float marginMain = ABI31_0_0YGUnwrapFloatOptional(
        currentRelativeChild->getMarginForAxis(mainAxis, availableInnerWidth));
    const float marginCross = ABI31_0_0YGUnwrapFloatOptional(
        currentRelativeChild->getMarginForAxis(crossAxis, availableInnerWidth));

    float childCrossSize;
    float childMainSize = updatedMainSize + marginMain;
    ABI31_0_0YGMeasureMode childCrossMeasureMode;
    ABI31_0_0YGMeasureMode childMainMeasureMode = ABI31_0_0YGMeasureModeExactly;

    if (!currentRelativeChild->getStyle().aspectRatio.isUndefined()) {
      childCrossSize = isMainAxisRow ? (childMainSize - marginMain) /
              currentRelativeChild->getStyle().aspectRatio.getValue()
                                     : (childMainSize - marginMain) *
              currentRelativeChild->getStyle().aspectRatio.getValue();
      childCrossMeasureMode = ABI31_0_0YGMeasureModeExactly;

      childCrossSize += marginCross;
    } else if (
        !ABI31_0_0YGFloatIsUndefined(availableInnerCrossDim) &&
        !ABI31_0_0YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        measureModeCrossDim == ABI31_0_0YGMeasureModeExactly &&
        !(isNodeFlexWrap && flexBasisOverflows) &&
        ABI31_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI31_0_0YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            ABI31_0_0YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit !=
            ABI31_0_0YGUnitAuto) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = ABI31_0_0YGMeasureModeExactly;
    } else if (!ABI31_0_0YGNodeIsStyleDimDefined(
                   currentRelativeChild, crossAxis, availableInnerCrossDim)) {
      childCrossSize = availableInnerCrossDim;
      childCrossMeasureMode = ABI31_0_0YGFloatIsUndefined(childCrossSize)
          ? ABI31_0_0YGMeasureModeUndefined
          : ABI31_0_0YGMeasureModeAtMost;
    } else {
      childCrossSize =
          ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
              currentRelativeChild->getResolvedDimension(dim[crossAxis]),
              availableInnerCrossDim)) +
          marginCross;
      const bool isLoosePercentageMeasurement =
          currentRelativeChild->getResolvedDimension(dim[crossAxis]).unit ==
              ABI31_0_0YGUnitPercent &&
          measureModeCrossDim != ABI31_0_0YGMeasureModeExactly;
      childCrossMeasureMode =
          ABI31_0_0YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
          ? ABI31_0_0YGMeasureModeUndefined
          : ABI31_0_0YGMeasureModeExactly;
    }

    ABI31_0_0YGConstrainMaxSizeForMode(
        currentRelativeChild,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        &childMainMeasureMode,
        &childMainSize);
    ABI31_0_0YGConstrainMaxSizeForMode(
        currentRelativeChild,
        crossAxis,
        availableInnerCrossDim,
        availableInnerWidth,
        &childCrossMeasureMode,
        &childCrossSize);

    const bool requiresStretchLayout =
        !ABI31_0_0YGNodeIsStyleDimDefined(
            currentRelativeChild, crossAxis, availableInnerCrossDim) &&
        ABI31_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI31_0_0YGAlignStretch &&
        currentRelativeChild->marginLeadingValue(crossAxis).unit !=
            ABI31_0_0YGUnitAuto &&
        currentRelativeChild->marginTrailingValue(crossAxis).unit != ABI31_0_0YGUnitAuto;

    const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
    const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

    const ABI31_0_0YGMeasureMode childWidthMeasureMode =
        isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
    const ABI31_0_0YGMeasureMode childHeightMeasureMode =
        !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

    // Recursively call the layout algorithm for this child with the updated
    // main size.
    ABI31_0_0YGLayoutNodeInternal(
        currentRelativeChild,
        childWidth,
        childHeight,
        node->getLayout().direction,
        childWidthMeasureMode,
        childHeightMeasureMode,
        availableInnerWidth,
        availableInnerHeight,
        performLayout && !requiresStretchLayout,
        "flex",
        config);
    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow |
        currentRelativeChild->getLayout().hadOverflow);
  }
  return deltaFreeSpace;
}

// It distributes the free space to the flexible items.For those flexible items
// whose min and max constraints are triggered, those flex item's clamped size
// is removed from the remaingfreespace.
static void ABI31_0_0YGDistributeFreeSpaceFirstPass(
    ABI31_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI31_0_0YGFlexDirection mainAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerWidth) {
  float flexShrinkScaledFactor = 0;
  float flexGrowFactor = 0;
  float baseMainSize = 0;
  float boundMainSize = 0;
  float deltaFreeSpace = 0;

  for (auto currentRelativeChild : collectedFlexItemsValues.relativeChildren) {
    float childFlexBasis = ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGNodeBoundAxisWithinMinAndMax(
        currentRelativeChild,
        mainAxis,
        ABI31_0_0YGUnwrapFloatOptional(
            currentRelativeChild->getLayout().computedFlexBasis),
        mainAxisownerSize));

    if (collectedFlexItemsValues.remainingFreeSpace < 0) {
      flexShrinkScaledFactor =
          -currentRelativeChild->resolveFlexShrink() * childFlexBasis;

      // Is this child able to shrink?
      if (!ABI31_0_0YGFloatIsUndefined(flexShrinkScaledFactor) &&
          flexShrinkScaledFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexShrinkScaledFactors *
                flexShrinkScaledFactor;
        boundMainSize = ABI31_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);
        if (!ABI31_0_0YGFloatIsUndefined(baseMainSize) &&
            !ABI31_0_0YGFloatIsUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining,
          // this item's
          // min/max constraints should also trigger in the second pass
          // resulting in the
          // item's size calculation being identical in the first and second
          // passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          collectedFlexItemsValues.totalFlexShrinkScaledFactors -=
              flexShrinkScaledFactor;
        }
      }
    } else if (
        !ABI31_0_0YGFloatIsUndefined(collectedFlexItemsValues.remainingFreeSpace) &&
        collectedFlexItemsValues.remainingFreeSpace > 0) {
      flexGrowFactor = currentRelativeChild->resolveFlexGrow();

      // Is this child able to grow?
      if (!ABI31_0_0YGFloatIsUndefined(flexGrowFactor) && flexGrowFactor != 0) {
        baseMainSize = childFlexBasis +
            collectedFlexItemsValues.remainingFreeSpace /
                collectedFlexItemsValues.totalFlexGrowFactors * flexGrowFactor;
        boundMainSize = ABI31_0_0YGNodeBoundAxis(
            currentRelativeChild,
            mainAxis,
            baseMainSize,
            availableInnerMainDim,
            availableInnerWidth);

        if (!ABI31_0_0YGFloatIsUndefined(baseMainSize) &&
            !ABI31_0_0YGFloatIsUndefined(boundMainSize) &&
            baseMainSize != boundMainSize) {
          // By excluding this item's size and flex factor from remaining,
          // this item's
          // min/max constraints should also trigger in the second pass
          // resulting in the
          // item's size calculation being identical in the first and second
          // passes.
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
// The first pass finds the items whose min/max constraints trigger,
// freezes them at those
// sizes, and excludes those sizes from the remaining space. The second
// pass sets the size
// of each flexible item. It distributes the remaining space amongst the
// items whose min/max
// constraints didn't trigger in pass 1. For the other items, it sets
// their sizes by forcing
// their min/max constraints to trigger again.
//
// This two pass approach for resolving min/max constraints deviates from
// the spec. The
// spec (https://www.w3.org/TR/YG-flexbox-1/#resolve-flexible-lengths)
// describes a process
// that needs to be repeated a variable number of times. The algorithm
// implemented here
// won't handle all cases but it was simpler to implement and it mitigates
// performance
// concerns because we know exactly how many passes it'll do.
//
// At the end of this function the child nodes would have the proper size
// assigned to them.
//
static void ABI31_0_0YGResolveFlexibleLength(
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const ABI31_0_0YGFlexDirection mainAxis,
    const ABI31_0_0YGFlexDirection crossAxis,
    const float mainAxisownerSize,
    const float availableInnerMainDim,
    const float availableInnerCrossDim,
    const float availableInnerWidth,
    const float availableInnerHeight,
    const bool flexBasisOverflows,
    const ABI31_0_0YGMeasureMode measureModeCrossDim,
    const bool performLayout,
    const ABI31_0_0YGConfigRef config) {
  const float originalFreeSpace = collectedFlexItemsValues.remainingFreeSpace;
  // First pass: detect the flex items whose min/max constraints trigger
  ABI31_0_0YGDistributeFreeSpaceFirstPass(
      collectedFlexItemsValues,
      mainAxis,
      mainAxisownerSize,
      availableInnerMainDim,
      availableInnerWidth);

  // Second pass: resolve the sizes of the flexible items
  const float distributedFreeSpace = ABI31_0_0YGDistributeFreeSpaceSecondPass(
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
      config);

  collectedFlexItemsValues.remainingFreeSpace =
      originalFreeSpace - distributedFreeSpace;
}

static void ABI31_0_0YGJustifyMainAxis(
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGCollectFlexItemsRowValues& collectedFlexItemsValues,
    const uint32_t& startOfLineIndex,
    const ABI31_0_0YGFlexDirection& mainAxis,
    const ABI31_0_0YGFlexDirection& crossAxis,
    const ABI31_0_0YGMeasureMode& measureModeMainDim,
    const ABI31_0_0YGMeasureMode& measureModeCrossDim,
    const float& mainAxisownerSize,
    const float& ownerWidth,
    const float& availableInnerMainDim,
    const float& availableInnerCrossDim,
    const float& availableInnerWidth,
    const bool& performLayout) {
  const ABI31_0_0YGStyle style = node->getStyle();

  // If we are using "at most" rules in the main axis. Calculate the remaining
  // space when constraint by the min size defined for the main axis.
  if (measureModeMainDim == ABI31_0_0YGMeasureModeAtMost &&
      collectedFlexItemsValues.remainingFreeSpace > 0) {
    if (style.minDimensions[dim[mainAxis]].unit != ABI31_0_0YGUnitUndefined &&
        !ABI31_0_0YGResolveValue(style.minDimensions[dim[mainAxis]], mainAxisownerSize)
             .isUndefined()) {
      collectedFlexItemsValues.remainingFreeSpace = ABI31_0_0YGFloatMax(
          0,
          ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
              style.minDimensions[dim[mainAxis]], mainAxisownerSize)) -
              (availableInnerMainDim -
               collectedFlexItemsValues.remainingFreeSpace));
    } else {
      collectedFlexItemsValues.remainingFreeSpace = 0;
    }
  }

  int numberOfAutoMarginsOnCurrentLine = 0;
  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const ABI31_0_0YGNodeRef child = node->getChild(i);
    if (child->getStyle().positionType == ABI31_0_0YGPositionTypeRelative) {
      if (child->marginLeadingValue(mainAxis).unit == ABI31_0_0YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
      if (child->marginTrailingValue(mainAxis).unit == ABI31_0_0YGUnitAuto) {
        numberOfAutoMarginsOnCurrentLine++;
      }
    }
  }

  // In order to position the elements in the main axis, we have two
  // controls. The space between the beginning and the first element
  // and the space between each two elements.
  float leadingMainDim = 0;
  float betweenMainDim = 0;
  const ABI31_0_0YGJustify justifyContent = node->getStyle().justifyContent;

  if (numberOfAutoMarginsOnCurrentLine == 0) {
    switch (justifyContent) {
      case ABI31_0_0YGJustifyCenter:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace / 2;
        break;
      case ABI31_0_0YGJustifyFlexEnd:
        leadingMainDim = collectedFlexItemsValues.remainingFreeSpace;
        break;
      case ABI31_0_0YGJustifySpaceBetween:
        if (collectedFlexItemsValues.itemsOnLine > 1) {
          betweenMainDim =
              ABI31_0_0YGFloatMax(collectedFlexItemsValues.remainingFreeSpace, 0) /
              (collectedFlexItemsValues.itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
        break;
      case ABI31_0_0YGJustifySpaceEvenly:
        // Space is distributed evenly across all elements
        betweenMainDim = collectedFlexItemsValues.remainingFreeSpace /
            (collectedFlexItemsValues.itemsOnLine + 1);
        leadingMainDim = betweenMainDim;
        break;
      case ABI31_0_0YGJustifySpaceAround:
        // Space on the edges is half of the space between elements
        betweenMainDim = collectedFlexItemsValues.remainingFreeSpace /
            collectedFlexItemsValues.itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
        break;
      case ABI31_0_0YGJustifyFlexStart:
        break;
    }
  }

  const float leadingPaddingAndBorderMain = ABI31_0_0YGUnwrapFloatOptional(
      node->getLeadingPaddingAndBorder(mainAxis, ownerWidth));
  collectedFlexItemsValues.mainDim =
      leadingPaddingAndBorderMain + leadingMainDim;
  collectedFlexItemsValues.crossDim = 0;

  for (uint32_t i = startOfLineIndex;
       i < collectedFlexItemsValues.endOfLineIndex;
       i++) {
    const ABI31_0_0YGNodeRef child = node->getChild(i);
    const ABI31_0_0YGStyle childStyle = child->getStyle();
    const ABI31_0_0YGLayout childLayout = child->getLayout();
    if (childStyle.display == ABI31_0_0YGDisplayNone) {
      continue;
    }
    if (childStyle.positionType == ABI31_0_0YGPositionTypeAbsolute &&
        child->isLeadingPositionDefined(mainAxis)) {
      if (performLayout) {
        // In case the child is position absolute and has left/top being
        // defined, we override the position to whatever the user said
        // (and margin/border).
        child->setLayoutPosition(
            ABI31_0_0YGUnwrapFloatOptional(
                child->getLeadingPosition(mainAxis, availableInnerMainDim)) +
                node->getLeadingBorder(mainAxis) +
                ABI31_0_0YGUnwrapFloatOptional(
                    child->getLeadingMargin(mainAxis, availableInnerWidth)),
            pos[mainAxis]);
      }
    } else {
      // Now that we placed the element, we need to update the variables.
      // We need to do that only for relative elements. Absolute elements
      // do not take part in that phase.
      if (childStyle.positionType == ABI31_0_0YGPositionTypeRelative) {
        if (child->marginLeadingValue(mainAxis).unit == ABI31_0_0YGUnitAuto) {
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

        if (child->marginTrailingValue(mainAxis).unit == ABI31_0_0YGUnitAuto) {
          collectedFlexItemsValues.mainDim +=
              collectedFlexItemsValues.remainingFreeSpace /
              numberOfAutoMarginsOnCurrentLine;
        }
        bool canSkipFlex =
            !performLayout && measureModeCrossDim == ABI31_0_0YGMeasureModeExactly;
        if (canSkipFlex) {
          // If we skipped the flex step, then we can't rely on the
          // measuredDims because
          // they weren't computed. This means we can't call
          // ABI31_0_0YGNodeDimWithMargin.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              ABI31_0_0YGUnwrapFloatOptional(child->getMarginForAxis(
                  mainAxis, availableInnerWidth)) +
              ABI31_0_0YGUnwrapFloatOptional(childLayout.computedFlexBasis);
          collectedFlexItemsValues.crossDim = availableInnerCrossDim;
        } else {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          collectedFlexItemsValues.mainDim += betweenMainDim +
              ABI31_0_0YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

          // The cross dimension is the max of the elements dimension since
          // there can only be one element in that cross dimension.
          collectedFlexItemsValues.crossDim = ABI31_0_0YGFloatMax(
              collectedFlexItemsValues.crossDim,
              ABI31_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
        }
      } else if (performLayout) {
        child->setLayoutPosition(
            childLayout.position[pos[mainAxis]] +
                node->getLeadingBorder(mainAxis) + leadingMainDim,
            pos[mainAxis]);
      }
    }
  }
  collectedFlexItemsValues.mainDim += ABI31_0_0YGUnwrapFloatOptional(
      node->getTrailingPaddingAndBorder(mainAxis, ownerWidth));
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C ABI31_0_0YG documentation: https://www.w3.org/TR/YG3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//  which
//    are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//  are
//    stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//  defined
//    by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//  'collapse'
//    and 'hidden' are not supported.
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//  bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//  minimum
//    main size. For text blocks, for example, this is the width of the widest
//    word.
//    Calculating the minimum width is expensive, so we forego it and assume a
//    default
//    minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//  lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//  but
//    the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing
//    the node
//      or ABI31_0_0YGUndefined if the size is not available; interpretation depends on
//      layout
//      flags
//    - ownerDirection: the inline (text) direction within the owner
//    (left-to-right or
//      right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//    for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//    for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//    dimensions
//      of the node or it requires the entire node and its subtree to be layed
//      out
//      (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the
//    information in node.style, which is treated as a read-only input. It is
//    responsible for
//    setting the layout.direction and layout.measuredDimensions fields for the
//    input node as well
//    as the layout.position and layout.lineIndex fields for its child nodes.
//    The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does
//    not include margins.
//
//    The spec describes four different layout modes: "fill available", "max
//    content", "min
//    content",
//    and "fit content". Of these, we don't use "min content" because we don't
//    support default
//    minimum main sizes (see above for details). Each of our measure modes maps
//    to a layout mode
//    from the spec (https://www.w3.org/TR/YG3-sizing/#terms):
//      - ABI31_0_0YGMeasureModeUndefined: max content
//      - ABI31_0_0YGMeasureModeExactly: fill available
//      - ABI31_0_0YGMeasureModeAtMost: fit content
//
//    When calling ABI31_0_0YGNodelayoutImpl and ABI31_0_0YGLayoutNodeInternal, if the caller
//    passes an available size of undefined then it must also pass a measure
//    mode of ABI31_0_0YGMeasureModeUndefined in that dimension.
//
static void ABI31_0_0YGNodelayoutImpl(
    const ABI31_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI31_0_0YGDirection ownerDirection,
    const ABI31_0_0YGMeasureMode widthMeasureMode,
    const ABI31_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const ABI31_0_0YGConfigRef config) {
  ABI31_0_0YGAssertWithNode(
      node,
      ABI31_0_0YGFloatIsUndefined(availableWidth)
          ? widthMeasureMode == ABI31_0_0YGMeasureModeUndefined
          : true,
      "availableWidth is indefinite so widthMeasureMode must be "
      "ABI31_0_0YGMeasureModeUndefined");
  ABI31_0_0YGAssertWithNode(
      node,
      ABI31_0_0YGFloatIsUndefined(availableHeight)
          ? heightMeasureMode == ABI31_0_0YGMeasureModeUndefined
          : true,
      "availableHeight is indefinite so heightMeasureMode must be "
      "ABI31_0_0YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const ABI31_0_0YGDirection direction = node->resolveDirection(ownerDirection);
  node->setLayoutDirection(direction);

  const ABI31_0_0YGFlexDirection flexRowDirection =
      ABI31_0_0YGResolveFlexDirection(ABI31_0_0YGFlexDirectionRow, direction);
  const ABI31_0_0YGFlexDirection flexColumnDirection =
      ABI31_0_0YGResolveFlexDirection(ABI31_0_0YGFlexDirectionColumn, direction);

  node->setLayoutMargin(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getLeadingMargin(flexRowDirection, ownerWidth)),
      ABI31_0_0YGEdgeStart);
  node->setLayoutMargin(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getTrailingMargin(flexRowDirection, ownerWidth)),
      ABI31_0_0YGEdgeEnd);
  node->setLayoutMargin(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getLeadingMargin(flexColumnDirection, ownerWidth)),
      ABI31_0_0YGEdgeTop);
  node->setLayoutMargin(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getTrailingMargin(flexColumnDirection, ownerWidth)),
      ABI31_0_0YGEdgeBottom);

  node->setLayoutBorder(node->getLeadingBorder(flexRowDirection), ABI31_0_0YGEdgeStart);
  node->setLayoutBorder(node->getTrailingBorder(flexRowDirection), ABI31_0_0YGEdgeEnd);
  node->setLayoutBorder(node->getLeadingBorder(flexColumnDirection), ABI31_0_0YGEdgeTop);
  node->setLayoutBorder(
      node->getTrailingBorder(flexColumnDirection), ABI31_0_0YGEdgeBottom);

  node->setLayoutPadding(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getLeadingPadding(flexRowDirection, ownerWidth)),
      ABI31_0_0YGEdgeStart);
  node->setLayoutPadding(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getTrailingPadding(flexRowDirection, ownerWidth)),
      ABI31_0_0YGEdgeEnd);
  node->setLayoutPadding(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getLeadingPadding(flexColumnDirection, ownerWidth)),
      ABI31_0_0YGEdgeTop);
  node->setLayoutPadding(
      ABI31_0_0YGUnwrapFloatOptional(
          node->getTrailingPadding(flexColumnDirection, ownerWidth)),
      ABI31_0_0YGEdgeBottom);

  if (node->getMeasure() != nullptr) {
    ABI31_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(
        node,
        availableWidth,
        availableHeight,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight);
    return;
  }

  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(node);
  if (childCount == 0) {
    ABI31_0_0YGNodeEmptyContainerSetMeasuredDimensions(
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
      ABI31_0_0YGNodeFixedSizeSetMeasuredDimensions(
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
  node->cloneChildrenIfNeeded();
  // Reset layout flags, as they could have changed.
  node->setLayoutHadOverflow(false);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const ABI31_0_0YGFlexDirection mainAxis =
      ABI31_0_0YGResolveFlexDirection(node->getStyle().flexDirection, direction);
  const ABI31_0_0YGFlexDirection crossAxis = ABI31_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI31_0_0YGFlexDirectionIsRow(mainAxis);
  const bool isNodeFlexWrap = node->getStyle().flexWrap != ABI31_0_0YGWrapNoWrap;

  const float mainAxisownerSize = isMainAxisRow ? ownerWidth : ownerHeight;
  const float crossAxisownerSize = isMainAxisRow ? ownerHeight : ownerWidth;

  const float leadingPaddingAndBorderCross = ABI31_0_0YGUnwrapFloatOptional(
      node->getLeadingPaddingAndBorder(crossAxis, ownerWidth));
  const float paddingAndBorderAxisMain =
      ABI31_0_0YGNodePaddingAndBorderForAxis(node, mainAxis, ownerWidth);
  const float paddingAndBorderAxisCross =
      ABI31_0_0YGNodePaddingAndBorderForAxis(node, crossAxis, ownerWidth);

  ABI31_0_0YGMeasureMode measureModeMainDim =
      isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  ABI31_0_0YGMeasureMode measureModeCrossDim =
      isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow = ABI31_0_0YGUnwrapFloatOptional(
      node->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, ownerWidth));
  const float marginAxisColumn = ABI31_0_0YGUnwrapFloatOptional(
      node->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, ownerWidth));

  const float minInnerWidth =
      ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
          node->getStyle().minDimensions[ABI31_0_0YGDimensionWidth], ownerWidth)) -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
          node->getStyle().maxDimensions[ABI31_0_0YGDimensionWidth], ownerWidth)) -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
          node->getStyle().minDimensions[ABI31_0_0YGDimensionHeight], ownerHeight)) -
      paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
          node->getStyle().maxDimensions[ABI31_0_0YGDimensionHeight], ownerHeight)) -
      paddingAndBorderAxisColumn;

  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS

  float availableInnerWidth = ABI31_0_0YGNodeCalculateAvailableInnerDim(
      node, ABI31_0_0YGFlexDirectionRow, availableWidth, ownerWidth);
  float availableInnerHeight = ABI31_0_0YGNodeCalculateAvailableInnerDim(
      node, ABI31_0_0YGFlexDirectionColumn, availableHeight, ownerHeight);

  float availableInnerMainDim =
      isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim =
      isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  float totalOuterFlexBasis = 0;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM

  ABI31_0_0YGNodeComputeFlexBasisForChildren(
      node,
      availableInnerWidth,
      availableInnerHeight,
      widthMeasureMode,
      heightMeasureMode,
      direction,
      mainAxis,
      config,
      performLayout,
      totalOuterFlexBasis);

  const bool flexBasisOverflows = measureModeMainDim == ABI31_0_0YGMeasureModeUndefined
      ? false
      : totalOuterFlexBasis > availableInnerMainDim;
  if (isNodeFlexWrap && flexBasisOverflows &&
      measureModeMainDim == ABI31_0_0YGMeasureModeAtMost) {
    measureModeMainDim = ABI31_0_0YGMeasureModeExactly;
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
  ABI31_0_0YGCollectFlexItemsRowValues collectedFlexItemsValues;
  for (; endOfLineIndex < childCount;
       lineCount++, startOfLineIndex = endOfLineIndex) {
    collectedFlexItemsValues = ABI31_0_0YGCalculateCollectFlexItemsRowValues(
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
        !performLayout && measureModeCrossDim == ABI31_0_0YGMeasureModeExactly;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated.
    // If the main dimension size isn't known, it is computed based on
    // the line length, so there's no more space left to distribute.

    bool sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't
    // violate min and max
    if (measureModeMainDim != ABI31_0_0YGMeasureModeExactly) {
      if (!ABI31_0_0YGFloatIsUndefined(minInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine <
              minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (
          !ABI31_0_0YGFloatIsUndefined(maxInnerMainDim) &&
          collectedFlexItemsValues.sizeConsumedOnCurrentLine >
              maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        if (!node->getConfig()->useLegacyStretchBehaviour &&
            ((ABI31_0_0YGFloatIsUndefined(
                  collectedFlexItemsValues.totalFlexGrowFactors) &&
              collectedFlexItemsValues.totalFlexGrowFactors == 0) ||
             (ABI31_0_0YGFloatIsUndefined(node->resolveFlexGrow()) &&
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

    if (!sizeBasedOnContent && !ABI31_0_0YGFloatIsUndefined(availableInnerMainDim)) {
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
      ABI31_0_0YGResolveFlexibleLength(
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
          config);
    }

    node->setLayoutHadOverflow(
        node->getLayout().hadOverflow |
        (collectedFlexItemsValues.remainingFreeSpace < 0));

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis.
    // Their dimensions are also set in the cross axis with the exception of
    // items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    ABI31_0_0YGJustifyMainAxis(
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
        performLayout);

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI31_0_0YGMeasureModeUndefined ||
        measureModeCrossDim == ABI31_0_0YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
          ABI31_0_0YGNodeBoundAxis(
              node,
              crossAxis,
              collectedFlexItemsValues.crossDim + paddingAndBorderAxisCross,
              crossAxisownerSize,
              ownerWidth) -
          paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI31_0_0YGMeasureModeExactly) {
      collectedFlexItemsValues.crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    collectedFlexItemsValues.crossDim =
        ABI31_0_0YGNodeBoundAxis(
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
        const ABI31_0_0YGNodeRef child = node->getChild(i);
        if (child->getStyle().display == ABI31_0_0YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType == ABI31_0_0YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right set, override
          // all the previously computed positions to set it correctly.
          const bool isChildLeadingPosDefined =
              child->isLeadingPositionDefined(crossAxis);
          if (isChildLeadingPosDefined) {
            child->setLayoutPosition(
                ABI31_0_0YGUnwrapFloatOptional(child->getLeadingPosition(
                    crossAxis, availableInnerCrossDim)) +
                    node->getLeadingBorder(crossAxis) +
                    ABI31_0_0YGUnwrapFloatOptional(child->getLeadingMargin(
                        crossAxis, availableInnerWidth)),
                pos[crossAxis]);
          }
          // If leading position is not defined or calculations result in Nan,
          // default to border + margin
          if (!isChildLeadingPosDefined ||
              ABI31_0_0YGFloatIsUndefined(child->getLayout().position[pos[crossAxis]])) {
            child->setLayoutPosition(
                node->getLeadingBorder(crossAxis) +
                    ABI31_0_0YGUnwrapFloatOptional(child->getLeadingMargin(
                        crossAxis, availableInnerWidth)),
                pos[crossAxis]);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (owner) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const ABI31_0_0YGAlign alignItem = ABI31_0_0YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == ABI31_0_0YGAlignStretch &&
              child->marginLeadingValue(crossAxis).unit != ABI31_0_0YGUnitAuto &&
              child->marginTrailingValue(crossAxis).unit != ABI31_0_0YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!ABI31_0_0YGNodeIsStyleDimDefined(
                    child, crossAxis, availableInnerCrossDim)) {
              float childMainSize =
                  child->getLayout().measuredDimensions[dim[mainAxis]];
              float childCrossSize =
                  !child->getStyle().aspectRatio.isUndefined()
                  ? ((ABI31_0_0YGUnwrapFloatOptional(child->getMarginForAxis(
                          crossAxis, availableInnerWidth)) +
                      (isMainAxisRow ? childMainSize /
                               child->getStyle().aspectRatio.getValue()
                                     : childMainSize *
                               child->getStyle().aspectRatio.getValue())))
                  : collectedFlexItemsValues.crossDim;

              childMainSize += ABI31_0_0YGUnwrapFloatOptional(
                  child->getMarginForAxis(mainAxis, availableInnerWidth));

              ABI31_0_0YGMeasureMode childMainMeasureMode = ABI31_0_0YGMeasureModeExactly;
              ABI31_0_0YGMeasureMode childCrossMeasureMode = ABI31_0_0YGMeasureModeExactly;
              ABI31_0_0YGConstrainMaxSizeForMode(
                  child,
                  mainAxis,
                  availableInnerMainDim,
                  availableInnerWidth,
                  &childMainMeasureMode,
                  &childMainSize);
              ABI31_0_0YGConstrainMaxSizeForMode(
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

              const ABI31_0_0YGMeasureMode childWidthMeasureMode =
                  ABI31_0_0YGFloatIsUndefined(childWidth) ? ABI31_0_0YGMeasureModeUndefined
                                                 : ABI31_0_0YGMeasureModeExactly;
              const ABI31_0_0YGMeasureMode childHeightMeasureMode =
                  ABI31_0_0YGFloatIsUndefined(childHeight) ? ABI31_0_0YGMeasureModeUndefined
                                                  : ABI31_0_0YGMeasureModeExactly;

              ABI31_0_0YGLayoutNodeInternal(
                  child,
                  childWidth,
                  childHeight,
                  direction,
                  childWidthMeasureMode,
                  childHeightMeasureMode,
                  availableInnerWidth,
                  availableInnerHeight,
                  true,
                  "stretch",
                  config);
            }
          } else {
            const float remainingCrossDim = containerCrossAxis -
                ABI31_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (child->marginLeadingValue(crossAxis).unit == ABI31_0_0YGUnitAuto &&
                child->marginTrailingValue(crossAxis).unit == ABI31_0_0YGUnitAuto) {
              leadingCrossDim += ABI31_0_0YGFloatMax(0.0f, remainingCrossDim / 2);
            } else if (
                child->marginTrailingValue(crossAxis).unit == ABI31_0_0YGUnitAuto) {
              // No-Op
            } else if (
                child->marginLeadingValue(crossAxis).unit == ABI31_0_0YGUnitAuto) {
              leadingCrossDim += ABI31_0_0YGFloatMax(0.0f, remainingCrossDim);
            } else if (alignItem == ABI31_0_0YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == ABI31_0_0YGAlignCenter) {
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
        ABI31_0_0YGFloatMax(maxLineMainDim, collectedFlexItemsValues.mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (performLayout && (lineCount > 1 || ABI31_0_0YGIsBaselineLayout(node)) &&
      !ABI31_0_0YGFloatIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim =
        availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->getStyle().alignContent) {
      case ABI31_0_0YGAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case ABI31_0_0YGAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case ABI31_0_0YGAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = remainingAlignContentDim / lineCount;
        }
        break;
      case ABI31_0_0YGAlignSpaceAround:
        if (availableInnerCrossDim > totalLineCrossDim) {
          currentLead += remainingAlignContentDim / (2 * lineCount);
          if (lineCount > 1) {
            crossDimLead = remainingAlignContentDim / lineCount;
          }
        } else {
          currentLead += remainingAlignContentDim / 2;
        }
        break;
      case ABI31_0_0YGAlignSpaceBetween:
        if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
          crossDimLead = remainingAlignContentDim / (lineCount - 1);
        }
        break;
      case ABI31_0_0YGAlignAuto:
      case ABI31_0_0YGAlignFlexStart:
      case ABI31_0_0YGAlignBaseline:
        break;
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
        const ABI31_0_0YGNodeRef child = node->getChild(ii);
        if (child->getStyle().display == ABI31_0_0YGDisplayNone) {
          continue;
        }
        if (child->getStyle().positionType == ABI31_0_0YGPositionTypeRelative) {
          if (child->getLineIndex() != i) {
            break;
          }
          if (ABI31_0_0YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = ABI31_0_0YGFloatMax(
                lineHeight,
                child->getLayout().measuredDimensions[dim[crossAxis]] +
                    ABI31_0_0YGUnwrapFloatOptional(child->getMarginForAxis(
                        crossAxis, availableInnerWidth)));
          }
          if (ABI31_0_0YGNodeAlignItem(node, child) == ABI31_0_0YGAlignBaseline) {
            const float ascent = ABI31_0_0YGBaseline(child) +
                ABI31_0_0YGUnwrapFloatOptional(child->getLeadingMargin(
                    ABI31_0_0YGFlexDirectionColumn, availableInnerWidth));
            const float descent =
                child->getLayout().measuredDimensions[ABI31_0_0YGDimensionHeight] +
                ABI31_0_0YGUnwrapFloatOptional(child->getMarginForAxis(
                    ABI31_0_0YGFlexDirectionColumn, availableInnerWidth)) -
                ascent;
            maxAscentForCurrentLine =
                ABI31_0_0YGFloatMax(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine =
                ABI31_0_0YGFloatMax(maxDescentForCurrentLine, descent);
            lineHeight = ABI31_0_0YGFloatMax(
                lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const ABI31_0_0YGNodeRef child = node->getChild(ii);
          if (child->getStyle().display == ABI31_0_0YGDisplayNone) {
            continue;
          }
          if (child->getStyle().positionType == ABI31_0_0YGPositionTypeRelative) {
            switch (ABI31_0_0YGNodeAlignItem(node, child)) {
              case ABI31_0_0YGAlignFlexStart: {
                child->setLayoutPosition(
                    currentLead +
                        ABI31_0_0YGUnwrapFloatOptional(child->getLeadingMargin(
                            crossAxis, availableInnerWidth)),
                    pos[crossAxis]);
                break;
              }
              case ABI31_0_0YGAlignFlexEnd: {
                child->setLayoutPosition(
                    currentLead + lineHeight -
                        ABI31_0_0YGUnwrapFloatOptional(child->getTrailingMargin(
                            crossAxis, availableInnerWidth)) -
                        child->getLayout().measuredDimensions[dim[crossAxis]],
                    pos[crossAxis]);
                break;
              }
              case ABI31_0_0YGAlignCenter: {
                float childHeight =
                    child->getLayout().measuredDimensions[dim[crossAxis]];

                child->setLayoutPosition(
                    currentLead + (lineHeight - childHeight) / 2,
                    pos[crossAxis]);
                break;
              }
              case ABI31_0_0YGAlignStretch: {
                child->setLayoutPosition(
                    currentLead +
                        ABI31_0_0YGUnwrapFloatOptional(child->getLeadingMargin(
                            crossAxis, availableInnerWidth)),
                    pos[crossAxis]);

                // Remeasure child with the line height as it as been only
                // measured with the owners height yet.
                if (!ABI31_0_0YGNodeIsStyleDimDefined(
                        child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth = isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[ABI31_0_0YGDimensionWidth] +
                         ABI31_0_0YGUnwrapFloatOptional(child->getMarginForAxis(
                             mainAxis, availableInnerWidth)))
                      : lineHeight;

                  const float childHeight = !isMainAxisRow
                      ? (child->getLayout()
                             .measuredDimensions[ABI31_0_0YGDimensionHeight] +
                         ABI31_0_0YGUnwrapFloatOptional(child->getMarginForAxis(
                             crossAxis, availableInnerWidth)))
                      : lineHeight;

                  if (!(ABI31_0_0YGFloatsEqual(
                            childWidth,
                            child->getLayout()
                                .measuredDimensions[ABI31_0_0YGDimensionWidth]) &&
                        ABI31_0_0YGFloatsEqual(
                            childHeight,
                            child->getLayout()
                                .measuredDimensions[ABI31_0_0YGDimensionHeight]))) {
                    ABI31_0_0YGLayoutNodeInternal(
                        child,
                        childWidth,
                        childHeight,
                        direction,
                        ABI31_0_0YGMeasureModeExactly,
                        ABI31_0_0YGMeasureModeExactly,
                        availableInnerWidth,
                        availableInnerHeight,
                        true,
                        "multiline-stretch",
                        config);
                  }
                }
                break;
              }
              case ABI31_0_0YGAlignBaseline: {
                child->setLayoutPosition(
                    currentLead + maxAscentForCurrentLine - ABI31_0_0YGBaseline(child) +
                        ABI31_0_0YGUnwrapFloatOptional(child->getLeadingPosition(
                            ABI31_0_0YGFlexDirectionColumn, availableInnerCrossDim)),
                    ABI31_0_0YGEdgeTop);

                break;
              }
              case ABI31_0_0YGAlignAuto:
              case ABI31_0_0YGAlignSpaceBetween:
              case ABI31_0_0YGAlignSpaceAround:
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
      ABI31_0_0YGNodeBoundAxis(
          node,
          ABI31_0_0YGFlexDirectionRow,
          availableWidth - marginAxisRow,
          ownerWidth,
          ownerWidth),
      ABI31_0_0YGDimensionWidth);

  node->setLayoutMeasuredDimension(
      ABI31_0_0YGNodeBoundAxis(
          node,
          ABI31_0_0YGFlexDirectionColumn,
          availableHeight - marginAxisColumn,
          ownerHeight,
          ownerWidth),
      ABI31_0_0YGDimensionHeight);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI31_0_0YGMeasureModeUndefined ||
      (node->getStyle().overflow != ABI31_0_0YGOverflowScroll &&
       measureModeMainDim == ABI31_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node, mainAxis, maxLineMainDim, mainAxisownerSize, ownerWidth),
        dim[mainAxis]);

  } else if (
      measureModeMainDim == ABI31_0_0YGMeasureModeAtMost &&
      node->getStyle().overflow == ABI31_0_0YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        ABI31_0_0YGFloatMax(
            ABI31_0_0YGFloatMin(
                availableInnerMainDim + paddingAndBorderAxisMain,
                ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGNodeBoundAxisWithinMinAndMax(
                    node, mainAxis, maxLineMainDim, mainAxisownerSize))),
            paddingAndBorderAxisMain),
        dim[mainAxis]);
  }

  if (measureModeCrossDim == ABI31_0_0YGMeasureModeUndefined ||
      (node->getStyle().overflow != ABI31_0_0YGOverflowScroll &&
       measureModeCrossDim == ABI31_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.

    node->setLayoutMeasuredDimension(
        ABI31_0_0YGNodeBoundAxis(
            node,
            crossAxis,
            totalLineCrossDim + paddingAndBorderAxisCross,
            crossAxisownerSize,
            ownerWidth),
        dim[crossAxis]);

  } else if (
      measureModeCrossDim == ABI31_0_0YGMeasureModeAtMost &&
      node->getStyle().overflow == ABI31_0_0YGOverflowScroll) {
    node->setLayoutMeasuredDimension(
        ABI31_0_0YGFloatMax(
            ABI31_0_0YGFloatMin(
                availableInnerCrossDim + paddingAndBorderAxisCross,
                ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGNodeBoundAxisWithinMinAndMax(
                    node,
                    crossAxis,
                    totalLineCrossDim + paddingAndBorderAxisCross,
                    crossAxisownerSize))),
            paddingAndBorderAxisCross),
        dim[crossAxis]);
  }

  // As we only wrapped in normal direction yet, we need to reverse the
  // positions on wrap-reverse.
  if (performLayout && node->getStyle().flexWrap == ABI31_0_0YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI31_0_0YGNodeRef child = ABI31_0_0YGNodeGetChild(node, i);
      if (child->getStyle().positionType == ABI31_0_0YGPositionTypeRelative) {
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
      if (child->getStyle().positionType != ABI31_0_0YGPositionTypeAbsolute) {
        continue;
      }
      ABI31_0_0YGNodeAbsoluteLayoutChild(
          node,
          child,
          availableInnerWidth,
          isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
          availableInnerHeight,
          direction,
          config);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos = mainAxis == ABI31_0_0YGFlexDirectionRowReverse ||
        mainAxis == ABI31_0_0YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos = crossAxis == ABI31_0_0YGFlexDirectionRowReverse ||
        crossAxis == ABI31_0_0YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI31_0_0YGNodeRef child = node->getChild(i);
        if (child->getStyle().display == ABI31_0_0YGDisplayNone) {
          continue;
        }
        if (needsMainTrailingPos) {
          ABI31_0_0YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          ABI31_0_0YGNodeSetChildTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

uint32_t gDepth = 0;
bool gPrintTree = false;
bool gPrintChanges = false;
bool gPrintSkips = false;

static const char* spacer =
    "                                                            ";

static const char* ABI31_0_0YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char* ABI31_0_0YGMeasureModeName(
    const ABI31_0_0YGMeasureMode mode,
    const bool performLayout) {
  const char* kMeasureModeNames[ABI31_0_0YGMeasureModeCount] = {
      "UNDEFINED", "ABI31_0_0EXACTLY", "AT_MOST"};
  const char* kLayoutModeNames[ABI31_0_0YGMeasureModeCount] = {"LAY_UNDEFINED",
                                                      "LAY_EXACTLY",
                                                      "LAY_AT_"
                                                      "MOST"};

  if (mode >= ABI31_0_0YGMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool ABI31_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
    ABI31_0_0YGMeasureMode sizeMode,
    float size,
    float lastComputedSize) {
  return sizeMode == ABI31_0_0YGMeasureModeExactly &&
      ABI31_0_0YGFloatsEqual(size, lastComputedSize);
}

static inline bool ABI31_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
    ABI31_0_0YGMeasureMode sizeMode,
    float size,
    ABI31_0_0YGMeasureMode lastSizeMode,
    float lastComputedSize) {
  return sizeMode == ABI31_0_0YGMeasureModeAtMost &&
      lastSizeMode == ABI31_0_0YGMeasureModeUndefined &&
      (size >= lastComputedSize || ABI31_0_0YGFloatsEqual(size, lastComputedSize));
}

static inline bool ABI31_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
    ABI31_0_0YGMeasureMode sizeMode,
    float size,
    ABI31_0_0YGMeasureMode lastSizeMode,
    float lastSize,
    float lastComputedSize) {
  return lastSizeMode == ABI31_0_0YGMeasureModeAtMost &&
      sizeMode == ABI31_0_0YGMeasureModeAtMost && !ABI31_0_0YGFloatIsUndefined(lastSize) &&
      !ABI31_0_0YGFloatIsUndefined(size) && !ABI31_0_0YGFloatIsUndefined(lastComputedSize) &&
      lastSize > size &&
      (lastComputedSize <= size || ABI31_0_0YGFloatsEqual(size, lastComputedSize));
}

float ABI31_0_0YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor) {
  float scaledValue = value * pointScaleFactor;
  float fractial = fmodf(scaledValue, 1.0f);
  if (ABI31_0_0YGFloatsEqual(fractial, 0)) {
    // First we check if the value is already rounded
    scaledValue = scaledValue - fractial;
  } else if (ABI31_0_0YGFloatsEqual(fractial, 1.0f)) {
    scaledValue = scaledValue - fractial + 1.0f;
  } else if (forceCeil) {
    // Next we check if we need to use forced rounding
    scaledValue = scaledValue - fractial + 1.0f;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    // Finally we just round the value
    scaledValue = scaledValue - fractial +
        (!ABI31_0_0YGFloatIsUndefined(fractial) &&
                 (fractial > 0.5f || ABI31_0_0YGFloatsEqual(fractial, 0.5f))
             ? 1.0f
             : 0.0f);
  }
  return (ABI31_0_0YGFloatIsUndefined(scaledValue) ||
          ABI31_0_0YGFloatIsUndefined(pointScaleFactor))
      ? ABI31_0_0YGUndefined
      : scaledValue / pointScaleFactor;
}

bool ABI31_0_0YGNodeCanUseCachedMeasurement(
    const ABI31_0_0YGMeasureMode widthMode,
    const float width,
    const ABI31_0_0YGMeasureMode heightMode,
    const float height,
    const ABI31_0_0YGMeasureMode lastWidthMode,
    const float lastWidth,
    const ABI31_0_0YGMeasureMode lastHeightMode,
    const float lastHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const ABI31_0_0YGConfigRef config) {
  if ((!ABI31_0_0YGFloatIsUndefined(lastComputedHeight) && lastComputedHeight < 0) ||
      (!ABI31_0_0YGFloatIsUndefined(lastComputedWidth) && lastComputedWidth < 0)) {
    return false;
  }
  bool useRoundedComparison =
      config != nullptr && config->pointScaleFactor != 0;
  const float effectiveWidth = useRoundedComparison
      ? ABI31_0_0YGRoundValueToPixelGrid(width, config->pointScaleFactor, false, false)
      : width;
  const float effectiveHeight = useRoundedComparison
      ? ABI31_0_0YGRoundValueToPixelGrid(height, config->pointScaleFactor, false, false)
      : height;
  const float effectiveLastWidth = useRoundedComparison
      ? ABI31_0_0YGRoundValueToPixelGrid(
            lastWidth, config->pointScaleFactor, false, false)
      : lastWidth;
  const float effectiveLastHeight = useRoundedComparison
      ? ABI31_0_0YGRoundValueToPixelGrid(
            lastHeight, config->pointScaleFactor, false, false)
      : lastHeight;

  const bool hasSameWidthSpec = lastWidthMode == widthMode &&
      ABI31_0_0YGFloatsEqual(effectiveLastWidth, effectiveWidth);
  const bool hasSameHeightSpec = lastHeightMode == heightMode &&
      ABI31_0_0YGFloatsEqual(effectiveLastHeight, effectiveHeight);

  const bool widthIsCompatible =
      hasSameWidthSpec ||
      ABI31_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
          widthMode, width - marginRow, lastComputedWidth) ||
      ABI31_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
          widthMode, width - marginRow, lastWidthMode, lastComputedWidth) ||
      ABI31_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode,
          width - marginRow,
          lastWidthMode,
          lastWidth,
          lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec ||
      ABI31_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(
          heightMode, height - marginColumn, lastComputedHeight) ||
      ABI31_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(
          heightMode,
          height - marginColumn,
          lastHeightMode,
          lastComputedHeight) ||
      ABI31_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode,
          height - marginColumn,
          lastHeightMode,
          lastHeight,
          lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the ABI31_0_0YGNodelayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as ABI31_0_0YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool ABI31_0_0YGLayoutNodeInternal(
    const ABI31_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI31_0_0YGDirection ownerDirection,
    const ABI31_0_0YGMeasureMode widthMeasureMode,
    const ABI31_0_0YGMeasureMode heightMeasureMode,
    const float ownerWidth,
    const float ownerHeight,
    const bool performLayout,
    const char* reason,
    const ABI31_0_0YGConfigRef config) {
  ABI31_0_0YGLayout* layout = &node->getLayout();

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty() && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastOwnerDirection != ownerDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (ABI31_0_0YGMeasureMode)-1;
    layout->cachedLayout.heightMeasureMode = (ABI31_0_0YGMeasureMode)-1;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  ABI31_0_0YGCachedMeasurement* cachedResults = nullptr;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions
  // and dimensions for nodes in the subtree. The algorithm assumes that each
  // node
  // gets layed out a maximum of one time per tree layout, but multiple
  // measurements
  // may be required to resolve all of the flex dimensions.
  // We handle nodes with measure functions specially here because they are the
  // most
  // expensive to measure, so it's worth avoiding redundant measurements if at
  // all possible.
  if (node->getMeasure() != nullptr) {
    const float marginAxisRow = ABI31_0_0YGUnwrapFloatOptional(
        node->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, ownerWidth));
    const float marginAxisColumn = ABI31_0_0YGUnwrapFloatOptional(
        node->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, ownerWidth));

    // First, try to use the layout cache.
    if (ABI31_0_0YGNodeCanUseCachedMeasurement(
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
        if (ABI31_0_0YGNodeCanUseCachedMeasurement(
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
    if (ABI31_0_0YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        ABI31_0_0YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (ABI31_0_0YGFloatsEqual(
              layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          ABI31_0_0YGFloatsEqual(
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
    layout->measuredDimensions[ABI31_0_0YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI31_0_0YGDimensionHeight] =
        cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      ABI31_0_0YGLog(
          node,
          ABI31_0_0YGLogLevelVerbose,
          "%s%d.{[skipped] ",
          ABI31_0_0YGSpacer(gDepth),
          gDepth);
      if (node->getPrintFunc() != nullptr) {
        node->getPrintFunc()(node);
      }
      ABI31_0_0YGLog(
          node,
          ABI31_0_0YGLogLevelVerbose,
          "wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
          ABI31_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI31_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          cachedResults->computedWidth,
          cachedResults->computedHeight,
          reason);
    }
  } else {
    if (gPrintChanges) {
      ABI31_0_0YGLog(
          node,
          ABI31_0_0YGLogLevelVerbose,
          "%s%d.{%s",
          ABI31_0_0YGSpacer(gDepth),
          gDepth,
          needToVisitNode ? "*" : "");
      if (node->getPrintFunc() != nullptr) {
        node->getPrintFunc()(node);
      }
      ABI31_0_0YGLog(
          node,
          ABI31_0_0YGLogLevelVerbose,
          "wm: %s, hm: %s, aw: %f ah: %f %s\n",
          ABI31_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI31_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          availableWidth,
          availableHeight,
          reason);
    }

    ABI31_0_0YGNodelayoutImpl(
        node,
        availableWidth,
        availableHeight,
        ownerDirection,
        widthMeasureMode,
        heightMeasureMode,
        ownerWidth,
        ownerHeight,
        performLayout,
        config);

    if (gPrintChanges) {
      ABI31_0_0YGLog(
          node,
          ABI31_0_0YGLogLevelVerbose,
          "%s%d.}%s",
          ABI31_0_0YGSpacer(gDepth),
          gDepth,
          needToVisitNode ? "*" : "");
      if (node->getPrintFunc() != nullptr) {
        node->getPrintFunc()(node);
      }
      ABI31_0_0YGLog(
          node,
          ABI31_0_0YGLogLevelVerbose,
          "wm: %s, hm: %s, d: (%f, %f) %s\n",
          ABI31_0_0YGMeasureModeName(widthMeasureMode, performLayout),
          ABI31_0_0YGMeasureModeName(heightMeasureMode, performLayout),
          layout->measuredDimensions[ABI31_0_0YGDimensionWidth],
          layout->measuredDimensions[ABI31_0_0YGDimensionHeight],
          reason);
    }

    layout->lastOwnerDirection = ownerDirection;

    if (cachedResults == nullptr) {
      if (layout->nextCachedMeasurementsIndex == ABI31_0_0YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          ABI31_0_0YGLog(node, ABI31_0_0YGLogLevelVerbose, "Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI31_0_0YGCachedMeasurement* newCacheEntry;
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
          layout->measuredDimensions[ABI31_0_0YGDimensionWidth];
      newCacheEntry->computedHeight =
          layout->measuredDimensions[ABI31_0_0YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[ABI31_0_0YGDimensionWidth],
        ABI31_0_0YGDimensionWidth);
    node->setLayoutDimension(
        node->getLayout().measuredDimensions[ABI31_0_0YGDimensionHeight],
        ABI31_0_0YGDimensionHeight);

    node->setHasNewLayout(true);
    node->setDirty(false);
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == nullptr);
}

void ABI31_0_0YGConfigSetPointScaleFactor(
    const ABI31_0_0YGConfigRef config,
    const float pixelsInPoint) {
  ABI31_0_0YGAssertWithConfig(
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

static void ABI31_0_0YGRoundToPixelGrid(
    const ABI31_0_0YGNodeRef node,
    const float pointScaleFactor,
    const float absoluteLeft,
    const float absoluteTop) {
  if (pointScaleFactor == 0.0f) {
    return;
  }

  const float nodeLeft = node->getLayout().position[ABI31_0_0YGEdgeLeft];
  const float nodeTop = node->getLayout().position[ABI31_0_0YGEdgeTop];

  const float nodeWidth = node->getLayout().dimensions[ABI31_0_0YGDimensionWidth];
  const float nodeHeight = node->getLayout().dimensions[ABI31_0_0YGDimensionHeight];

  const float absoluteNodeLeft = absoluteLeft + nodeLeft;
  const float absoluteNodeTop = absoluteTop + nodeTop;

  const float absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const float absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  // If a node has a custom measure function we never want to round down its
  // size as this could lead to unwanted text truncation.
  const bool textRounding = node->getNodeType() == ABI31_0_0YGNodeTypeText;

  node->setLayoutPosition(
      ABI31_0_0YGRoundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding),
      ABI31_0_0YGEdgeLeft);

  node->setLayoutPosition(
      ABI31_0_0YGRoundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding),
      ABI31_0_0YGEdgeTop);

  // We multiply dimension by scale factor and if the result is close to the
  // whole number, we don't have any fraction To verify if the result is close
  // to whole number we want to check both floor and ceil numbers
  const bool hasFractionalWidth =
      !ABI31_0_0YGFloatsEqual(fmodf(nodeWidth * pointScaleFactor, 1.0), 0) &&
      !ABI31_0_0YGFloatsEqual(fmodf(nodeWidth * pointScaleFactor, 1.0), 1.0);
  const bool hasFractionalHeight =
      !ABI31_0_0YGFloatsEqual(fmodf(nodeHeight * pointScaleFactor, 1.0), 0) &&
      !ABI31_0_0YGFloatsEqual(fmodf(nodeHeight * pointScaleFactor, 1.0), 1.0);

  node->setLayoutDimension(
      ABI31_0_0YGRoundValueToPixelGrid(
          absoluteNodeRight,
          pointScaleFactor,
          (textRounding && hasFractionalWidth),
          (textRounding && !hasFractionalWidth)) -
          ABI31_0_0YGRoundValueToPixelGrid(
              absoluteNodeLeft, pointScaleFactor, false, textRounding),
      ABI31_0_0YGDimensionWidth);

  node->setLayoutDimension(
      ABI31_0_0YGRoundValueToPixelGrid(
          absoluteNodeBottom,
          pointScaleFactor,
          (textRounding && hasFractionalHeight),
          (textRounding && !hasFractionalHeight)) -
          ABI31_0_0YGRoundValueToPixelGrid(
              absoluteNodeTop, pointScaleFactor, false, textRounding),
      ABI31_0_0YGDimensionHeight);

  const uint32_t childCount = ABI31_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    ABI31_0_0YGRoundToPixelGrid(
        ABI31_0_0YGNodeGetChild(node, i),
        pointScaleFactor,
        absoluteNodeLeft,
        absoluteNodeTop);
  }
}

void ABI31_0_0YGNodeCalculateLayout(
    const ABI31_0_0YGNodeRef node,
    const float ownerWidth,
    const float ownerHeight,
    const ABI31_0_0YGDirection ownerDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;
  node->resolveDimension();
  float width = ABI31_0_0YGUndefined;
  ABI31_0_0YGMeasureMode widthMeasureMode = ABI31_0_0YGMeasureModeUndefined;
  if (ABI31_0_0YGNodeIsStyleDimDefined(node, ABI31_0_0YGFlexDirectionRow, ownerWidth)) {
    width = ABI31_0_0YGUnwrapFloatOptional(
        ABI31_0_0YGResolveValue(
            node->getResolvedDimension(dim[ABI31_0_0YGFlexDirectionRow]), ownerWidth) +
        node->getMarginForAxis(ABI31_0_0YGFlexDirectionRow, ownerWidth));
    widthMeasureMode = ABI31_0_0YGMeasureModeExactly;
  } else if (!ABI31_0_0YGResolveValue(
                  node->getStyle().maxDimensions[ABI31_0_0YGDimensionWidth], ownerWidth)
                  .isUndefined()) {
    width = ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
        node->getStyle().maxDimensions[ABI31_0_0YGDimensionWidth], ownerWidth));
    widthMeasureMode = ABI31_0_0YGMeasureModeAtMost;
  } else {
    width = ownerWidth;
    widthMeasureMode = ABI31_0_0YGFloatIsUndefined(width) ? ABI31_0_0YGMeasureModeUndefined
                                                 : ABI31_0_0YGMeasureModeExactly;
  }

  float height = ABI31_0_0YGUndefined;
  ABI31_0_0YGMeasureMode heightMeasureMode = ABI31_0_0YGMeasureModeUndefined;
  if (ABI31_0_0YGNodeIsStyleDimDefined(node, ABI31_0_0YGFlexDirectionColumn, ownerHeight)) {
    height = ABI31_0_0YGUnwrapFloatOptional(
        ABI31_0_0YGResolveValue(
            node->getResolvedDimension(dim[ABI31_0_0YGFlexDirectionColumn]),
            ownerHeight) +
        node->getMarginForAxis(ABI31_0_0YGFlexDirectionColumn, ownerWidth));
    heightMeasureMode = ABI31_0_0YGMeasureModeExactly;
  } else if (!ABI31_0_0YGResolveValue(
                  node->getStyle().maxDimensions[ABI31_0_0YGDimensionHeight],
                  ownerHeight)
                  .isUndefined()) {
    height = ABI31_0_0YGUnwrapFloatOptional(ABI31_0_0YGResolveValue(
        node->getStyle().maxDimensions[ABI31_0_0YGDimensionHeight], ownerHeight));
    heightMeasureMode = ABI31_0_0YGMeasureModeAtMost;
  } else {
    height = ownerHeight;
    heightMeasureMode = ABI31_0_0YGFloatIsUndefined(height) ? ABI31_0_0YGMeasureModeUndefined
                                                   : ABI31_0_0YGMeasureModeExactly;
  }
  if (ABI31_0_0YGLayoutNodeInternal(
          node,
          width,
          height,
          ownerDirection,
          widthMeasureMode,
          heightMeasureMode,
          ownerWidth,
          ownerHeight,
          true,
          "initial",
          node->getConfig())) {
    node->setPosition(
        node->getLayout().direction, ownerWidth, ownerHeight, ownerWidth);
    ABI31_0_0YGRoundToPixelGrid(node, node->getConfig()->pointScaleFactor, 0.0f, 0.0f);

    if (gPrintTree) {
      ABI31_0_0YGNodePrint(
          node,
          (ABI31_0_0YGPrintOptions)(
              ABI31_0_0YGPrintOptionsLayout | ABI31_0_0YGPrintOptionsChildren |
              ABI31_0_0YGPrintOptionsStyle));
    }
  }

  // We want to get rid off `useLegacyStretchBehaviour` from ABI31_0_0YGConfig. But we
  // aren't sure whether client's of yoga have gotten rid off this flag or not.
  // So logging this in ABI31_0_0YGLayout would help to find out the call sites depending
  // on this flag. This check would be removed once we are sure no one is
  // dependent on this flag anymore. The flag
  // `shouldDiffLayoutWithoutLegacyStretchBehaviour` in ABI31_0_0YGConfig will help to
  // run experiments.
  if (node->getConfig()->shouldDiffLayoutWithoutLegacyStretchBehaviour &&
      node->didUseLegacyFlag()) {
    const ABI31_0_0YGNodeRef originalNode = ABI31_0_0YGNodeDeepClone(node);
    originalNode->resolveDimension();
    // Recursively mark nodes as dirty
    originalNode->markDirtyAndPropogateDownwards();
    gCurrentGenerationCount++;
    // Rerun the layout, and calculate the diff
    originalNode->setAndPropogateUseLegacyFlag(false);
    if (ABI31_0_0YGLayoutNodeInternal(
            originalNode,
            width,
            height,
            ownerDirection,
            widthMeasureMode,
            heightMeasureMode,
            ownerWidth,
            ownerHeight,
            true,
            "initial",
            originalNode->getConfig())) {
      originalNode->setPosition(
          originalNode->getLayout().direction,
          ownerWidth,
          ownerHeight,
          ownerWidth);
      ABI31_0_0YGRoundToPixelGrid(
          originalNode,
          originalNode->getConfig()->pointScaleFactor,
          0.0f,
          0.0f);

      // Set whether the two layouts are different or not.
      node->setLayoutDoesLegacyFlagAffectsLayout(
          !originalNode->isLayoutTreeEqualToNode(*node));

      if (gPrintTree) {
        ABI31_0_0YGNodePrint(
            originalNode,
            (ABI31_0_0YGPrintOptions)(
                ABI31_0_0YGPrintOptionsLayout | ABI31_0_0YGPrintOptionsChildren |
                ABI31_0_0YGPrintOptionsStyle));
      }
    }
    ABI31_0_0YGConfigFreeRecursive(originalNode);
    ABI31_0_0YGNodeFreeRecursive(originalNode);
  }
}

void ABI31_0_0YGConfigSetLogger(const ABI31_0_0YGConfigRef config, ABI31_0_0YGLogger logger) {
  if (logger != nullptr) {
    config->logger = logger;
  } else {
#ifdef ANDROID
    config->logger = &ABI31_0_0YGAndroidLog;
#else
    config->logger = &ABI31_0_0YGDefaultLog;
#endif
  }
}

void ABI31_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const ABI31_0_0YGConfigRef config,
    const bool shouldDiffLayout) {
  config->shouldDiffLayoutWithoutLegacyStretchBehaviour = shouldDiffLayout;
}

static void ABI31_0_0YGVLog(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGNodeRef node,
    ABI31_0_0YGLogLevel level,
    const char* format,
    va_list args) {
  const ABI31_0_0YGConfigRef logConfig =
      config != nullptr ? config : ABI31_0_0YGConfigGetDefault();
  logConfig->logger(logConfig, node, level, format, args);

  if (level == ABI31_0_0YGLogLevelFatal) {
    abort();
  }
}

void ABI31_0_0YGLogWithConfig(
    const ABI31_0_0YGConfigRef config,
    ABI31_0_0YGLogLevel level,
    const char* format,
    ...) {
  va_list args;
  va_start(args, format);
  ABI31_0_0YGVLog(config, nullptr, level, format, args);
  va_end(args);
}

void ABI31_0_0YGLog(const ABI31_0_0YGNodeRef node, ABI31_0_0YGLogLevel level, const char* format, ...) {
  va_list args;
  va_start(args, format);
  ABI31_0_0YGVLog(
      node == nullptr ? nullptr : node->getConfig(), node, level, format, args);
  va_end(args);
}

void ABI31_0_0YGAssert(const bool condition, const char* message) {
  if (!condition) {
    ABI31_0_0YGLog(nullptr, ABI31_0_0YGLogLevelFatal, "%s\n", message);
  }
}

void ABI31_0_0YGAssertWithNode(
    const ABI31_0_0YGNodeRef node,
    const bool condition,
    const char* message) {
  if (!condition) {
    ABI31_0_0YGLog(node, ABI31_0_0YGLogLevelFatal, "%s\n", message);
  }
}

void ABI31_0_0YGAssertWithConfig(
    const ABI31_0_0YGConfigRef config,
    const bool condition,
    const char* message) {
  if (!condition) {
    ABI31_0_0YGLogWithConfig(config, ABI31_0_0YGLogLevelFatal, "%s\n", message);
  }
}

void ABI31_0_0YGConfigSetExperimentalFeatureEnabled(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGExperimentalFeature feature,
    const bool enabled) {
  config->experimentalFeatures[feature] = enabled;
}

inline bool ABI31_0_0YGConfigIsExperimentalFeatureEnabled(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGExperimentalFeature feature) {
  return config->experimentalFeatures[feature];
}

void ABI31_0_0YGConfigSetUseWebDefaults(const ABI31_0_0YGConfigRef config, const bool enabled) {
  config->useWebDefaults = enabled;
}

void ABI31_0_0YGConfigSetUseLegacyStretchBehaviour(
    const ABI31_0_0YGConfigRef config,
    const bool useLegacyStretchBehaviour) {
  config->useLegacyStretchBehaviour = useLegacyStretchBehaviour;
}

bool ABI31_0_0YGConfigGetUseWebDefaults(const ABI31_0_0YGConfigRef config) {
  return config->useWebDefaults;
}

void ABI31_0_0YGConfigSetContext(const ABI31_0_0YGConfigRef config, void* context) {
  config->context = context;
}

void* ABI31_0_0YGConfigGetContext(const ABI31_0_0YGConfigRef config) {
  return config->context;
}

void ABI31_0_0YGConfigSetCloneNodeFunc(
    const ABI31_0_0YGConfigRef config,
    const ABI31_0_0YGCloneNodeFunc callback) {
  config->cloneNodeCallback = callback;
}

static void ABI31_0_0YGTraverseChildrenPreOrder(
    const ABI31_0_0YGVector& children,
    const std::function<void(ABI31_0_0YGNodeRef node)>& f) {
  for (ABI31_0_0YGNodeRef node : children) {
    f(node);
    ABI31_0_0YGTraverseChildrenPreOrder(node->getChildren(), f);
  }
}

void ABI31_0_0YGTraversePreOrder(
    ABI31_0_0YGNodeRef const node,
    std::function<void(ABI31_0_0YGNodeRef node)>&& f) {
  if (!node) {
    return;
  }
  f(node);
  ABI31_0_0YGTraverseChildrenPreOrder(node->getChildren(), f);
}
