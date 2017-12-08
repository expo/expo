/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#include "ABI24_0_0YGMacros.h"
#include "ABI24_0_0Yoga.h"

ABI24_0_0YG_EXTERN_C_BEGIN

typedef struct ABI24_0_0YGNodeList *ABI24_0_0YGNodeListRef;

ABI24_0_0YGNodeListRef ABI24_0_0YGNodeListNew(const uint32_t initialCapacity);
void ABI24_0_0YGNodeListFree(const ABI24_0_0YGNodeListRef list);
uint32_t ABI24_0_0YGNodeListCount(const ABI24_0_0YGNodeListRef list);
void ABI24_0_0YGNodeListAdd(ABI24_0_0YGNodeListRef *listp, const ABI24_0_0YGNodeRef node);
void ABI24_0_0YGNodeListInsert(ABI24_0_0YGNodeListRef *listp, const ABI24_0_0YGNodeRef node, const uint32_t index);
void ABI24_0_0YGNodeListReplace(const ABI24_0_0YGNodeListRef list, const uint32_t index, const ABI24_0_0YGNodeRef newNode);
void ABI24_0_0YGNodeListRemoveAll(const ABI24_0_0YGNodeListRef list);
ABI24_0_0YGNodeRef ABI24_0_0YGNodeListRemove(const ABI24_0_0YGNodeListRef list, const uint32_t index);
ABI24_0_0YGNodeRef ABI24_0_0YGNodeListDelete(const ABI24_0_0YGNodeListRef list, const ABI24_0_0YGNodeRef node);
ABI24_0_0YGNodeRef ABI24_0_0YGNodeListGet(const ABI24_0_0YGNodeListRef list, const uint32_t index);
ABI24_0_0YGNodeListRef ABI24_0_0YGNodeListClone(ABI24_0_0YGNodeListRef list);

ABI24_0_0YG_EXTERN_C_END
