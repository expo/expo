/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __CSS_NODE_LIST_H
#define __CSS_NODE_LIST_H

#include <CSSLayout/ABI8_0_0CSSLayout.h>

ABI8_0_0CSS_EXTERN_C_BEGIN

typedef struct ABI8_0_0CSSNodeList * ABI8_0_0CSSNodeListRef;

ABI8_0_0CSSNodeListRef ABI8_0_0CSSNodeListNew(unsigned int initialCapacity);
void ABI8_0_0CSSNodeListFree(ABI8_0_0CSSNodeListRef list);
unsigned int ABI8_0_0CSSNodeListCount(ABI8_0_0CSSNodeListRef list);
void ABI8_0_0CSSNodeListAdd(ABI8_0_0CSSNodeListRef list, ABI8_0_0CSSNodeRef node);
void ABI8_0_0CSSNodeListInsert(ABI8_0_0CSSNodeListRef list, ABI8_0_0CSSNodeRef node, unsigned int index);
ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeListRemove(ABI8_0_0CSSNodeListRef list, unsigned int index);
ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeListDelete(ABI8_0_0CSSNodeListRef list, ABI8_0_0CSSNodeRef node);
ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeListGet(ABI8_0_0CSSNodeListRef list, unsigned int index);

ABI8_0_0CSS_EXTERN_C_END

#endif
