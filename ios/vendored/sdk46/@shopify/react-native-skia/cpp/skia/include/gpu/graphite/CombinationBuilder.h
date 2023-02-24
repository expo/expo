/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_CombinationBuilder_DEFINED
#define skgpu_graphite_CombinationBuilder_DEFINED

#include "include/core/SkTypes.h"

#ifdef SK_ENABLE_PRECOMPILE

#include <functional>
#include <memory>
#include <vector>
#include "include/core/SkBlendMode.h"
#include "include/core/SkSpan.h"
#include "include/core/SkTileMode.h"
#include "include/private/SkTArray.h"
#include "include/private/SkTHash.h"

class SkArenaAllocWithReset;
class SkKeyContext;
class SkPaintParamsKeyBuilder;
class SkShaderCodeDictionary;
class SkUniquePaintParamsID;

namespace skgpu::graphite {

class CombinationBuilder;
class CombinationBuilderTestAccess;
class Context;
class Option;

enum class ShaderType : uint32_t {
    kSolidColor,

    kLinearGradient,
    kRadialGradient,
    kSweepGradient,
    kConicalGradient,

    kLocalMatrix,
    kImage,
    kPorterDuffBlendShader,
    kBlendShader,

    kLast          = kBlendShader
};

static constexpr int kShaderTypeCount = static_cast<int>(ShaderType::kLast) + 1;

struct TileModePair {
    SkTileMode fX;
    SkTileMode fY;

    bool operator==(const TileModePair& other) const { return fX == other.fX && fY == other.fY; }
    bool operator!=(const TileModePair& other) const { return !(*this == other); }
};

// TODO: add ShaderID and ColorFilterID too
class BlenderID {
public:
    BlenderID() : fID(0) {}  // 0 is an invalid blender ID
    BlenderID(const BlenderID& src) : fID(src.fID) {}

    bool isValid() const { return fID > 0; }

    bool operator==(const BlenderID& other) const { return fID == other.fID; }

    BlenderID& operator=(const BlenderID& src) {
        fID = src.fID;
        return *this;
    }

private:
    friend class ::SkShaderCodeDictionary;   // for ctor and asUInt access
    friend class CombinationBuilder;         // for asUInt access

    BlenderID(uint32_t id) : fID(id) {}

    uint32_t asUInt() const { return fID; }

    uint32_t fID;
};

// When combination options are added to the combination builder an CombinationOption
// object is frequently returned. This allows options to be added, recursively, to the
// previously added options.
// Note: CombinationOptions are stable memory-wise so, once returned, they are valid
// until CombinationBuilder::reset is called.
class CombinationOption {
public:
    CombinationOption addChildOption(int childIndex, ShaderType);

    CombinationOption addChildOption(int childIndex, ShaderType,
                                     int minNumStops, int maxNumStops);

    CombinationOption addChildOption(int childIndex, ShaderType,
                                     SkSpan<TileModePair> tileModes);

    bool isValid() const { return fDataInArena; }

private:
    friend class CombinationBuilder; // for ctor
    friend class CombinationBuilderTestAccess;

    CombinationOption(CombinationBuilder* builder, Option* dataInArena)
            : fBuilder(builder)
            , fDataInArena(dataInArena) {}

    ShaderType type() const;
    int numChildSlots() const;
    SkDEBUGCODE(int epoch() const;)

    CombinationBuilder* fBuilder;
    Option* fDataInArena;
};

class CombinationBuilder {
public:
    enum class BlendModeGroup {
        kPorterDuff,         // [ kClear .. kScreen ]
        kAdvanced,           // [ kOverlay .. kMultiply ]
        kColorAware,         // [ kHue .. kLuminosity ]
        kAll
    };

    CombinationBuilder(SkShaderCodeDictionary*);
    ~CombinationBuilder();

    // Blend Modes
    void addOption(SkBlendMode);
    void addOption(SkBlendMode rangeStart, SkBlendMode rangeEnd); // inclusive
    void addOption(BlendModeGroup);

    // TODO: have this variant return an CombinationOption object
    void addOption(BlenderID);

    // Shaders
    CombinationOption addOption(ShaderType);
    CombinationOption addOption(ShaderType, int minNumStops, int maxNumStops);  // inclusive
    CombinationOption addOption(ShaderType, SkSpan<TileModePair> tileModes);

    void reset();

private:
    friend class Context;                        // for access to 'buildCombinations'
    friend class CombinationOption;              // for 'addOptionInternal' and 'arena'
    friend class CombinationBuilderTestAccess;   // for 'num*Combinations' and 'epoch'

    int numShaderCombinations() const;
    int numBlendModeCombinations() const;
    int numCombinations() {
        return this->numShaderCombinations() * this->numBlendModeCombinations();
    }

    // 'desiredCombination' must be less than numCombinations
    void createKey(const SkKeyContext&, int desiredCombination, SkPaintParamsKeyBuilder*);

#ifdef SK_DEBUG
    void dump() const;
    int epoch() const { return fEpoch; }
#endif

    SkArenaAllocWithReset* arena() { return fArena.get(); }

    template<typename T, typename... Args>
    Option* allocInArena(Args&&... args);

    Option* addOptionInternal(ShaderType);
    Option* addOptionInternal(ShaderType, int minNumStops, int maxNumStops);
    Option* addOptionInternal(ShaderType, SkSpan<TileModePair> tileModes);

    void buildCombinations(SkShaderCodeDictionary*,
                           const std::function<void(SkUniquePaintParamsID)>&);

    SkShaderCodeDictionary* fDictionary;
    std::unique_ptr<SkArenaAllocWithReset> fArena;
    SkTArray<Option*> fShaderOptions;

    uint32_t fBlendModes;
    // TODO: store the SkBlender-based blenders in the arena
    SkTHashSet<BlenderID> fBlenders;

    SkDEBUGCODE(int fEpoch = 0;)
};

} // namespace skgpu::graphite

#endif // SK_ENABLE_PRECOMPILE

#endif // skgpu_graphite_CombinationBuilder_DEFINED
