/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#include "ABI8_0_0CSSNodeList.h"

struct ABI8_0_0CSSNodeList {
  int capacity;
  int count;
  void **items;
};

ABI8_0_0CSSNodeListRef ABI8_0_0CSSNodeListNew(unsigned int initialCapacity) {
  ABI8_0_0CSSNodeListRef list = malloc(sizeof(struct ABI8_0_0CSSNodeList));
  assert(list != NULL);

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = malloc(sizeof(void*) * list->capacity);
  assert(list->items != NULL);

  return list;
}

void ABI8_0_0CSSNodeListFree(ABI8_0_0CSSNodeListRef list) {
  free(list);
}

unsigned int ABI8_0_0CSSNodeListCount(ABI8_0_0CSSNodeListRef list) {
  return list->count;
}

void ABI8_0_0CSSNodeListAdd(ABI8_0_0CSSNodeListRef list, ABI8_0_0CSSNodeRef node) {
  ABI8_0_0CSSNodeListInsert(list, node, list->count);
}

void ABI8_0_0CSSNodeListInsert(ABI8_0_0CSSNodeListRef list, ABI8_0_0CSSNodeRef node, unsigned int index) {
  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = realloc(list->items, sizeof(void*) * list->capacity);
    assert(list->items != NULL);
  }

  for (unsigned int i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeListRemove(ABI8_0_0CSSNodeListRef list, unsigned int index) {
  ABI8_0_0CSSNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (unsigned int i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeListDelete(ABI8_0_0CSSNodeListRef list, ABI8_0_0CSSNodeRef node) {
  for (unsigned int i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return ABI8_0_0CSSNodeListRemove(list, i);
    }
  }

  return NULL;
}

ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeListGet(ABI8_0_0CSSNodeListRef list, unsigned int index) {
  return list->items[index];
}
