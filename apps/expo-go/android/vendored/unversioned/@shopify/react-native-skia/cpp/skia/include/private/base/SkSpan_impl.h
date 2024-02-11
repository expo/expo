/*
 * Copyright 2018 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSpan_DEFINED
#define SkSpan_DEFINED

#include "include/private/base/SkAssert.h"
#include "include/private/base/SkDebug.h"
#include "include/private/base/SkTo.h"

#include <cstddef>
#include <initializer_list>
#include <iterator>
#include <limits>
#include <utility>

// Having this be an export works around IWYU churn related to
// https://github.com/include-what-you-use/include-what-you-use/issues/1121
#include <type_traits> // IWYU pragma: export

// Add macro to check the lifetime of initializer_list arguments. initializer_list has a very
// short life span, and can only be used as a parameter, and not as a variable.
#if defined(__clang__) && defined(__has_cpp_attribute) && __has_cpp_attribute(clang::lifetimebound)
#define SK_CHECK_IL_LIFETIME [[clang::lifetimebound]]
#else
#define SK_CHECK_IL_LIFETIME
#endif

/**
 * SkSpan holds a reference to contiguous data of type T along with a count. SkSpan does not own
 * the data itself but is merely a reference, therefore you must take care with the lifetime of
 * the underlying data.
 *
 * SkSpan is a count and a pointer into existing array or data type that stores its data in
 * contiguous memory like std::vector. Any container that works with std::size() and std::data()
 * can be used.
 *
 * SkSpan makes a convenient parameter for a routine to accept array like things. This allows you to
 * write the routine without overloads for all different container types.
 *
 * Example:
 *     void routine(SkSpan<const int> a) { ... }
 *
 *     std::vector v = {1, 2, 3, 4, 5};
 *
 *     routine(a);
 *
 * A word of caution when working with initializer_list, initializer_lists have a lifetime that is
 * limited to the current statement. The following is correct and safe:
 *
 * Example:
 *     routine({1,2,3,4,5});
 *
 * The following is undefined, and will result in erratic execution:
 *
 * Bad Example:
 *     initializer_list l = {1, 2, 3, 4, 5};   // The data behind l dies at the ;.
 *     routine(l);
 */
template <typename T>
class SkSpan {
public:
    constexpr SkSpan() : fPtr{nullptr}, fSize{0} {}

    template <typename Integer, std::enable_if_t<std::is_integral_v<Integer>, bool> = true>
    constexpr SkSpan(T* ptr, Integer size) : fPtr{ptr}, fSize{SkToSizeT(size)} {
        SkASSERT(ptr || fSize == 0);  // disallow nullptr + a nonzero size
        SkASSERT(fSize < kMaxSize);
    }
    template <typename U, typename = std::enable_if_t<std::is_same_v<const U, T>>>
    constexpr SkSpan(const SkSpan<U>& that) : fPtr(std::data(that)), fSize(std::size(that)) {}
    constexpr SkSpan(const SkSpan& o) = default;
    template<size_t N> constexpr SkSpan(T(&a)[N]) : SkSpan(a, N) { }
    template<typename Container>
    constexpr SkSpan(Container&& c) : SkSpan(std::data(c), std::size(c)) { }
    SkSpan(std::initializer_list<T> il SK_CHECK_IL_LIFETIME)
            : SkSpan(std::data(il), std::size(il)) {}

    constexpr SkSpan& operator=(const SkSpan& that) = default;

    constexpr T& operator [] (size_t i) const {
        return fPtr[sk_collection_check_bounds(i, this->size())];
    }
    constexpr T& front() const { sk_collection_not_empty(this->empty()); return fPtr[0]; }
    constexpr T& back()  const { sk_collection_not_empty(this->empty()); return fPtr[fSize - 1]; }
    constexpr T* begin() const { return fPtr; }
    constexpr T* end() const { return fPtr + fSize; }
    constexpr auto rbegin() const { return std::make_reverse_iterator(this->end()); }
    constexpr auto rend() const { return std::make_reverse_iterator(this->begin()); }
    constexpr T* data() const { return this->begin(); }
    constexpr size_t size() const { return fSize; }
    constexpr bool empty() const { return fSize == 0; }
    constexpr size_t size_bytes() const { return fSize * sizeof(T); }
    constexpr SkSpan<T> first(size_t prefixLen) const {
        return SkSpan{fPtr, sk_collection_check_length(prefixLen, fSize)};
    }
    constexpr SkSpan<T> last(size_t postfixLen) const {
        return SkSpan{fPtr + (this->size() - postfixLen),
                      sk_collection_check_length(postfixLen, fSize)};
    }
    constexpr SkSpan<T> subspan(size_t offset) const {
        return this->subspan(offset, this->size() - offset);
    }
    constexpr SkSpan<T> subspan(size_t offset, size_t count) const {
        const size_t safeOffset = sk_collection_check_length(offset, fSize);

        // Should read offset + count > size(), but that could overflow. We know that safeOffset
        // is <= size, therefore the subtraction will not overflow.
        if (count > this->size() - safeOffset) SK_UNLIKELY {
            // The count is too large.
            SkUNREACHABLE;
        }
        return SkSpan{fPtr + safeOffset, count};
    }

private:
    static constexpr size_t kMaxSize = std::numeric_limits<size_t>::max() / sizeof(T);

    T* fPtr;
    size_t fSize;
};

template <typename Container>
SkSpan(Container&&) ->
        SkSpan<std::remove_pointer_t<decltype(std::data(std::declval<Container>()))>>;

#endif  // SkSpan_DEFINED
