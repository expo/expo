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

#include <CSSLayout/ABI10_0_0CSSLayout.h>
#include <CSSLayout/ABI10_0_0CSSMacros.h>

ABI10_0_0CSS_EXTERN_C_BEGIN

typedef struct ABI10_0_0CSSNodeList *ABI10_0_0CSSNodeListRef;

ABI10_0_0CSSNodeListRef ABI10_0_0CSSNodeListNew(uint32_t initialCapacity);
void ABI10_0_0CSSNodeListFree(ABI10_0_0CSSNodeListRef list);
uint32_t ABI10_0_0CSSNodeListCount(ABI10_0_0CSSNodeListRef list);
void ABI10_0_0CSSNodeListAdd(ABI10_0_0CSSNodeListRef list, ABI10_0_0CSSNodeRef node);
void ABI10_0_0CSSNodeListInsert(ABI10_0_0CSSNodeListRef list, ABI10_0_0CSSNodeRef node, uint32_t index);
ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeListRemove(ABI10_0_0CSSNodeListRef list, uint32_t index);
ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeListDelete(ABI10_0_0CSSNodeListRef list, ABI10_0_0CSSNodeRef node);
ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeListGet(ABI10_0_0CSSNodeListRef list, uint32_t index);

ABI10_0_0CSS_EXTERN_C_END
