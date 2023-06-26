/*
 * Copyright 2011 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkTArray_DEFINED
#define SkTArray_DEFINED

#include "include/private/base/SkAlignedStorage.h"
#include "include/private/base/SkAssert.h"
#include "include/private/base/SkAttributes.h"
#include "include/private/base/SkContainers.h"
#include "include/private/base/SkMalloc.h"
#include "include/private/base/SkMath.h"
#include "include/private/base/SkSpan_impl.h"
#include "include/private/base/SkTo.h"
#include "include/private/base/SkTypeTraits.h"  // IWYU pragma: keep

#include <algorithm>
#include <climits>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <initializer_list>
#include <new>
#include <utility>

namespace skia_private {
/** TArray<T> implements a typical, mostly std::vector-like array.
    Each T will be default-initialized on allocation, and ~T will be called on destruction.

    MEM_MOVE controls the behavior when a T needs to be moved (e.g. when the array is resized)
      - true: T will be bit-copied via memcpy.
      - false: T will be moved via move-constructors.
*/
template <typename T, bool MEM_MOVE = sk_is_trivially_relocatable_v<T>> class TArray {
public:
    using value_type = T;

    /**
     * Creates an empty array with no initial storage
     */
    TArray() : fOwnMemory(true), fCapacity{0} {}

    /**
     * Creates an empty array that will preallocate space for reserveCount
     * elements.
     */
    explicit TArray(int reserveCount) : TArray() { this->reserve_back(reserveCount); }

    /**
     * Copies one array to another. The new array will be heap allocated.
     */
    TArray(const TArray& that) : TArray(that.fData, that.fSize) {}

    TArray(TArray&& that) {
        if (that.fOwnMemory) {
            this->setData(that);
            that.setData({});
        } else {
            this->initData(that.fSize);
            that.move(fData);
        }
        fSize = std::exchange(that.fSize, 0);
    }

    /**
     * Creates a TArray by copying contents of a standard C array. The new
     * array will be heap allocated. Be careful not to use this constructor
     * when you really want the (void*, int) version.
     */
    TArray(const T* array, int count) {
        this->initData(count);
        this->copy(array);
    }

    /**
     * Creates a TArray by copying contents of an initializer list.
     */
    TArray(std::initializer_list<T> data) : TArray(data.begin(), data.size()) {}

    TArray& operator=(const TArray& that) {
        if (this == &that) {
            return *this;
        }
        this->clear();
        this->checkRealloc(that.size(), kExactFit);
        fSize = that.fSize;
        this->copy(that.fData);
        return *this;
    }
    TArray& operator=(TArray&& that) {
        if (this != &that) {
            this->clear();
            if (that.fOwnMemory) {
                // The storage is on the heap, so move the data pointer.
                if (fOwnMemory) {
                    sk_free(fData);
                }

                fData = std::exchange(that.fData, nullptr);

                // Can't use exchange with bitfields.
                fCapacity = that.fCapacity;
                that.fCapacity = 0;

                fOwnMemory = true;
            } else {
                // The data is stored inline in that, so move it element-by-element.
                this->checkRealloc(that.size(), kExactFit);
                that.move(fData);
            }
            fSize = std::exchange(that.fSize, 0);
        }
        return *this;
    }

    ~TArray() {
        this->destroyAll();
        if (fOwnMemory) {
            sk_free(fData);
        }
    }

    /**
     * Resets to size() = n newly constructed T objects and resets any reserve count.
     */
    void reset(int n) {
        SkASSERT(n >= 0);
        this->clear();
        this->checkRealloc(n, kExactFit);
        fSize = n;
        for (int i = 0; i < this->size(); ++i) {
            new (fData + i) T;
        }
    }

    /**
     * Resets to a copy of a C array and resets any reserve count.
     */
    void reset(const T* array, int count) {
        SkASSERT(count >= 0);
        this->clear();
        this->checkRealloc(count, kExactFit);
        fSize = count;
        this->copy(array);
    }

    /**
     * Ensures there is enough reserved space for n elements.
     */
    void reserve(int n) {
        SkASSERT(n >= 0);
        if (n > this->size()) {
            this->checkRealloc(n - this->size(), kGrowing);
        }
    }

    /**
     * Ensures there is enough reserved space for n additional elements. The is guaranteed at least
     * until the array size grows above n and subsequently shrinks below n, any version of reset()
     * is called, or reserve_back() is called again.
     */
    void reserve_back(int n) {
        SkASSERT(n >= 0);
        if (n > 0) {
            this->checkRealloc(n, kExactFit);
        }
    }

    void removeShuffle(int n) {
        SkASSERT(n < this->size());
        int newCount = fSize - 1;
        fSize = newCount;
        fData[n].~T();
        if (n != newCount) {
            this->move(n, newCount);
        }
    }

    // Is the array empty.
    bool empty() const { return fSize == 0; }

    /**
     * Adds 1 new default-initialized T value and returns it by reference. Note
     * the reference only remains valid until the next call that adds or removes
     * elements.
     */
    T& push_back() {
        void* newT = this->push_back_raw(1);
        return *new (newT) T;
    }

    /**
     * Version of above that uses a copy constructor to initialize the new item
     */
    T& push_back(const T& t) {
        void* newT = this->push_back_raw(1);
        return *new (newT) T(t);
    }

    /**
     * Version of above that uses a move constructor to initialize the new item
     */
    T& push_back(T&& t) {
        void* newT = this->push_back_raw(1);
        return *new (newT) T(std::move(t));
    }

    /**
     *  Construct a new T at the back of this array.
     */
    template<class... Args> T& emplace_back(Args&&... args) {
        void* newT = this->push_back_raw(1);
        return *new (newT) T(std::forward<Args>(args)...);
    }

    /**
     * Allocates n more default-initialized T values, and returns the address of
     * the start of that new range. Note: this address is only valid until the
     * next API call made on the array that might add or remove elements.
     */
    T* push_back_n(int n) {
        SkASSERT(n >= 0);
        T* newTs = TCast(this->push_back_raw(n));
        for (int i = 0; i < n; ++i) {
            new (&newTs[i]) T;
        }
        return newTs;
    }

    /**
     * Version of above that uses a copy constructor to initialize all n items
     * to the same T.
     */
    T* push_back_n(int n, const T& t) {
        SkASSERT(n >= 0);
        T* newTs = TCast(this->push_back_raw(n));
        for (int i = 0; i < n; ++i) {
            new (&newTs[i]) T(t);
        }
        return static_cast<T*>(newTs);
    }

    /**
     * Version of above that uses a copy constructor to initialize the n items
     * to separate T values.
     */
    T* push_back_n(int n, const T t[]) {
        SkASSERT(n >= 0);
        this->checkRealloc(n, kGrowing);
        T* end = this->end();
        for (int i = 0; i < n; ++i) {
            new (end + i) T(t[i]);
        }
        fSize += n;
        return end;
    }

    /**
     * Version of above that uses the move constructor to set n items.
     */
    T* move_back_n(int n, T* t) {
        SkASSERT(n >= 0);
        this->checkRealloc(n, kGrowing);
        T* end = this->end();
        for (int i = 0; i < n; ++i) {
            new (end + i) T(std::move(t[i]));
        }
        fSize += n;
        return end;
    }

    /**
     * Removes the last element. Not safe to call when size() == 0.
     */
    void pop_back() {
        SkASSERT(fSize > 0);
        --fSize;
        fData[fSize].~T();
    }

    /**
     * Removes the last n elements. Not safe to call when size() < n.
     */
    void pop_back_n(int n) {
        SkASSERT(n >= 0);
        SkASSERT(this->size() >= n);
        int i = fSize;
        while (i-- > fSize - n) {
            (*this)[i].~T();
        }
        fSize -= n;
    }

    /**
     * Pushes or pops from the back to resize. Pushes will be default
     * initialized.
     */
    void resize_back(int newCount) {
        SkASSERT(newCount >= 0);

        if (newCount > this->size()) {
            this->push_back_n(newCount - fSize);
        } else if (newCount < this->size()) {
            this->pop_back_n(fSize - newCount);
        }
    }

    /** Swaps the contents of this array with that array. Does a pointer swap if possible,
        otherwise copies the T values. */
    void swap(TArray& that) {
        using std::swap;
        if (this == &that) {
            return;
        }
        if (fOwnMemory && that.fOwnMemory) {
            swap(fData, that.fData);
            swap(fSize, that.fSize);

            // Can't use swap because fCapacity is a bit field.
            auto allocCount = fCapacity;
            fCapacity = that.fCapacity;
            that.fCapacity = allocCount;
        } else {
            // This could be more optimal...
            TArray copy(std::move(that));
            that = std::move(*this);
            *this = std::move(copy);
        }
    }

    T* begin() {
        return fData;
    }
    const T* begin() const {
        return fData;
    }

    // It's safe to use fItemArray + fSize because if fItemArray is nullptr then adding 0 is
    // valid and returns nullptr. See [expr.add] in the C++ standard.
    T* end() {
        if (fData == nullptr) {
            SkASSERT(fSize == 0);
        }
        return fData + fSize;
    }
    const T* end() const {
        if (fData == nullptr) {
            SkASSERT(fSize == 0);
        }
        return fData + fSize;
    }
    T* data() { return fData; }
    const T* data() const { return fData; }
    int size() const { return fSize; }
    size_t size_bytes() const { return this->bytes(fSize); }
    void resize(size_t count) { this->resize_back((int)count); }

    void clear() {
        this->destroyAll();
        fSize = 0;
    }

    void shrink_to_fit() {
        if (!fOwnMemory || fSize == fCapacity) {
            return;
        }
        if (fSize == 0) {
            sk_free(fData);
            fData = nullptr;
            fCapacity = 0;
        } else {
            SkSpan<std::byte> allocation = Allocate(fSize);
            this->move(TCast(allocation.data()));
            if (fOwnMemory) {
                sk_free(fData);
            }
            this->setDataFromBytes(allocation);
        }
    }

    /**
     * Get the i^th element.
     */
    T& operator[] (int i) {
        SkASSERT(i < this->size());
        SkASSERT(i >= 0);
        return fData[i];
    }

    const T& operator[] (int i) const {
        SkASSERT(i < this->size());
        SkASSERT(i >= 0);
        return fData[i];
    }

    T& at(int i) { return (*this)[i]; }
    const T& at(int i) const { return (*this)[i]; }

    /**
     * equivalent to operator[](0)
     */
    T& front() { SkASSERT(fSize > 0); return fData[0];}

    const T& front() const { SkASSERT(fSize > 0); return fData[0];}

    /**
     * equivalent to operator[](size() - 1)
     */
    T& back() { SkASSERT(fSize); return fData[fSize - 1];}

    const T& back() const { SkASSERT(fSize > 0); return fData[fSize - 1];}

    /**
     * equivalent to operator[](size()-1-i)
     */
    T& fromBack(int i) {
        SkASSERT(i >= 0);
        SkASSERT(i < this->size());
        return fData[fSize - i - 1];
    }

    const T& fromBack(int i) const {
        SkASSERT(i >= 0);
        SkASSERT(i < this->size());
        return fData[fSize - i - 1];
    }

    bool operator==(const TArray<T, MEM_MOVE>& right) const {
        int leftCount = this->size();
        if (leftCount != right.size()) {
            return false;
        }
        for (int index = 0; index < leftCount; ++index) {
            if (fData[index] != right.fData[index]) {
                return false;
            }
        }
        return true;
    }

    bool operator!=(const TArray<T, MEM_MOVE>& right) const {
        return !(*this == right);
    }

    int capacity() const {
        return fCapacity;
    }

protected:
    // Creates an empty array that will use the passed storage block until it is insufficiently
    // large to hold the entire array.
    template <int InitialCapacity>
    TArray(SkAlignedSTStorage<InitialCapacity, T>* storage, int size = 0) {
        static_assert(InitialCapacity >= 0);
        SkASSERT(size >= 0);
        SkASSERT(storage->get() != nullptr);
        if (size > InitialCapacity) {
            this->initData(size);
        } else {
            this->setDataFromBytes(*storage);
            fSize = size;

            // setDataFromBytes always sets fOwnMemory to true, but we are actually using static
            // storage here, which shouldn't ever be freed.
            fOwnMemory = false;
        }
    }

    // Copy a C array, using pre-allocated storage if preAllocCount >= count. Otherwise, storage
    // will only be used when array shrinks to fit.
    template <int InitialCapacity>
    TArray(const T* array, int size, SkAlignedSTStorage<InitialCapacity, T>* storage)
        : TArray{storage, size}
    {
        this->copy(array);
    }

private:
    // Growth factors for checkRealloc.
    static constexpr double kExactFit = 1.0;
    static constexpr double kGrowing = 1.5;

    static constexpr int kMinHeapAllocCount = 8;
    static_assert(SkIsPow2(kMinHeapAllocCount), "min alloc count not power of two.");

    // Note for 32-bit machines kMaxCapacity will be <= SIZE_MAX. For 64-bit machines it will
    // just be INT_MAX if the sizeof(T) < 2^32.
    static constexpr int kMaxCapacity = SkToInt(std::min(SIZE_MAX / sizeof(T), (size_t)INT_MAX));

    void setDataFromBytes(SkSpan<std::byte> allocation) {
        T* data = TCast(allocation.data());
        // We have gotten extra bytes back from the allocation limit, pin to kMaxCapacity. It
        // would seem like the SkContainerAllocator should handle the divide, but it would have
        // to a full divide instruction. If done here the size is known at compile, and usually
        // can be implemented by a right shift. The full divide takes ~50X longer than the shift.
        size_t size = std::min(allocation.size() / sizeof(T), SkToSizeT(kMaxCapacity));
        setData(SkSpan<T>(data, size));
    }

    void setData(SkSpan<T> array) {
        fData = array.data();
        fCapacity = SkToU32(array.size());
        fOwnMemory = true;
    }

    // We disable Control-Flow Integrity sanitization (go/cfi) when casting item-array buffers.
    // CFI flags this code as dangerous because we are casting `buffer` to a T* while the buffer's
    // contents might still be uninitialized memory. When T has a vtable, this is especially risky
    // because we could hypothetically access a virtual method on fItemArray and jump to an
    // unpredictable location in memory. Of course, TArray won't actually use fItemArray in this
    // way, and we don't want to construct a T before the user requests one. There's no real risk
    // here, so disable CFI when doing these casts.
    SK_CLANG_NO_SANITIZE("cfi")
    static T* TCast(void* buffer) {
        return (T*)buffer;
    }

    size_t bytes(int n) const {
        SkASSERT(n <= kMaxCapacity);
        return SkToSizeT(n) * sizeof(T);
    }

    static SkSpan<std::byte> Allocate(int capacity, double growthFactor = 1.0) {
        return SkContainerAllocator{sizeof(T), kMaxCapacity}.allocate(capacity, growthFactor);
    }

    void initData(int count) {
        this->setDataFromBytes(Allocate(count));
        fSize = count;
    }

    void destroyAll() {
        if (!this->empty()) {
            T* cursor = this->begin();
            T* const end = this->end();
            do {
                cursor->~T();
                cursor++;
            } while (cursor < end);
        }
    }

    /** In the following move and copy methods, 'dst' is assumed to be uninitialized raw storage.
     *  In the following move methods, 'src' is destroyed leaving behind uninitialized raw storage.
     */
    void copy(const T* src) {
        if constexpr (std::is_trivially_copyable_v<T>) {
            if (!this->empty() && src != nullptr) {
                sk_careful_memcpy(fData, src, this->size_bytes());
            }
        } else {
            for (int i = 0; i < this->size(); ++i) {
                new (fData + i) T(src[i]);
            }
        }
    }

    void move(int dst, int src) {
        if constexpr (MEM_MOVE) {
            memcpy(static_cast<void*>(&fData[dst]),
                   static_cast<const void*>(&fData[src]),
                   sizeof(T));
        } else {
            new (&fData[dst]) T(std::move(fData[src]));
            fData[src].~T();
        }
    }

    void move(void* dst) {
        if constexpr (MEM_MOVE) {
            sk_careful_memcpy(dst, fData, this->bytes(fSize));
        } else {
            for (int i = 0; i < this->size(); ++i) {
                new (static_cast<char*>(dst) + this->bytes(i)) T(std::move(fData[i]));
                fData[i].~T();
            }
        }
    }

    // Helper function that makes space for n objects, adjusts the count, but does not initialize
    // the new objects.
    void* push_back_raw(int n) {
        this->checkRealloc(n, kGrowing);
        void* ptr = fData + fSize;
        fSize += n;
        return ptr;
    }

    void checkRealloc(int delta, double growthFactor) {
        // This constant needs to be declared in the function where it is used to work around
        // MSVC's persnickety nature about template definitions.
        SkASSERT(delta >= 0);
        SkASSERT(fSize >= 0);
        SkASSERT(fCapacity >= 0);

        // Return if there are enough remaining allocated elements to satisfy the request.
        if (this->capacity() - fSize >= delta) {
            return;
        }

        // Don't overflow fSize or size_t later in the memory allocation. Overflowing memory
        // allocation really only applies to fSizes on 32-bit machines; on 64-bit machines this
        // will probably never produce a check. Since kMaxCapacity is bounded above by INT_MAX,
        // this also checks the bounds of fSize.
        if (delta > kMaxCapacity - fSize) {
            sk_report_container_overflow_and_die();
        }
        const int newCount = fSize + delta;

        SkSpan<std::byte> allocation = Allocate(newCount, growthFactor);

        this->move(TCast(allocation.data()));
        if (fOwnMemory) {
            sk_free(fData);
        }
        this->setDataFromBytes(allocation);
        SkASSERT(this->capacity() >= newCount);
        SkASSERT(fData != nullptr);
    }

    T* fData{nullptr};
    int fSize{0};
    uint32_t fOwnMemory : 1;
    uint32_t fCapacity : 31;
};

