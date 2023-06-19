/*
 * Copyright 2023 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkFontMgr_data_DEFINED
#define SkFontMgr_data_DEFINED

#include "include/core/SkData.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSpan.h"
#include "include/core/SkTypes.h"

class SkFontMgr;

/** Create a custom font manager which wraps a collection of SkData-stored fonts.
 *  This font manager uses FreeType for rendering.
 */
SK_API sk_sp<SkFontMgr> SkFontMgr_New_Custom_Data(SkSpan<sk_sp<SkData>>);

#endif // SkFontMgr_data_DEFINED
