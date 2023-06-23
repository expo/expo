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
#include "include/effects/SkRuntimeEffect.h"

#include <memory>
#include <tuple>
#include <vector>

class GrDirectContext;
class SkColorSpace;
class SkData;

namespace SkSL { struct Program; }

/**
 * A specification for custom meshes. Specifies the vertex buffer attributes and stride, the
 * vertex program that produces a user-defined set of varyings, and a fragment program that ingests
 * the interpolated varyings and produces local coordinates for shading and optionally a color.
 *
 * The varyings must include a float2 named "position". If the passed varyings does not
 * contain such a varying then one is implicitly added to the final specification and the SkSL
 * Varyings struct described below. It is an error to have a varying named "position" that has a
 * type other than float2.
 *
 * The provided attributes and varyings are used to create Attributes and Varyings structs in SkSL
 * that are used by the shaders. Each attribute from the Attribute span becomes a member of the
 * SkSL Attributes struct and likewise for the varyings.
 *
 * The signature of the vertex program must be:
 *   Varyings main(const Attributes).
 *
 * The signature of the fragment program must be either:
 *   float2 main(const Varyings)
 * or
 *   float2 main(const Varyings, out (half4|float4) color)
 *
 * where the return value is the local coordinates that will be used to access SkShader. If the
 * color variant is used, the returned color will be blended with SkPaint's SkShader (or SkPaint
 * color in absence of a SkShader) using the SkBlender passed to SkCanvas drawMesh(). To use
 * interpolated local space positions as the shader coordinates, equivalent to how SkPaths are
 * shaded, return the position field from the Varying struct as the coordinates.
 *
 * The vertex and fragment programs may both contain uniforms. Uniforms with the same name are
 * assumed to be shared between stages. It is an error to specify uniforms in the vertex and
 * fragment program with the same name but different types, dimensionality, or layouts.
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

    using Uniform = SkRuntimeEffect::Uniform;

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

    SkSpan<const Attribute> attributes() const { return SkSpan(fAttributes); }

    /**
     * Combined size of all 'uniform' variables. When creating a SkMesh with this specification
     * provide an SkData of this size, containing values for all of those variables. Use uniforms()
     * to get the offset of each uniform within the SkData.
     */
    size_t uniformSize() const;

    /**
     * Provides info about individual uniforms including the offset into an SkData where each
     * uniform value should be placed.
     */
    SkSpan<const Uniform> uniforms() const { return SkSpan(fUniforms); }

    /** Returns pointer to the named uniform variable's description, or nullptr if not found. */
    const Uniform* findUniform(std::string_view name) const;

    /** Returns pointer to the named attribute, or nullptr if not found. */
    const Attribute* findAttribute(std::string_view name) const;

    /** Returns pointer to the named varying, or nullptr if not found. */
    const Varying* findVarying(std::string_view name) const;

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
                        int passthroughLocalCoordsVaryingIndex,
                        uint32_t deadVaryingMask,
                        std::vector<Uniform> uniforms,
                        std::unique_ptr<const SkSL::Program>,
                        std::unique_ptr<const SkSL::Program>,
                        ColorType,
                        sk_sp<SkColorSpace>,
                        SkAlphaType);

    SkMeshSpecification(const SkMeshSpecification&) = delete;
    SkMeshSpecification(SkMeshSpecification&&) = delete;

    SkMeshSpecification& operator=(const SkMeshSpecification&) = delete;
    SkMeshSpecification& operator=(SkMeshSpecification&&) = delete;

    const std::vector<Attribute>               fAttributes;
    const std::vector<Varying>                 fVaryings;
    const std::vector<Uniform>                 fUniforms;
    const std::unique_ptr<const SkSL::Program> fVS;
    const std::unique_ptr<const SkSL::Program> fFS;
    const size_t                               fStride;
          uint32_t                             fHash;
    const int                                  fPassthroughLocalCoordsVaryingIndex;
    const uint32_t                             fDeadVaryingMask;
    const ColorType                            fColorType;
    const sk_sp<SkColorSpace>                  fColorSpace;
    const SkAlphaType                          fAlphaType;
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
 *
 * Both Make() and MakeIndexed() take a SkData with the uniform values. See
 * SkMeshSpecification::uniformSize() and SkMeshSpecification::uniforms() for sizing and packing
 * uniforms into the SkData.
 */
class SkMesh {
public:
    class IndexBuffer  : public SkRefCnt {
    public:
        virtual size_t size() const = 0;

        /**
         * Modifies the data in the IndexBuffer by copying size bytes from data into the buffer
         * at offset. Fails if offset + size > this->size() or if either offset or size is not
         * aligned to 4 bytes. The GrDirectContext* must match that used to create the buffer. We
         * take it as a parameter to emphasize that the context must be used to update the data and
         * thus the context must be valid for the current thread.
         */
        bool update(GrDirectContext*, const void* data, size_t offset, size_t size);

    private:
        virtual bool onUpdate(GrDirectContext*, const void* data, size_t offset, size_t size) = 0;
    };

    class VertexBuffer : public SkRefCnt {
    public:
        virtual size_t size() const = 0;

        /**
         * Modifies the data in the IndexBuffer by copying size bytes from data into the buffer
         * at offset. Fails if offset + size > this->size() or if either offset or size is not
         * aligned to 4 bytes. The GrDirectContext* must match that used to create the buffer. We
         * take it as a parameter to emphasize that the context must be used to update the data and
         * thus the context must be valid for the current thread.
         */
        bool update(GrDirectContext*, const void* data, size_t offset, size_t size);