template <typename T, bool M> static inline void swap(TArray<T, M>& a, TArray<T, M>& b) {
    a.swap(b);
}

// Subclass of TArray that contains a pre-allocated memory block for the array.
template <int N, typename T, bool MEM_MOVE = sk_is_trivially_relocatable_v<T>>
class STArray : private SkAlignedSTStorage<N,T>, public TArray<T, MEM_MOVE> {
    static_assert(N > 0);
    using Storage = SkAlignedSTStorage<N,T>;

public:
    STArray()
        : Storage{}
        , TArray<T, MEM_MOVE>(this) {}  // Must use () to avoid confusion with initializer_list
                                        // when T=bool because * are convertable to bool.

    STArray(const T* array, int count)
        : Storage{}
        , TArray<T, MEM_MOVE>{array, count, this} {}

    STArray(std::initializer_list<T> data)
        : STArray{data.begin(), SkToInt(data.size())} {}

    explicit STArray(int reserveCount)
        : STArray() { this->reserve_back(reserveCount); }

    STArray(const STArray& that)
        : STArray() { *this = that; }

    explicit STArray(const TArray<T, MEM_MOVE>& that)
        : STArray() { *this = that; }

    STArray(STArray&& that)
        : STArray() { *this = std::move(that); }

    explicit STArray(TArray<T, MEM_MOVE>&& that)
        : STArray() { *this = std::move(that); }

    STArray& operator=(const STArray& that) {
        TArray<T, MEM_MOVE>::operator=(that);
        return *this;
    }

    STArray& operator=(const TArray<T, MEM_MOVE>& that) {
        TArray<T, MEM_MOVE>::operator=(that);
        return *this;
    }

    STArray& operator=(STArray&& that) {
        TArray<T, MEM_MOVE>::operator=(std::move(that));
        return *this;
    }

    STArray& operator=(TArray<T, MEM_MOVE>&& that) {
        TArray<T, MEM_MOVE>::operator=(std::move(that));
        return *this;
    }

    // Force the use of TArray for data() and size().
    using TArray<T, MEM_MOVE>::data;
    using TArray<T, MEM_MOVE>::size;
};
}  // namespace skia_private
#endif  // SkTArray_DEFINED
