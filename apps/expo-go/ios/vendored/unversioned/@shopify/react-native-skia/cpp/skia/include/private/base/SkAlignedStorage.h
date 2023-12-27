// Copyright 2022 Google LLC
// Use of this source code is governed by a BSD-style license that can be found in the LICENSE file.

#ifndef SkAlignedStorage_DEFINED
#define SkAlignedStorage_DEFINED

#include <cstddef>
#include <iterator>

template <int N, typename T> class SkAlignedSTStorage {
public:
    SkAlignedSTStorage() {}
    SkAlignedSTStorage(SkAlignedSTStorage&&) = delete;
    SkAlignedSTStorage(const SkAlignedSTStorage&) = delete;
    SkAlignedSTStorage& operator=(SkAlignedSTStorage&&) = delete;
    SkAlignedSTStorage& operator=(const SkAlignedSTStorage&) = delete;

    // Returns void* because this object does not initialize the
    // memory. Use placement new for types that require a constructor.
    void* get() { return fStorage; }
    const void* get() const { return fStorage; }

    // Act as a container of bytes because the storage is uninitialized.
    std::byte* data() { return fStorage; }
    const std::byte* data() const { return fStorage; }
    size_t size() const { return std::size(fStorage); }

private:
    alignas(T) std::byte fStorage[sizeof(T) * N];
};

#endif  // SkAlignedStorage_DEFINED
