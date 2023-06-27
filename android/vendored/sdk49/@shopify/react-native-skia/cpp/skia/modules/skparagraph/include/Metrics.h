// Copyright 2019 Google LLC.
#ifndef Metrics_DEFINED
#define Metrics_DEFINED

#include <map>
#include "modules/skparagraph/include/TextStyle.h"

namespace skia {
namespace textlayout {
class StyleMetrics {
public:
    StyleMetrics(const TextStyle* style) : text_style(style) {}

    StyleMetrics(const TextStyle* style, SkFontMetrics& metrics)
            : text_style(style), font_metrics(metrics) {}

    const TextStyle* text_style;

    // SkFontMetrics contains the following metrics:
    //
    // * Top                 distance to reserve above baseline
    // * Ascent              distance to reserve below baseline
    // * Descent             extent below baseline
    // * Bottom              extent below baseline
    // * Leading             distance to add between lines
    // * AvgCharWidth        average character width
    // * MaxCharWidth        maximum character width
    // * XMin                minimum x
    // * XMax                maximum x
    // * XHeight             height of lower-case 'x'
    // * CapHeight           height of an upper-case letter
    // * UnderlineThickness  underline thickness
    // * UnderlinePosition   underline position relative to baseline
    // * StrikeoutThickness  strikeout thickness
    // * StrikeoutPosition   strikeout position relative to baseline
    SkFontMetrics font_metrics;
};

class LineMetrics {
public:
    LineMetrics() { }

    LineMetrics(size_t start,
                size_t end,
                size_t end_excluding_whitespace,
                size_t end_including_newline,
                bool hard_break)
            : fStartIndex(start)
            , fEndIndex(end)
            , fEndExcludingWhitespaces(end_excluding_whitespace)
            , fEndIncludingNewline(end_including_newline)
            , fHardBreak(hard_break) {}
    // The following fields are used in the layout process itself.

    // The indexes in the text buffer the line begins and ends.
    size_t fStartIndex = 0;
    size_t fEndIndex = 0;
    size_t fEndExcludingWhitespaces = 0;
    size_t fEndIncludingNewline = 0;
    bool fHardBreak = false;

    // The following fields are tracked after or during layout to provide to
    // the user as well as for computing bounding boxes.

    // The final computed ascent and descent for the line. This can be impacted by
    // the strut, height, scaling, as well as outlying runs that are very tall.
    //
    // The top edge is `baseline - ascent` and the bottom edge is `baseline +
    // descent`. Ascent and descent are provided as positive numbers. Raw numbers
    // for specific runs of text can be obtained in run_metrics_map. These values
    // are the cumulative metrics for the entire line.
    double fAscent = SK_ScalarMax;
    double fDescent = SK_ScalarMin;
    double fUnscaledAscent = SK_ScalarMax;
    // Total height of the paragraph including the current line.
    //
    // The height of the current line is `round(ascent + descent)`.
    double fHeight = 0.0;
    // Width of the line.
    double fWidth = 0.0;
    // The left edge of the line. The right edge can be obtained with `left +
    // width`
    double fLeft = 0.0;
    // The y position of the baseline for this line from the top of the paragraph.
    double fBaseline = 0.0;
    // Zero indexed line number
    size_t fLineNumber = 0;

    // Mapping between text index ranges and the FontMetrics associated with
    // them. The first run will be keyed under start_index. The metrics here
    // are before layout and are the base values we calculate from.
    std::map<size_t, StyleMetrics> fLineMetrics;
};

}  // namespace textlayout
}  // namespace skia

#endif  // Metrics_DEFINED
