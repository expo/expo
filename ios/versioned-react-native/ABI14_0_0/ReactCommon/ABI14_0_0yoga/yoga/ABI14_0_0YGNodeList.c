/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI14_0_0YGNodeList.h"

extern ABI14_0_0YGMalloc gABI14_0_0YGMalloc;
extern ABI14_0_0YGRealloc gABI14_0_0YGRealloc;
extern ABI14_0_0YGFree gABI14_0_0YGFree;

struct ABI14_0_0YGNodeList {
  uint32_t capacity;
  uint32_t count;
  ABI14_0_0YGNodeRef *items;
};

ABI14_0_0YGNodeListRef ABI14_0_0YGNodeListNew(const uint32_t initialCapacity) {
  const ABI14_0_0YGNodeListRef list = gABI14_0_0YGMalloc(sizeof(struct ABI14_0_0YGNodeList));
  ABI14_0_0YG_ASSERT(list != NULL, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = gABI14_0_0YGMalloc(sizeof(ABI14_0_0YGNodeRef) * list->capacity);
  ABI14_0_0YG_ASSERT(list->items != NULL, "Could not allocate memory for items");

  return list;
}

void ABI14_0_0YGNodeListFree(const ABI14_0_0YGNodeListRef list) {
  if (list) {
    gABI14_0_0YGFree(list->items);
    gABI14_0_0YGFree(list);
  }
}

uint32_t ABI14_0_0YGNodeListCount(const ABI14_0_0YGNodeListRef list) {
  if (list) {
    return list->count;
  }
  return 0;
}

void ABI14_0_0YGNodeListAdd(ABI14_0_0YGNodeListRef *listp, const ABI14_0_0YGNodeRef node) {
  if (!*listp) {
    *listp = ABI14_0_0YGNodeListNew(4);
  }
  ABI14_0_0YGNodeListInsert(listp, node, (*listp)->count);
}

void ABI14_0_0YGNodeListInsert(ABI14_0_0YGNodeListRef *listp, const ABI14_0_0YGNodeRef node, const uint32_t index) {
  if (!*listp) {
    *listp = ABI14_0_0YGNodeListNew(4);
  }
  ABI14_0_0YGNodeListRef list = *listp;

  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = gABI14_0_0YGRealloc(list->items, sizeof(ABI14_0_0YGNodeRef) * list->capacity);
    ABI14_0_0YG_ASSERT(list->items != NULL, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

ABI14_0_0YGNodeRef ABI14_0_0YGNodeListRemove(const ABI14_0_0YGNodeListRef list, const uint32_t index) {
  const ABI14_0_0YGNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

ABI14_0_0YGNodeRef ABI14_0_0YGNodeListDelete(const ABI14_0_0YGNodeListRef list, const ABI14_0_0YGNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return ABI14_0_0YGNodeListRemove(list, i);
    }
  }

  return NULL;
}

ABI14_0_0YGNodeRef ABI14_0_0YGNodeListGet(const ABI14_0_0YGNodeListRef list, const uint32_t index) {
  if (ABI14_0_0YGNodeListCount(list) > 0) {
    return list->items[index];
  }

  return NULL;
}
