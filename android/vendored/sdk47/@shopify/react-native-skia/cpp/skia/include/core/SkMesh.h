/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkMesh_DEFINED
#define SkMesh_DEFINED

#include "include/core/SkTypes.h"

#ifdef SK_ENABLE_SKSL
#include "include/core/SkAlphaType.h"
#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSpan.h"
#include "include/core/SkString.h"

#include <memory>
#include <vector>

class GrDirectContext;
class SkColorSpace;
class SkData;

namespace SkSL { struct Program; }

/**
 * A specification for custom meshes. Specifies the vertex buffer attributes and stride, the
 * vertex program that produces a user-defined set of varyings, a fragment program that ingests
 * the interpolated varyings and produces local coordinates and optionally a color.
 *
 * The signature of the vertex program must be:
 *   float2 main(Attributes, out Varyings)
 * where the return value is a local position that will be transformed by SkCanvas's matrix.
 *
 * The signature of the fragment program must be either:
 *   (float2|void) main(Varyings)
 * or
 *   (float2|void) main(Varyings, out (half4|float4) color)
 *
 * where the return value is the local coordinates that will be used to access SkShader. If the
 * return type is void then the interpolated position from vertex shader return is used as the local
 * coordinate. If the color variant is used it will be blended with SkShader (or SkPaint color in
 * absence of a shader) using the SkBlender provided to the SkCanvas draw call.
 */
class SkMeshSpecification : public SkNVRefCnt<SkMeshSpecification> {
public:
    /** These values are enforced when creating a specification. */
    static constexpr size_t kMaxStride       = 1024;
    static constexpr size_t kMaxAttributes   = 8;
    static constexpr size_t kStrideAlignment = 4;
    static constexpr size_t kOffsetAlignment = 4;
    static constexpr size_t kMaxVaryings     = 6;

    struct Attribute {
        enum class Type : uint32_t {  // CPU representation     Shader Type
            kFloat,                   // float                  float
            kFloat2,                  // two floats             float2
            kFloat3,                  // three floats           float3
            kFloat4,                  // four floats            float4
            kUByte4_unorm,            // four bytes             half4

            kLast = kUByte4_unorm
        };
        Type     type;
        size_t   offset;
        SkString name;
    };

    struct Varying {
        enum class Type : uint32_t {
            kFloat,   // "float"
            kFloat2,  // "float2"
            kFloat3,  // "float3"
            kFloat4,  // "float4"
            kHalf,    // "half"
            kHalf2,   // "half2"
            kHalf3,   // "half3"
            kHalf4,   // "half4"

            kLast = kHalf4
        };
        Type     type;
        SkString name;
    };

    ~SkMeshSpecification();

    struct Result {
        sk_sp<SkMeshSpecification> specification;
        SkString                   error;
    };

    /**
     * If successful the return is a specification and an empty error string. Otherwise, it is a
     * null specification a non-empty error string.
     *
     * @param attributes     The vertex attributes that will be consumed by 'vs'. Attributes need
     *                       not be tightly packed but attribute offsets must be aligned to
     *                       kOffsetAlignment and offset + size may not be greater than
     *                       'vertexStride'. At least one attribute is required.
     * @param vertexStride   The offset between successive attribute values. This must be aligned to
     *                       kStrideAlignment.
     * @param varyings       The varyings that will be written by 'vs' and read by 'fs'. This may
     *                       be empty.
     * @param vs             The vertex shader code that computes a vertex position and the varyings
     *                       from the attributes.
     * @param fs             The fragment code that computes a local coordinate and optionally a
     *                       color from the varyings. The local coordinate is used to sample
     *                       SkShader.
     * @param cs             The colorspace of the color produced by 'fs'. Ignored if 'fs's main()
     *                       function does not have a color out param.
     * @param at             The alpha type of the color produced by 'fs'. Ignored if 'fs's main()
     *                       function does not have a color out param. Cannot be kUnknown.
     */
    static Result Make(SkSpan<const Attribute> attributes,
                       size_t                  vertexStride,
                       SkSpan<const Varying>   varyings,
                       const SkString&         vs,
                       const SkString&         fs);
    static Result Make(SkSpan<const Attribute> attributes,
                       size_t                  vertexStride,
                       SkSpan<const Varying>   varyings,
                       const SkString&         vs,
                       const SkString&         fs,
                       sk_sp<SkColorSpace>     cs);
    static Result Make(SkSpan<const Attribute> attributes,
                       size_t                  vertexStride,
                       SkSpan<const Varying>   varyings,
                       const SkString&         vs,
                       const SkString&         fs,
                       sk_sp<SkColorSpace>     cs,
                       SkAlphaType             at);

    SkSpan<const Attribute> attributes() const { return SkMakeSpan(fAttributes); }

    size_t stride() const { return fStride; }

private:
    friend struct SkMeshSpecificationPriv;

    enum class ColorType {
        kNone,
        kHalf4,
        kFloat4,
    };

    static Result MakeFromSourceWithStructs(SkSpan<const Attribute> attributes,
                                            size_t                  stride,
                                            SkSpan<const Varying>   varyings,
                                            const SkString&         vs,
                                            const SkString&         fs,
                                            sk_sp<SkColorSpace>     cs,
                                            SkAlphaType             at);

    SkMeshSpecification(SkSpan<const Attribute>,
                        size_t,
                        SkSpan<const Varying>,
                        std::unique_ptr<SkSL::Program>,
                        std::unique_ptr<SkSL::Program>,
                        ColorType,
                        bool hasLocalCoords,
                        sk_sp<SkColorSpace>,
                        SkAlphaType);

