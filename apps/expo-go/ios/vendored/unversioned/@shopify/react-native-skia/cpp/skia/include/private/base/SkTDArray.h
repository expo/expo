/*
 * Copyright 2006 The Android Open Source Project
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkTDArray_DEFINED
#define SkTDArray_DEFINED

#include "include/private/base/SkAPI.h"
#include "include/private/base/SkAssert.h"
#include "include/private/base/SkDebug.h"
#include "include/private/base/SkTo.h"

#include <algorithm>
#include <cstddef>
#include <initializer_list>

class SK_SPI SkTDStorage {
public:
    explicit SkTDStorage(int sizeOfT);
    SkTDStorage(const void* src, int size, int sizeOfT);

    // Copy
    SkTDStorage(const SkTDStorage& that);
    SkTDStorage& operator= (const SkTDStorage& that);

    // Move
    SkTDStorage(SkTDStorage&& that);
    SkTDStorage& operator= (SkTDStorage&& that);

    ~SkTDStorage();

    void reset();
    void swap(SkTDStorage& that);

    // Size routines
    bool empty() const { return fSize == 0; }
    void clear() { fSize = 0; }
    int size() const { return fSize; }
    void resize(int newSize);
    size_t size_bytes() const { return this->bytes(fSize); }

    // Capacity routines
    int capacity() const { return fCapacity; }
    void reserve(int newCapacity);
    void shrink_to_fit();

    void* data() { return fStorage; }
    const void* data() const { return fStorage; }

    // Deletion routines
    void erase(int index, int count);
    // Removes the entry at 'index' and replaces it with the last array element
    void removeShuffle(int index);

    // Insertion routines
    void* prepend();

    void append();
    void append(int count);
    void* append(const void* src, int count);

    void* insert(int index);
    void* insert(int index, int count, const void* src);

    void pop_back() {
        SkASSERT(fSize > 0);
        fSize--;
    }

    friend bool operator==(const SkTDStorage& a, const SkTDStorage& b);
    friend bool operator!=(const SkTDStorage& a, const SkTDStorage& b) {
        return !(a == b);
    }

private:
    size_t bytes(int n) const { return SkToSizeT(n * fSizeOfT); }
    void* address(int n) { return fStorage + this->bytes(n); }

    // Adds delta to fSize. Crash if outside [0, INT_MAX]
    int calculateSizeOrDie(int delta);

    // Move the tail of the array defined by the indexes tailStart and tailEnd to dstIndex. The
    // elements at dstIndex are overwritten by the tail.
    void moveTail(int dstIndex, int tailStart, int tailEnd);

    // Copy src into the array at dstIndex.
    void copySrc(int dstIndex, const void* src, int count);

    const int fSizeOfT;
    std::byte* fStorage{nullptr};
    int fCapacity{0};  // size of the allocation in fArray (#elements)
    int fSize{0};    // logical number of elements (fSize <= fCapacity)
};

static inline void swap(SkTDStorage& a, SkTDStorage& b) {
    a.swap(b);
}

// SkTDArray<T> implements a std::vector-like array for raw data-only objects that do not require
// construction or destruction. The constructor and destructor for T will not be called; T objects
// will always be moved via raw memcpy. Newly created T objects will contain uninitialized memory.
template <typename T> class SkTDArray {
public:
    SkTDArray() : fStorage{sizeof(T)} {}
    SkTDArray(const T src[], int count) : fStorage{src, count, sizeof(T)} { }
    SkTDArray(const std::initializer_list<T>& list) : SkTDArray(list.begin(), list.size()) {}

    // Copy
    SkTDArray(const SkTDArray<T>& src) : SkTDArray(src.data(), src.size()) {}
    SkTDArray<T>& operator=(const SkTDArray<T>& src) {
        fStorage = src.fStorage;
        return *this;
    }

    // Move
    SkTDArray(SkTDArray<T>&& src) : fStorage{std::move(src.fStorage)} {}
    SkTDArray<T>& operator=(SkTDArray<T>&& src) {
        fStorage = std::move(src.fStorage);
        return *this;
    }

    friend bool operator==(const SkTDArray<T>& a, const SkTDArray<T>& b) {
        return a.fStorage == b.fStorage;
    }
    friend bool operator!=(const SkTDArray<T>& a, const SkTDArray<T>& b) { return !(a == b); }

    void swap(SkTDArray<T>& that) {
        using std::swap;
        swap(fStorage, that.fStorage);
    }

    bool empty() const { return fStorage.empty(); }

    // Return the number of elements in the array
    int size() const { return fStorage.size(); }

    // Return the total number of elements allocated.
    // Note: capacity() - size() gives you the number of elements you can add without causing an
    // allocation.
    int capacity() const { return fStorage.capacity(); }

    // return the number of bytes in the array: count * sizeof(T)
    size_t size_bytes() const { return fStorage.size_bytes(); }

    T*       data() { return static_cast<T*>(fStorage.data()); }
    const T* data() const { return static_cast<const T*>(fStorage.data()); }
    T*       begin() { return this->data(); }
    const T* begin() const { return this->data(); }
    T*       end() { return this->data() + this->size(); }
    const T* end() const { return this->data() + this->size(); }

    T& operator[](int index) {
        return this->data()[sk_collection_check_bounds(index, this->size())];
    }
    const T& operator[](int index) const {
        return this->data()[sk_collection_check_bounds(index, this->size())];
    }

    const T& back() const {
        sk_collection_not_empty(this->empty());
        return this->data()[this->size() - 1];
    }
    T& back() {
        sk_collection_not_empty(this->empty());
        return this->data()[this->size() - 1];
    }

    void reset() {
        fStorage.reset();
    }

    void clear() {
        fStorage.clear();
    }

     // Sets the number of elements in the array.
     // If the array does not have space for count elements, it will increase
     // the storage allocated to some amount greater than that required.
     // It will never shrink the storage.
    void resize(int count) {
        fStorage.resize(count);
    }

    void reserve(int n) {
        fStorage.reserve(n);
    }

    T* append() {
        fStorage.append();
        return this->end() - 1;
    }
    T* append(int count) {
        fStorage.append(count);
        return this->end() - count;
    }
    T* append(int count, const T* src) {
        return static_cast<T*>(fStorage.append(src, count));
    }

    T* insert(int index) {
        return static_cast<T*>(fStorage.insert(index));
    }
    T* insert(int index, int count, const T* src = nullptr) {
        return static_cast<T*>(fStorage.insert(index, count, src));
    }

    void remove(int index, int count = 1) {
        fStorage.erase(index, count);
    }

    void removeShuffle(int index) {
        fStorage.removeShuffle(index);
    }

    // routines to treat the array like a stack
    void push_back(const T& v) {
        this->append();
        this->back() = v;
    }
    void pop_back() { fStorage.pop_back(); }

    void shrink_to_fit() {
        fStorage.shrink_to_fit();
    }

private:
    SkTDStorage fStorage;
};

template <typename T> static inline void swap(SkTDArray<T>& a, SkTDArray<T>& b) { a.swap(b); }

#endif
