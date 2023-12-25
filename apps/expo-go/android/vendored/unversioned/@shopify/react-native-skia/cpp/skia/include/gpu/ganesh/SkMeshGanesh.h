/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkMeshGanesh_DEFINED
#define SkMeshGanesh_DEFINED

#include "include/core/SkMesh.h"
#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

#include <cstddef>

class GrDirectContext;

namespace SkMeshes {
/**
 * Makes a GPU-backed index buffer to be used with SkMeshes.
 *
 * @param  GrDirectContext*  If non-null, the data will be uploaded to the corresponding GPU and the
 *                           returned buffer will only be compatible with surfaces using the same
 *                           context. If null, the data will be uploaded to a CPU buffer.
 * @param  data              The data used to populate the buffer, or nullptr to create a zero-
 *                           initialized buffer.
 * @param  size              Both the size of the data in 'data' and the size of the resulting
 *                           buffer.
 */
SK_API sk_sp<SkMesh::IndexBuffer> MakeIndexBuffer(GrDirectContext*, const void* data, size_t size);

/**
 * Makes a copy of an index buffer. The copy will be GPU backed if the context is non-null.
 */
SK_API sk_sp<SkMesh::IndexBuffer> CopyIndexBuffer(GrDirectContext*, sk_sp<SkMesh::IndexBuffer>);

/**
 * Makes a GPU-backed vertex buffer to be used with SkMeshes.
 *
 * @param  GrDirectContext*  If non-null, the data will be uploaded to the corresponding GPU and the
 *                           returned buffer will only be compatible with surfaces using the same
 *                           context. If null, the data will be uploaded to a CPU buffer.
 * @param  data              The data used to populate the buffer, or nullptr to create a zero-
 *                           initialized buffer.
 * @param  size              Both the size of the data in 'data' and the size of the resulting
 *                           buffer.
 */
SK_API sk_sp<SkMesh::VertexBuffer> MakeVertexBuffer(GrDirectContext*, const void*, size_t size);

/**
 * Makes a copy of a vertex buffer. The copy will be GPU backed if the context is non-null.
 */
SK_API sk_sp<SkMesh::VertexBuffer> CopyVertexBuffer(GrDirectContext*, sk_sp<SkMesh::VertexBuffer>);
}  // namespace SkMeshes

#endif