    SkMeshSpecification(const SkMeshSpecification&) = delete;
    SkMeshSpecification(SkMeshSpecification&&) = delete;

    SkMeshSpecification& operator=(const SkMeshSpecification&) = delete;
    SkMeshSpecification& operator=(SkMeshSpecification&&) = delete;

    const std::vector<Attribute>   fAttributes;
    const std::vector<Varying>     fVaryings;
    std::unique_ptr<SkSL::Program> fVS;
    std::unique_ptr<SkSL::Program> fFS;
    size_t                         fStride;
    uint32_t                       fHash;
    ColorType                      fColorType;
    bool                           fHasLocalCoords;
    sk_sp<SkColorSpace>            fColorSpace;
    SkAlphaType                    fAlphaType;
};

/**
 * A vertex buffer, a topology, optionally an index buffer, and a compatible SkMeshSpecification.
 *
 * The data in the vertex buffer is expected to contain the attributes described by the spec
 * for vertexCount vertices beginning at vertexOffset. vertexOffset must be aligned to the
 * SkMeshSpecification's vertex stride. The size of the buffer must be at least vertexOffset +
 * spec->stride()*vertexCount (even if vertex attributes contains pad at the end of the stride). If
 * the specified bounds does not contain all the points output by the spec's vertex program when
 * applied to the vertices in the custom mesh then the result is undefined.
 *
 * MakeIndexed may be used to create an indexed mesh. indexCount indices are read from the index
 * buffer at the specified offset which must be aligned to 2. The indices are always unsigned 16bit
 * integers. The index count must be at least 3.
 *
 * If Make() is used the implicit index sequence is 0, 1, 2, 3, ... and vertexCount must be at least
 * 3.
 */
class SkMesh {
public:
    class IndexBuffer  : public SkRefCnt {};
    class VertexBuffer : public SkRefCnt {};

    SkMesh();
    ~SkMesh();

    SkMesh(const SkMesh&);
    SkMesh(SkMesh&&);

    SkMesh& operator=(const SkMesh&);
    SkMesh& operator=(SkMesh&&);

    /**
     * Makes an index buffer to be used with SkMeshes. The SkData is used to determine the
     * size and contents of the buffer. The buffer may be CPU- or GPU-backed depending on whether
     * GrDirectContext* is nullptr.
     *
     * @param  GrDirectContext*   If nullptr a CPU-backed object is returned that owns the SkData.
     *                            Otherwise, the data is uploaded to the GPU and a GPU-backed buffer
     *                            is returned. It may only be used to draw into SkSurfaces that
     *                            are backed by the passed GrDirectContext.
     * @param  sk_sp<SkData>      required. The data used to populate the buffer.
     */
    static sk_sp<IndexBuffer> MakeIndexBuffer(GrDirectContext*, sk_sp<const SkData>);

    /**
     * Makes a vertex buffer to be used with SkMeshes. The SkData is used to determine the
     * size and contents of the buffer.The buffer may be CPU- or GPU-backed depending on whether
     * GrDirectContext* is nullptr.
     *
     * @param  GrDirectContext*   If nullptr a CPU-backed object is returned that owns the SkData.
     *                            Otherwise, the data is uploaded to the GPU and a GPU-backed buffer
     *                            is returned. It may only be used to draw into SkSurfaces that
     *                            are backed by the passed GrDirectContext.
     * @param  sk_sp<SkData>      required. The data used to populate the buffer.
     */
    static sk_sp<VertexBuffer> MakeVertexBuffer(GrDirectContext*, sk_sp<const SkData>);

    enum class Mode { kTriangles, kTriangleStrip };

    static SkMesh Make(sk_sp<SkMeshSpecification>,
                       Mode,
                       sk_sp<VertexBuffer>,
                       size_t vertexCount,
                       size_t vertexOffset,
                       const SkRect& bounds);

    static SkMesh MakeIndexed(sk_sp<SkMeshSpecification>,
                              Mode,
                              sk_sp<VertexBuffer>,
                              size_t vertexCount,
                              size_t vertexOffset,
                              sk_sp<IndexBuffer>,
                              size_t indexCount,
                              size_t indexOffset,
                              const SkRect& bounds);

    sk_sp<SkMeshSpecification> spec() const { return fSpec; }

    Mode mode() const { return fMode; }

    sk_sp<VertexBuffer> vertexBuffer() const { return fVB; }

    size_t vertexOffset() const { return fVOffset; }
    size_t vertexCount()  const { return fVCount;  }

    sk_sp<IndexBuffer> indexBuffer() const { return fIB; }

    size_t indexOffset() const { return fIOffset; }
    size_t indexCount()  const { return fICount;  }

    SkRect bounds() const { return fBounds; }

    bool isValid() const;

private:
    friend struct SkMeshPriv;

    bool validate() const;

    sk_sp<SkMeshSpecification> fSpec;

    sk_sp<VertexBuffer> fVB;
    sk_sp<IndexBuffer>  fIB;

    size_t fVOffset = 0;  // Must be a multiple of spec->stride()
    size_t fVCount  = 0;

    size_t fIOffset = 0;  // Must be a multiple of sizeof(uint16_t)
    size_t fICount  = 0;

    Mode fMode = Mode::kTriangles;

    SkRect fBounds = SkRect::MakeEmpty();
};

#endif  // SK_ENABLE_SKSL

#endif
