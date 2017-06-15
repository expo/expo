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

#include "ABI18_0_0YGMacros.h"
#include "ABI18_0_0Yoga.h"

ABI18_0_0YG_EXTERN_C_BEGIN

typedef struct ABI18_0_0YGNodeList *ABI18_0_0YGNodeListRef;

ABI18_0_0YGNodeListRef ABI18_0_0YGNodeListNew(const uint32_t initialCapacity);
void ABI18_0_0YGNodeListFree(const ABI18_0_0YGNodeListRef list);
uint32_t ABI18_0_0YGNodeListCount(const ABI18_0_0YGNodeListRef list);
void ABI18_0_0YGNodeListAdd(ABI18_0_0YGNodeListRef *listp, const ABI18_0_0YGNodeRef node);
void ABI18_0_0YGNodeListInsert(ABI18_0_0YGNodeListRef *listp, const ABI18_0_0YGNodeRef node, const uint32_t index);
ABI18_0_0YGNodeRef ABI18_0_0YGNodeListRemove(const ABI18_0_0YGNodeListRef list, const uint32_t index);
ABI18_0_0YGNodeRef ABI18_0_0YGNodeListDelete(const ABI18_0_0YGNodeListRef list, const ABI18_0_0YGNodeRef node);
ABI18_0_0YGNodeRef ABI18_0_0YGNodeListGet(const ABI18_0_0YGNodeListRef list, const uint32_t index);

ABI18_0_0YG_EXTERN_C_END
