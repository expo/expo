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

#include "ABI11_0_0CSSLayout.h"
#include "ABI11_0_0CSSMacros.h"

ABI11_0_0CSS_EXTERN_C_BEGIN

typedef struct ABI11_0_0CSSNodeList *ABI11_0_0CSSNodeListRef;

ABI11_0_0CSSNodeListRef ABI11_0_0CSSNodeListNew(const uint32_t initialCapacity);
void ABI11_0_0CSSNodeListFree(const ABI11_0_0CSSNodeListRef list);
uint32_t ABI11_0_0CSSNodeListCount(const ABI11_0_0CSSNodeListRef list);
void ABI11_0_0CSSNodeListAdd(const ABI11_0_0CSSNodeListRef list, const ABI11_0_0CSSNodeRef node);
void ABI11_0_0CSSNodeListInsert(const ABI11_0_0CSSNodeListRef list, const ABI11_0_0CSSNodeRef node, const uint32_t index);
ABI11_0_0CSSNodeRef ABI11_0_0CSSNodeListRemove(const ABI11_0_0CSSNodeListRef list, const uint32_t index);
ABI11_0_0CSSNodeRef ABI11_0_0CSSNodeListDelete(const ABI11_0_0CSSNodeListRef list, const ABI11_0_0CSSNodeRef node);
ABI11_0_0CSSNodeRef ABI11_0_0CSSNodeListGet(const ABI11_0_0CSSNodeListRef list, const uint32_t index);

ABI11_0_0CSS_EXTERN_C_END
