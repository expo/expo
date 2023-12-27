// Copyright 2019 Google LLC.

#ifndef DartTypes_DEFINED
#define DartTypes_DEFINED

#include "include/core/SkRect.h"
#include "include/core/SkTypes.h"

#include <algorithm>
#include <iterator>
#include <limits>

namespace skia {
namespace textlayout {

enum Affinity { kUpstream, kDownstream };

enum class RectHeightStyle {
    // Provide tight bounding boxes that fit heights per run.
    kTight,

    // The height of the boxes will be the maximum height of all runs in the
    // line. All rects in the same line will be the same height.
    kMax,

    // Extends the top and/or bottom edge of the bounds to fully cover any line
    // spacing. The top edge of each line should be the same as the bottom edge
    // of the line above. There should be no gaps in vertical coverage given any
    // ParagraphStyle line_height.
    //
    // The top and bottom of each rect will cover half of the
    // space above and half of the space below the line.
    kIncludeLineSpacingMiddle,
    // The line spacing will be added to the top of the rect.
    kIncludeLineSpacingTop,
    // The line spacing will be added to the bottom of the rect.
    kIncludeLineSpacingBottom,
    //
    kStrut
};

enum class RectWidthStyle {
    // Provide tight bounding boxes that fit widths to the runs of each line
    // independently.
    kTight,

    // Extends the width of the last rect of each line to match the position of
    // the widest rect over all the lines.
    kMax
};

enum class TextAlign {
    kLeft,
    kRight,
    kCenter,
    kJustify,
    kStart,
    kEnd,
};

enum class TextDirection {
    kRtl,
    kLtr,
};

struct PositionWithAffinity {
    int32_t position;
    Affinity affinity;

    PositionWithAffinity() : position(0), affinity(kDownstream) {}
    PositionWithAffinity(int32_t p, Affinity a) : position(p), affinity(a) {}
};

struct TextBox {
    SkRect rect;
    TextDirection direction;

    TextBox(SkRect r, TextDirection d) : rect(r), direction(d) {}
};

// -------------------------------------------------------------------
// --- Reversed iterable

template<typename C, typename UnaryFunction>
UnaryFunction directional_for_each(C& c, bool forwards, UnaryFunction f) {
    return forwards
              ? std::for_each(std::begin(c), std::end(c), f)
              : std::for_each(std::rbegin(c), std::rend(c), f);
}

const size_t EMPTY_INDEX = std::numeric_limits<size_t>::max();
template <typename T> struct SkRange {
    SkRange() : start(), end() {}
    SkRange(T s, T e) : start(s), end(e) {}

    using SignedT = std::make_signed_t<T>;

    T start, end;

    bool operator==(const SkRange<T>& other) const {
        return start == other.start && end == other.end;
    }

    T width() const { return end - start; }

    void Shift(SignedT delta) {
        start += delta;
        end += delta;
    }

    bool contains(SkRange<size_t> other) const {
        return start <= other.start && end >= other.end;
    }

    bool intersects(SkRange<size_t> other) const {
        return std::max(start, other.start) <= std::min(end, other.end);
    }

    SkRange<size_t> intersection(SkRange<size_t> other) const {
        return SkRange<size_t>(std::max(start, other.start), std::min(end, other.end));
    }

    bool empty() const {
        return start == EMPTY_INDEX && end == EMPTY_INDEX;
    }
};

const SkRange<size_t> EMPTY_RANGE = SkRange<size_t>(EMPTY_INDEX, EMPTY_INDEX);


enum class TextBaseline {
    kAlphabetic,
    kIdeographic,
};

enum TextHeightBehavior {
    kAll = 0x0,
    kDisableFirstAscent = 0x1,
    kDisableLastDescent = 0x2,
    kDisableAll = 0x1 | 0x2,
};

enum class LineMetricStyle : uint8_t {
    // Use ascent, descent, etc from a fixed baseline.
    Typographic,
    // Use ascent, descent, etc like css with the leading split and with height adjustments
    CSS
};

}  // namespace textlayout
}  // namespace skia

#endif  // DartTypes_DEFINED
