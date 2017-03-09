/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI15_0_0YGNodeList.h"

extern ABI15_0_0YGMalloc gABI15_0_0YGMalloc;
extern ABI15_0_0YGRealloc gABI15_0_0YGRealloc;
extern ABI15_0_0YGFree gABI15_0_0YGFree;

struct ABI15_0_0YGNodeList {
  uint32_t capacity;
  uint32_t count;
  ABI15_0_0YGNodeRef *items;
};

ABI15_0_0YGNodeListRef ABI15_0_0YGNodeListNew(const uint32_t initialCapacity) {
  const ABI15_0_0YGNodeListRef list = gABI15_0_0YGMalloc(sizeof(struct ABI15_0_0YGNodeList));
  ABI15_0_0YG_ASSERT(list != NULL, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = gABI15_0_0YGMalloc(sizeof(ABI15_0_0YGNodeRef) * list->capacity);
  ABI15_0_0YG_ASSERT(list->items != NULL, "Could not allocate memory for items");

  return list;
}

void ABI15_0_0YGNodeListFree(const ABI15_0_0YGNodeListRef list) {
  if (list) {
    gABI15_0_0YGFree(list->items);
    gABI15_0_0YGFree(list);
  }
}

uint32_t ABI15_0_0YGNodeListCount(const ABI15_0_0YGNodeListRef list) {
  if (list) {
    return list->count;
  }
  return 0;
}

void ABI15_0_0YGNodeListAdd(ABI15_0_0YGNodeListRef *listp, const ABI15_0_0YGNodeRef node) {
  if (!*listp) {
    *listp = ABI15_0_0YGNodeListNew(4);
  }
  ABI15_0_0YGNodeListInsert(listp, node, (*listp)->count);
}

void ABI15_0_0YGNodeListInsert(ABI15_0_0YGNodeListRef *listp, const ABI15_0_0YGNodeRef node, const uint32_t index) {
  if (!*listp) {
    *listp = ABI15_0_0YGNodeListNew(4);
  }
  ABI15_0_0YGNodeListRef list = *listp;

  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = gABI15_0_0YGRealloc(list->items, sizeof(ABI15_0_0YGNodeRef) * list->capacity);
    ABI15_0_0YG_ASSERT(list->items != NULL, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

ABI15_0_0YGNodeRef ABI15_0_0YGNodeListRemove(const ABI15_0_0YGNodeListRef list, const uint32_t index) {
  const ABI15_0_0YGNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

ABI15_0_0YGNodeRef ABI15_0_0YGNodeListDelete(const ABI15_0_0YGNodeListRef list, const ABI15_0_0YGNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return ABI15_0_0YGNodeListRemove(list, i);
    }
  }

  return NULL;
}

ABI15_0_0YGNodeRef ABI15_0_0YGNodeListGet(const ABI15_0_0YGNodeListRef list, const uint32_t index) {
  if (ABI15_0_0YGNodeListCount(list) > 0) {
    return list->items[index];
  }

  return NULL;
}
