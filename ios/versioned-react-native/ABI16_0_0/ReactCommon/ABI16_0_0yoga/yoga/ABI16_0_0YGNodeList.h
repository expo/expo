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

#include "ABI16_0_0YGMacros.h"
#include "ABI16_0_0Yoga.h"

ABI16_0_0YG_EXTERN_C_BEGIN

typedef struct ABI16_0_0YGNodeList *ABI16_0_0YGNodeListRef;

ABI16_0_0YGNodeListRef ABI16_0_0YGNodeListNew(const uint32_t initialCapacity);
void ABI16_0_0YGNodeListFree(const ABI16_0_0YGNodeListRef list);
uint32_t ABI16_0_0YGNodeListCount(const ABI16_0_0YGNodeListRef list);
void ABI16_0_0YGNodeListAdd(ABI16_0_0YGNodeListRef *listp, const ABI16_0_0YGNodeRef node);
void ABI16_0_0YGNodeListInsert(ABI16_0_0YGNodeListRef *listp, const ABI16_0_0YGNodeRef node, const uint32_t index);
ABI16_0_0YGNodeRef ABI16_0_0YGNodeListRemove(const ABI16_0_0YGNodeListRef list, const uint32_t index);
ABI16_0_0YGNodeRef ABI16_0_0YGNodeListDelete(const ABI16_0_0YGNodeListRef list, const ABI16_0_0YGNodeRef node);
ABI16_0_0YGNodeRef ABI16_0_0YGNodeListGet(const ABI16_0_0YGNodeListRef list, const uint32_t index);

ABI16_0_0YG_EXTERN_C_END
