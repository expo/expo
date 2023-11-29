/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkAnySubclass_DEFINED
#define SkAnySubclass_DEFINED

#include "include/private/base/SkAssert.h"

#include <cstddef>
#include <new>
#include <type_traits>  // IWYU pragma: keep
#include <utility>

/**
 *  Stores any subclass `T` of `Base`, where sizeof(T) <= `Size`, without using the heap.
 *  Doesn't need advance knowledge of T, so it's particularly suited to platform or backend
 *  implementations of a generic interface, where the set of possible subclasses is finite and
 *  known, but can't be made available at compile-time.
 */
template <typename Base, size_t Size>
class SkAnySubclass {
public:
    SkAnySubclass() = default;
    ~SkAnySubclass() {
        this->reset();
    }

    SkAnySubclass(const SkAnySubclass&) = delete;
    SkAnySubclass& operator=(const SkAnySubclass&) = delete;
    SkAnySubclass(SkAnySubclass&&) = delete;
    SkAnySubclass& operator=(SkAnySubclass&&) = delete;

    template <typename T, typename... Args>
    void emplace(Args&&... args) {
        static_assert(std::is_base_of_v<Base, T>);
        static_assert(sizeof(T) <= Size);
        // We're going to clean up our stored object by calling ~Base:
        static_assert(std::has_virtual_destructor_v<Base> || std::is_trivially_destructible_v<T>);
        SkASSERT(!fValid);
        new (fData) T(std::forward<Args>(args)...);
        fValid = true;
    }

    void reset() {
        if (fValid) {
            this->get()->~Base();
        }
        fValid = false;
    }

    const Base* get() const {
        SkASSERT(fValid);
        return std::launder(reinterpret_cast<const Base*>(fData));
    }

    Base* get() {
        SkASSERT(fValid);
        return std::launder(reinterpret_cast<Base*>(fData));
    }

    Base* operator->() { return this->get(); }
    const Base* operator->() const { return this->get(); }

private:
    alignas(8) std::byte fData[Size];
    bool fValid = false;
};

#endif  // SkAnySubclass_DEFINED
