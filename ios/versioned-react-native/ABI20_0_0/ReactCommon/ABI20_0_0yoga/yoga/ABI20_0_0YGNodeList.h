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

#include "ABI20_0_0YGMacros.h"
#include "ABI20_0_0Yoga.h"

ABI20_0_0YG_EXTERN_C_BEGIN

typedef struct ABI20_0_0YGNodeList *ABI20_0_0YGNodeListRef;

ABI20_0_0YGNodeListRef ABI20_0_0YGNodeListNew(const uint32_t initialCapacity);
void ABI20_0_0YGNodeListFree(const ABI20_0_0YGNodeListRef list);
uint32_t ABI20_0_0YGNodeListCount(const ABI20_0_0YGNodeListRef list);
void ABI20_0_0YGNodeListAdd(ABI20_0_0YGNodeListRef *listp, const ABI20_0_0YGNodeRef node);
void ABI20_0_0YGNodeListInsert(ABI20_0_0YGNodeListRef *listp, const ABI20_0_0YGNodeRef node, const uint32_t index);
ABI20_0_0YGNodeRef ABI20_0_0YGNodeListRemove(const ABI20_0_0YGNodeListRef list, const uint32_t index);
ABI20_0_0YGNodeRef ABI20_0_0YGNodeListDelete(const ABI20_0_0YGNodeListRef list, const ABI20_0_0YGNodeRef node);
ABI20_0_0YGNodeRef ABI20_0_0YGNodeListGet(const ABI20_0_0YGNodeListRef list, const uint32_t index);

ABI20_0_0YG_EXTERN_C_END
