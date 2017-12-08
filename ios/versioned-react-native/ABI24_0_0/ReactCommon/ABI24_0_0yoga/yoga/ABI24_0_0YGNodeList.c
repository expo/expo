/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "ABI24_0_0YGNodeList.h"

extern ABI24_0_0YGMalloc gABI24_0_0YGMalloc;
extern ABI24_0_0YGRealloc gABI24_0_0YGRealloc;
extern ABI24_0_0YGFree gABI24_0_0YGFree;

struct ABI24_0_0YGNodeList {
  uint32_t capacity;
  uint32_t count;
  ABI24_0_0YGNodeRef *items;
};

ABI24_0_0YGNodeListRef ABI24_0_0YGNodeListNew(const uint32_t initialCapacity) {
  const ABI24_0_0YGNodeListRef list = gABI24_0_0YGMalloc(sizeof(struct ABI24_0_0YGNodeList));
  ABI24_0_0YGAssert(list != NULL, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = gABI24_0_0YGMalloc(sizeof(ABI24_0_0YGNodeRef) * list->capacity);
  ABI24_0_0YGAssert(list->items != NULL, "Could not allocate memory for items");

  return list;
}

void ABI24_0_0YGNodeListFree(const ABI24_0_0YGNodeListRef list) {
  if (list) {
    gABI24_0_0YGFree(list->items);
    gABI24_0_0YGFree(list);
  }
}

uint32_t ABI24_0_0YGNodeListCount(const ABI24_0_0YGNodeListRef list) {
  if (list) {
    return list->count;
  }
  return 0;
}

void ABI24_0_0YGNodeListAdd(ABI24_0_0YGNodeListRef *listp, const ABI24_0_0YGNodeRef node) {
  if (!*listp) {
    *listp = ABI24_0_0YGNodeListNew(4);
  }
  ABI24_0_0YGNodeListInsert(listp, node, (*listp)->count);
}

void ABI24_0_0YGNodeListInsert(ABI24_0_0YGNodeListRef *listp, const ABI24_0_0YGNodeRef node, const uint32_t index) {
  if (!*listp) {
    *listp = ABI24_0_0YGNodeListNew(4);
  }
  ABI24_0_0YGNodeListRef list = *listp;

  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = gABI24_0_0YGRealloc(list->items, sizeof(ABI24_0_0YGNodeRef) * list->capacity);
    ABI24_0_0YGAssert(list->items != NULL, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

void ABI24_0_0YGNodeListReplace(ABI24_0_0YGNodeListRef list, const uint32_t index, const ABI24_0_0YGNodeRef newNode) {
  list->items[index] = newNode;
}

void ABI24_0_0YGNodeListRemoveAll(const ABI24_0_0YGNodeListRef list) {
  for (uint32_t i = 0; i < list->count; i++) {
    list->items[i] = NULL;
  }
  list->count = 0;
}

ABI24_0_0YGNodeRef ABI24_0_0YGNodeListRemove(const ABI24_0_0YGNodeListRef list, const uint32_t index) {
  const ABI24_0_0YGNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

ABI24_0_0YGNodeRef ABI24_0_0YGNodeListDelete(const ABI24_0_0YGNodeListRef list, const ABI24_0_0YGNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return ABI24_0_0YGNodeListRemove(list, i);
    }
  }

  return NULL;
}

ABI24_0_0YGNodeRef ABI24_0_0YGNodeListGet(const ABI24_0_0YGNodeListRef list, const uint32_t index) {
  if (ABI24_0_0YGNodeListCount(list) > 0) {
    return list->items[index];
  }

  return NULL;
}

ABI24_0_0YGNodeListRef ABI24_0_0YGNodeListClone(const ABI24_0_0YGNodeListRef oldList) {
  if (!oldList) {
    return NULL;
  }
  const uint32_t count = oldList->count;
  if (count == 0) {
    return NULL;
  }
  const ABI24_0_0YGNodeListRef newList = ABI24_0_0YGNodeListNew(count);
  memcpy(newList->items, oldList->items, sizeof(ABI24_0_0YGNodeRef) * count);
  newList->count = count;
  return newList;
}
