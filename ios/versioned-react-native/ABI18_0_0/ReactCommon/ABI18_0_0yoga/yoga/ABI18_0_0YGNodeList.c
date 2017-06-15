/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI18_0_0YGNodeList.h"

extern ABI18_0_0YGMalloc gABI18_0_0YGMalloc;
extern ABI18_0_0YGRealloc gABI18_0_0YGRealloc;
extern ABI18_0_0YGFree gABI18_0_0YGFree;

struct ABI18_0_0YGNodeList {
  uint32_t capacity;
  uint32_t count;
  ABI18_0_0YGNodeRef *items;
};

ABI18_0_0YGNodeListRef ABI18_0_0YGNodeListNew(const uint32_t initialCapacity) {
  const ABI18_0_0YGNodeListRef list = gABI18_0_0YGMalloc(sizeof(struct ABI18_0_0YGNodeList));
  ABI18_0_0YGAssert(list != NULL, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = gABI18_0_0YGMalloc(sizeof(ABI18_0_0YGNodeRef) * list->capacity);
  ABI18_0_0YGAssert(list->items != NULL, "Could not allocate memory for items");

  return list;
}

void ABI18_0_0YGNodeListFree(const ABI18_0_0YGNodeListRef list) {
  if (list) {
    gABI18_0_0YGFree(list->items);
    gABI18_0_0YGFree(list);
  }
}

uint32_t ABI18_0_0YGNodeListCount(const ABI18_0_0YGNodeListRef list) {
  if (list) {
    return list->count;
  }
  return 0;
}

void ABI18_0_0YGNodeListAdd(ABI18_0_0YGNodeListRef *listp, const ABI18_0_0YGNodeRef node) {
  if (!*listp) {
    *listp = ABI18_0_0YGNodeListNew(4);
  }
  ABI18_0_0YGNodeListInsert(listp, node, (*listp)->count);
}

void ABI18_0_0YGNodeListInsert(ABI18_0_0YGNodeListRef *listp, const ABI18_0_0YGNodeRef node, const uint32_t index) {
  if (!*listp) {
    *listp = ABI18_0_0YGNodeListNew(4);
  }
  ABI18_0_0YGNodeListRef list = *listp;

  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = gABI18_0_0YGRealloc(list->items, sizeof(ABI18_0_0YGNodeRef) * list->capacity);
    ABI18_0_0YGAssert(list->items != NULL, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

ABI18_0_0YGNodeRef ABI18_0_0YGNodeListRemove(const ABI18_0_0YGNodeListRef list, const uint32_t index) {
  const ABI18_0_0YGNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

ABI18_0_0YGNodeRef ABI18_0_0YGNodeListDelete(const ABI18_0_0YGNodeListRef list, const ABI18_0_0YGNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return ABI18_0_0YGNodeListRemove(list, i);
    }
  }

  return NULL;
}

ABI18_0_0YGNodeRef ABI18_0_0YGNodeListGet(const ABI18_0_0YGNodeListRef list, const uint32_t index) {
  if (ABI18_0_0YGNodeListCount(list) > 0) {
    return list->items[index];
  }

  return NULL;
}
