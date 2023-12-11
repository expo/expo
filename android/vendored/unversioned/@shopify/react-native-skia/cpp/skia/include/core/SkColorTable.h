/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkColorTable_DEFINED
#define SkColorTable_DEFINED

#include "include/core/SkBitmap.h"
#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

#include <cstdint>

class SkReadBuffer;
class SkWriteBuffer;

/**
 * SkColorTable holds the lookup tables for each channel (ARGB) used to define the filter behavior
 * of `SkColorFilters::Table`, and provides a way to share the table data between client code and
 * the returned SkColorFilter. Once created, an SkColorTable is immutable.
*/
class SK_API SkColorTable : public SkRefCnt {
public:
    // Creates a new SkColorTable with 'table' used for all four channels. The table is copied into
    // the SkColorTable.
    static sk_sp<SkColorTable> Make(const uint8_t table[256]) {
        return Make(table, table, table, table);
    }

    // Creates a new SkColorTable with the per-channel lookup tables. Each non-null table is copied
    // into the SkColorTable. Null parameters are interpreted as the identity table.
    static sk_sp<SkColorTable> Make(const uint8_t tableA[256],
                                    const uint8_t tableR[256],
                                    const uint8_t tableG[256],
                                    const uint8_t tableB[256]);

    // Per-channel constant value lookup (0-255).
    const uint8_t* alphaTable() const { return fTable.getAddr8(0, 0); }
    const uint8_t* redTable()   const { return fTable.getAddr8(0, 1); }
    const uint8_t* greenTable() const { return fTable.getAddr8(0, 2); }
    const uint8_t* blueTable()  const { return fTable.getAddr8(0, 3); }

    void flatten(SkWriteBuffer& buffer) const;

    static sk_sp<SkColorTable> Deserialize(SkReadBuffer& buffer);

private:
    friend class SkTableColorFilter; // for bitmap()

    SkColorTable(const SkBitmap& table) : fTable(table) {}

    // The returned SkBitmap is immutable; attempting to modify its pixel data will trigger asserts
    // in debug builds and cause undefined behavior in release builds.
    const SkBitmap& bitmap() const { return fTable; }

    SkBitmap fTable; // A 256x4 A8 image
};

#endif // SkColorTable_DEFINED
