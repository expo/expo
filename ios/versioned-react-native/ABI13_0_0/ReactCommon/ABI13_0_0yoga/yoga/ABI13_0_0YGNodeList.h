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

#include "ABI13_0_0YGMacros.h"
#include "ABI13_0_0Yoga.h"

ABI13_0_0YG_EXTERN_C_BEGIN

typedef struct ABI13_0_0YGNodeList *ABI13_0_0YGNodeListRef;

ABI13_0_0YGNodeListRef ABI13_0_0YGNodeListNew(const uint32_t initialCapacity);
void ABI13_0_0YGNodeListFree(const ABI13_0_0YGNodeListRef list);
uint32_t ABI13_0_0YGNodeListCount(const ABI13_0_0YGNodeListRef list);
void ABI13_0_0YGNodeListAdd(ABI13_0_0YGNodeListRef *listp, const ABI13_0_0YGNodeRef node);
void ABI13_0_0YGNodeListInsert(ABI13_0_0YGNodeListRef *listp, const ABI13_0_0YGNodeRef node, const uint32_t index);
ABI13_0_0YGNodeRef ABI13_0_0YGNodeListRemove(const ABI13_0_0YGNodeListRef list, const uint32_t index);
ABI13_0_0YGNodeRef ABI13_0_0YGNodeListDelete(const ABI13_0_0YGNodeListRef list, const ABI13_0_0YGNodeRef node);
ABI13_0_0YGNodeRef ABI13_0_0YGNodeListGet(const ABI13_0_0YGNodeListRef list, const uint32_t index);

ABI13_0_0YG_EXTERN_C_END
