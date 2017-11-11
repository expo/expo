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

#include "ABI23_0_0YGMacros.h"
#include "ABI23_0_0Yoga.h"

ABI23_0_0YG_EXTERN_C_BEGIN

typedef struct ABI23_0_0YGNodeList *ABI23_0_0YGNodeListRef;

ABI23_0_0YGNodeListRef ABI23_0_0YGNodeListNew(const uint32_t initialCapacity);
void ABI23_0_0YGNodeListFree(const ABI23_0_0YGNodeListRef list);
uint32_t ABI23_0_0YGNodeListCount(const ABI23_0_0YGNodeListRef list);
void ABI23_0_0YGNodeListAdd(ABI23_0_0YGNodeListRef *listp, const ABI23_0_0YGNodeRef node);
void ABI23_0_0YGNodeListInsert(ABI23_0_0YGNodeListRef *listp, const ABI23_0_0YGNodeRef node, const uint32_t index);
ABI23_0_0YGNodeRef ABI23_0_0YGNodeListRemove(const ABI23_0_0YGNodeListRef list, const uint32_t index);
ABI23_0_0YGNodeRef ABI23_0_0YGNodeListDelete(const ABI23_0_0YGNodeListRef list, const ABI23_0_0YGNodeRef node);
ABI23_0_0YGNodeRef ABI23_0_0YGNodeListGet(const ABI23_0_0YGNodeListRef list, const uint32_t index);

ABI23_0_0YG_EXTERN_C_END
