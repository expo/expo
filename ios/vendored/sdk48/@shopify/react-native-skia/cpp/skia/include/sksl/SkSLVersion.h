/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSLVersion_DEFINED
#define SkSLVersion_DEFINED

namespace SkSL {

enum class Version {
    /**
     * Desktop GLSL 1.10, GLSL ES 1.00, WebGL 1.0
     */
    k100,

    /**
     * Desktop GLSL 3.30, GLSL ES 3.00, WebGL 2.0
     */
    k300,
};

}  // namespace SkSL

#endif
