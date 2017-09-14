/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI21_0_0YGNodeList.h"

extern ABI21_0_0YGMalloc gABI21_0_0YGMalloc;
extern ABI21_0_0YGRealloc gABI21_0_0YGRealloc;
extern ABI21_0_0YGFree gABI21_0_0YGFree;

struct ABI21_0_0YGNodeList {
  uint32_t capacity;
  uint32_t count;
  ABI21_0_0YGNodeRef *items;
};

ABI21_0_0YGNodeListRef ABI21_0_0YGNodeListNew(const uint32_t initialCapacity) {
  const ABI21_0_0YGNodeListRef list = gABI21_0_0YGMalloc(sizeof(struct ABI21_0_0YGNodeList));
  ABI21_0_0YGAssert(list != NULL, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = gABI21_0_0YGMalloc(sizeof(ABI21_0_0YGNodeRef) * list->capacity);
  ABI21_0_0YGAssert(list->items != NULL, "Could not allocate memory for items");

  return list;
}

void ABI21_0_0YGNodeListFree(const ABI21_0_0YGNodeListRef list) {
  if (list) {
    gABI21_0_0YGFree(list->items);
    gABI21_0_0YGFree(list);
  }
}

uint32_t ABI21_0_0YGNodeListCount(const ABI21_0_0YGNodeListRef list) {
  if (list) {
    return list->count;
  }
  return 0;
}

void ABI21_0_0YGNodeListAdd(ABI21_0_0YGNodeListRef *listp, const ABI21_0_0YGNodeRef node) {
  if (!*listp) {
    *listp = ABI21_0_0YGNodeListNew(4);
  }
  ABI21_0_0YGNodeListInsert(listp, node, (*listp)->count);
}

void ABI21_0_0YGNodeListInsert(ABI21_0_0YGNodeListRef *listp, const ABI21_0_0YGNodeRef node, const uint32_t index) {
  if (!*listp) {
    *listp = ABI21_0_0YGNodeListNew(4);
  }
  ABI21_0_0YGNodeListRef list = *listp;

  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = gABI21_0_0YGRealloc(list->items, sizeof(ABI21_0_0YGNodeRef) * list->capacity);
    ABI21_0_0YGAssert(list->items != NULL, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

ABI21_0_0YGNodeRef ABI21_0_0YGNodeListRemove(const ABI21_0_0YGNodeListRef list, const uint32_t index) {
  const ABI21_0_0YGNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

ABI21_0_0YGNodeRef ABI21_0_0YGNodeListDelete(const ABI21_0_0YGNodeListRef list, const ABI21_0_0YGNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return ABI21_0_0YGNodeListRemove(list, i);
    }
  }

  return NULL;
}

ABI21_0_0YGNodeRef ABI21_0_0YGNodeListGet(const ABI21_0_0YGNodeListRef list, const uint32_t index) {
  if (ABI21_0_0YGNodeListCount(list) > 0) {
    return list->items[index];
  }

  return NULL;
}
