/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkCanvasAndroid_DEFINED
#define SkCanvasAndroid_DEFINED

class SkCanvas;
struct SkIRect;
class GrBackendRenderTarget;

namespace skgpu::ganesh {
SkIRect TopLayerBounds(const SkCanvas*);
GrBackendRenderTarget TopLayerBackendRenderTarget(const SkCanvas*);
}

#endif