    private:
        virtual bool onUpdate(GrDirectContext*, const void* data, size_t offset, size_t size) = 0;
    };

    SkMesh();
    ~SkMesh();

    SkMesh(const SkMesh&);
    SkMesh(SkMesh&&);

    SkMesh& operator=(const SkMesh&);
    SkMesh& operator=(SkMesh&&);

    /**
     * Makes an index buffer to be used with SkMeshes. The buffer may be CPU- or GPU-backed
     * depending on whether GrDirectContext* is nullptr.
     *
     * @param  GrDirectContext*  If nullptr a CPU-backed object is returned. Otherwise, the data is
     *                           uploaded to the GPU and a GPU-backed buffer is returned. It may
     *                           only be used to draw into SkSurfaces that are backed by the passed
     *                           GrDirectContext.
     * @param  data              The data used to populate the buffer, or nullptr to create a zero-
     *                           initialized buffer.
     * @param  size              Both the size of the data in 'data' and the size of the resulting
     *                           buffer.
     */
    static sk_sp<IndexBuffer> MakeIndexBuffer(GrDirectContext*, const void* data, size_t size);

    /**
     * Makes a copy of an index buffer. The implementation currently only supports a CPU-backed
     * source buffer.
     */
    static sk_sp<IndexBuffer> CopyIndexBuffer(GrDirectContext*, sk_sp<IndexBuffer>);

    /**
     * Makes a vertex buffer to be used with SkMeshes. The buffer may be CPU- or GPU-backed
     * depending on whether GrDirectContext* is nullptr.
     *
     * @param  GrDirectContext*  If nullptr a CPU-backed object is returned. Otherwise, the data is
     *                           uploaded to the GPU and a GPU-backed buffer is returned. It may
     *                           only be used to draw into SkSurfaces that are backed by the passed
     *                           GrDirectContext.
     * @param  data              The data used to populate the buffer, or nullptr to create a zero-
     *                           initialized buffer.
     * @param  size              Both the size of the data in 'data' and the size of the resulting
     *                           buffer.
     */
    static sk_sp<VertexBuffer> MakeVertexBuffer(GrDirectContext*, const void*, size_t size);

    /**
     * Makes a copy of a vertex buffer. The implementation currently only supports a CPU-backed
     * source buffer.
     */
    static sk_sp<VertexBuffer> CopyVertexBuffer(GrDirectContext*, sk_sp<VertexBuffer>);

    enum class Mode { kTriangles, kTriangleStrip };

    struct Result;

    /**
     * Creates a non-indexed SkMesh. The returned SkMesh can be tested for validity using
     * SkMesh::isValid(). An invalid mesh simply fails to draws if passed to SkCanvas::drawMesh().
     * If the mesh is invalid the returned string give contain the reason for the failure (e.g. the
     * vertex buffer was null or uniform data too small).
     */
    static Result Make(sk_sp<SkMeshSpecification>,
                       Mode,
                       sk_sp<VertexBuffer>,
                       size_t vertexCount,
                       size_t vertexOffset,
                       sk_sp<const SkData> uniforms,
                       const SkRect& bounds);

    /**
     * Creates an indexed SkMesh. The returned SkMesh can be tested for validity using
     * SkMesh::isValid(). A invalid mesh simply fails to draw if passed to SkCanvas::drawMesh().
     * If the mesh is invalid the returned string give contain the reason for the failure (e.g. the
     * index buffer was null or uniform data too small).
     */
    static Result MakeIndexed(sk_sp<SkMeshSpecification>,
                              Mode,
                              sk_sp<VertexBuffer>,
                              size_t vertexCount,
                              size_t vertexOffset,
                              sk_sp<IndexBuffer>,
                              size_t indexCount,
                              size_t indexOffset,
                              sk_sp<const SkData> uniforms,
                              const SkRect& bounds);

    sk_sp<SkMeshSpecification> refSpec() const { return fSpec; }
    SkMeshSpecification* spec() const { return fSpec.get(); }

    Mode mode() const { return fMode; }

    sk_sp<VertexBuffer> refVertexBuffer() const { return fVB; }
    VertexBuffer* vertexBuffer() const { return fVB.get(); }

    size_t vertexOffset() const { return fVOffset; }
    size_t vertexCount()  const { return fVCount;  }

    sk_sp<IndexBuffer> refIndexBuffer() const { return fIB; }
    IndexBuffer* indexBuffer() const { return fIB.get(); }

    size_t indexOffset() const { return fIOffset; }
    size_t indexCount()  const { return fICount;  }

    sk_sp<const SkData> refUniforms() const { return fUniforms; }
    const SkData* uniforms() const { return fUniforms.get(); }

    SkRect bounds() const { return fBounds; }

    bool isValid() const;

private:
    friend struct SkMeshPriv;

    std::tuple<bool, SkString> validate() const;

    sk_sp<SkMeshSpecification> fSpec;

    sk_sp<VertexBuffer> fVB;
    sk_sp<IndexBuffer>  fIB;

    sk_sp<const SkData> fUniforms;

    size_t fVOffset = 0;  // Must be a multiple of spec->stride()
    size_t fVCount  = 0;

    size_t fIOffset = 0;  // Must be a multiple of sizeof(uint16_t)
    size_t fICount  = 0;

    Mode fMode = Mode::kTriangles;

    SkRect fBounds = SkRect::MakeEmpty();
};

struct SkMesh::Result { SkMesh mesh; SkString error; };

#endif  // SK_ENABLE_SKSL

#endif
