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

#include "ABI12_0_0CSSLayout.h"
#include "ABI12_0_0CSSMacros.h"

ABI12_0_0CSS_EXTERN_C_BEGIN

typedef struct ABI12_0_0CSSNodeList *ABI12_0_0CSSNodeListRef;

ABI12_0_0CSSNodeListRef ABI12_0_0CSSNodeListNew(const uint32_t initialCapacity);
void ABI12_0_0CSSNodeListFree(const ABI12_0_0CSSNodeListRef list);
uint32_t ABI12_0_0CSSNodeListCount(const ABI12_0_0CSSNodeListRef list);
void ABI12_0_0CSSNodeListAdd(const ABI12_0_0CSSNodeListRef list, const ABI12_0_0CSSNodeRef node);
void ABI12_0_0CSSNodeListInsert(const ABI12_0_0CSSNodeListRef list, const ABI12_0_0CSSNodeRef node, const uint32_t index);
ABI12_0_0CSSNodeRef ABI12_0_0CSSNodeListRemove(const ABI12_0_0CSSNodeListRef list, const uint32_t index);
ABI12_0_0CSSNodeRef ABI12_0_0CSSNodeListDelete(const ABI12_0_0CSSNodeListRef list, const ABI12_0_0CSSNodeRef node);
ABI12_0_0CSSNodeRef ABI12_0_0CSSNodeListGet(const ABI12_0_0CSSNodeListRef list, const uint32_t index);

ABI12_0_0CSS_EXTERN_C_END
