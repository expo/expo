/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __ABI9_0_0CSS_NODE_LIST_H
#define __ABI9_0_0CSS_NODE_LIST_H

#include <CSSLayout/ABI9_0_0CSSLayout.h>

ABI9_0_0CSS_EXTERN_C_BEGIN

typedef struct ABI9_0_0CSSNodeList * ABI9_0_0CSSNodeListRef;

ABI9_0_0CSSNodeListRef ABI9_0_0CSSNodeListNew(unsigned int initialCapacity);
void ABI9_0_0CSSNodeListFree(ABI9_0_0CSSNodeListRef list);
unsigned int ABI9_0_0CSSNodeListCount(ABI9_0_0CSSNodeListRef list);
void ABI9_0_0CSSNodeListAdd(ABI9_0_0CSSNodeListRef list, ABI9_0_0CSSNodeRef node);
void ABI9_0_0CSSNodeListInsert(ABI9_0_0CSSNodeListRef list, ABI9_0_0CSSNodeRef node, unsigned int index);
ABI9_0_0CSSNodeRef ABI9_0_0CSSNodeListRemove(ABI9_0_0CSSNodeListRef list, unsigned int index);
ABI9_0_0CSSNodeRef ABI9_0_0CSSNodeListDelete(ABI9_0_0CSSNodeListRef list, ABI9_0_0CSSNodeRef node);
ABI9_0_0CSSNodeRef ABI9_0_0CSSNodeListGet(ABI9_0_0CSSNodeListRef list, unsigned int index);

ABI9_0_0CSS_EXTERN_C_END

#endif
