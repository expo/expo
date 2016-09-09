/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI10_0_0CSSNodeList.h"

struct ABI10_0_0CSSNodeList {
  uint32_t capacity;
  uint32_t count;
  void **items;
};

ABI10_0_0CSSNodeListRef ABI10_0_0CSSNodeListNew(uint32_t initialCapacity) {
  ABI10_0_0CSSNodeListRef list = malloc(sizeof(struct ABI10_0_0CSSNodeList));
  ABI10_0_0CSS_ASSERT(list != NULL, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = malloc(sizeof(void *) * list->capacity);
  ABI10_0_0CSS_ASSERT(list->items != NULL, "Could not allocate memory for items");

  return list;
}

void ABI10_0_0CSSNodeListFree(ABI10_0_0CSSNodeListRef list) {
  free(list->items);
  free(list);
}

uint32_t ABI10_0_0CSSNodeListCount(ABI10_0_0CSSNodeListRef list) {
  return list->count;
}

void ABI10_0_0CSSNodeListAdd(ABI10_0_0CSSNodeListRef list, ABI10_0_0CSSNodeRef node) {
  ABI10_0_0CSSNodeListInsert(list, node, list->count);
}

void ABI10_0_0CSSNodeListInsert(ABI10_0_0CSSNodeListRef list, ABI10_0_0CSSNodeRef node, uint32_t index) {
  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = realloc(list->items, sizeof(void *) * list->capacity);
    ABI10_0_0CSS_ASSERT(list->items != NULL, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeListRemove(ABI10_0_0CSSNodeListRef list, uint32_t index) {
  ABI10_0_0CSSNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeListDelete(ABI10_0_0CSSNodeListRef list, ABI10_0_0CSSNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return ABI10_0_0CSSNodeListRemove(list, i);
    }
  }

  return NULL;
}

ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeListGet(ABI10_0_0CSSNodeListRef list, uint32_t index) {
  return list->items[index];
}
