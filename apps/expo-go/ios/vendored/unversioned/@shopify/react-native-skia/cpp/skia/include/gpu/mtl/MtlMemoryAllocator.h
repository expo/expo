/*
 * Copyright 2022 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_MtlMemoryAllocator_DEFINED
#define skgpu_MtlMemoryAllocator_DEFINED

#ifdef __APPLE__

#ifdef __OBJC__
#import <Metal/Metal.h>
#endif

namespace skgpu {

// interface classes for the GPU memory allocator
class MtlAlloc : public SkRefCnt {
public:
    ~MtlAlloc() override = default;
};

#ifdef __OBJC__
class MtlMemoryAllocator : public SkRefCnt {
public:
    virtual id<MTLBuffer> newBufferWithLength(NSUInteger length, MTLResourceOptions options,
                                              sk_sp<MtlAlloc>* allocation) = 0;
    virtual id<MTLTexture> newTextureWithDescriptor(MTLTextureDescriptor* texDesc,
                                                    sk_sp<MtlAlloc>* allocation) = 0;
};
#endif

}  // namespace skgpu

#endif // __APPLE__

#endif // skgpu_MtlMemoryAllocator_DEFINED
