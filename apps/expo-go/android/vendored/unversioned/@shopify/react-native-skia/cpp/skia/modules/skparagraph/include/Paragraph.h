// Copyright 2019 Google LLC.
#ifndef Paragraph_DEFINED
#define Paragraph_DEFINED

#include "include/core/SkPath.h"
#include "modules/skparagraph/include/FontCollection.h"
#include "modules/skparagraph/include/Metrics.h"
#include "modules/skparagraph/include/ParagraphStyle.h"
#include "modules/skparagraph/include/TextStyle.h"
#include <unordered_set>

class SkCanvas;

namespace skia {
namespace textlayout {

class ParagraphPainter;

class Paragraph {

public:
    Paragraph(ParagraphStyle style, sk_sp<FontCollection> fonts);

    virtual ~Paragraph() = default;

    SkScalar getMaxWidth() { return fWidth; }

    SkScalar getHeight() { return fHeight; }

    SkScalar getMinIntrinsicWidth() { return fMinIntrinsicWidth; }

    SkScalar getMaxIntrinsicWidth() { return fMaxIntrinsicWidth; }

    SkScalar getAlphabeticBaseline() { return fAlphabeticBaseline; }

    SkScalar getIdeographicBaseline() { return fIdeographicBaseline; }

    SkScalar getLongestLine() { return fLongestLine; }

    bool didExceedMaxLines() { return fExceededMaxLines; }

    virtual void layout(SkScalar width) = 0;

    virtual void paint(SkCanvas* canvas, SkScalar x, SkScalar y) = 0;

    virtual void paint(ParagraphPainter* painter, SkScalar x, SkScalar y) = 0;

    // Returns a vector of bounding boxes that enclose all text between
    // start and end glyph indexes, including start and excluding end
    virtual std::vector<TextBox> getRectsForRange(unsigned start,
                                                  unsigned end,
                                                  RectHeightStyle rectHeightStyle,
                                                  RectWidthStyle rectWidthStyle) = 0;

    virtual std::vector<TextBox> getRectsForPlaceholders() = 0;

    // Returns the index of the glyph that corresponds to the provided coordinate,
    // with the top left corner as the origin, and +y direction as down
    virtual PositionWithAffinity getGlyphPositionAtCoordinate(SkScalar dx, SkScalar dy) = 0;

    // Finds the first and last glyphs that define a word containing
    // the glyph at index offset
    virtual SkRange<size_t> getWordBoundary(unsigned offset) = 0;

    virtual void getLineMetrics(std::vector<LineMetrics>&) = 0;

    virtual size_t lineNumber() = 0;

    virtual void markDirty() = 0;

    // This function will return the number of unresolved glyphs or
    // -1 if not applicable (has not been shaped yet - valid case)
    virtual int32_t unresolvedGlyphs() = 0;
    virtual std::unordered_set<SkUnichar> unresolvedCodepoints() = 0;

    // Experimental API that allows fast way to update some of "immutable" paragraph attributes
    // but not the text itself
    virtual void updateTextAlign(TextAlign textAlign) = 0;
    virtual void updateFontSize(size_t from, size_t to, SkScalar fontSize) = 0;
    virtual void updateForegroundPaint(size_t from, size_t to, SkPaint paint) = 0;
    virtual void updateBackgroundPaint(size_t from, size_t to, SkPaint paint) = 0;

    enum VisitorFlags {
        kWhiteSpace_VisitorFlag = 1 << 0,
    };
    struct VisitorInfo {
        const SkFont&   font;
        SkPoint         origin;
        SkScalar        advanceX;
        int             count;
        const uint16_t* glyphs;     // count values
        const SkPoint*  positions;  // count values
        const uint32_t* utf8Starts; // count+1 values
        unsigned        flags;
    };

    // lineNumber begins at 0. If info is null, this signals the end of that line.
    using Visitor = std::function<void(int lineNumber, const VisitorInfo*)>;
    virtual void visit(const Visitor&) = 0;

    struct ExtendedVisitorInfo {
        const SkFont&   font;
        SkPoint         origin;
        SkSize          advance;
        int             count;
        const uint16_t* glyphs;     // count values
        SkPoint*        positions;  // count values
        const SkRect*   bounds;     // count values
        const uint32_t* utf8Starts; // count+1 values
        unsigned        flags;
    };
    using ExtendedVisitor = std::function<void(int lineNumber, const ExtendedVisitorInfo*)>;
    virtual void extendedVisit(const ExtendedVisitor&) = 0;

    /* Returns path for a given line
     *
     * @param lineNumber  a line number
     * @param dest        a resulting path
     * @return            a number glyphs that could not be converted to path
     */
    virtual int getPath(int lineNumber, SkPath* dest) = 0;

    /* Returns path for a text blob
     *
     * @param textBlob    a text blob
     * @return            a path
     */
    static SkPath GetPath(SkTextBlob* textBlob);

    /* Checks if a given text blob contains
     * glyph with emoji
     *
     * @param textBlob    a text blob
     * @return            true if there is such a glyph
     */
    virtual bool containsEmoji(SkTextBlob* textBlob) = 0;

    /* Checks if a given text blob contains colored font or bitmap
     *
     * @param textBlob    a text blob
     * @return            true if there is such a glyph
     */
    virtual bool containsColorFontOrBitmap(SkTextBlob* textBlob) = 0;

    // Editing API

    /* Finds the line number of the line that contains the given UTF-8 index.
    *
    * @param index         a UTF-8 TextIndex into the paragraph
    * @return              the line number the glyph that corresponds to the
    *                      given codeUnitIndex is in, or -1 if the codeUnitIndex
    *                      is out of bounds, or when the glyph is truncated or
    *                      ellipsized away.
    */
    virtual int getLineNumberAt(TextIndex codeUnitIndex) const = 0;

    /* Finds the line number of the line that contains the given UTF-16 index.
    *
    * @param index         a UTF-16 offset into the paragraph
    * @return              the line number the glyph that corresponds to the
    *                      given codeUnitIndex is in, or -1 if the codeUnitIndex
    *                      is out of bounds, or when the glyph is truncated or
    *                      ellipsized away.
    */
    virtual int getLineNumberAtUTF16Offset(size_t codeUnitIndex) = 0;

    /* Returns line metrics info for the line
     *
     * @param lineNumber    a line number
     * @param lineMetrics   an address to return the info (in case of null just skipped)
     * @return              true if the line is found; false if not
     */
    virtual bool getLineMetricsAt(int lineNumber, LineMetrics* lineMetrics) const = 0;

    /* Returns the visible text on the line (excluding a possible ellipsis)
     *
     * @param lineNumber    a line number
     * @param includeSpaces indicates if the whitespaces should be included
     * @return              the range of the text that is shown in the line
     */
    virtual TextRange getActualTextRange(int lineNumber, bool includeSpaces) const = 0;

    struct GlyphClusterInfo {
        SkRect fBounds;
        TextRange fClusterTextRange;
        TextDirection fGlyphClusterPosition;
    };

    /** Finds a glyph cluster for text index
     *
     * @param codeUnitIndex   a text index
     * @param glyphInfo       a glyph cluster info filled if not null
     * @return                true if glyph cluster was found; false if not
     */
    virtual bool getGlyphClusterAt(TextIndex codeUnitIndex, GlyphClusterInfo* glyphInfo) = 0;

    /** Finds the closest glyph cluster for a visual text position
     *
     * @param dx              x coordinate
     * @param dy              y coordinate
     * @param glyphInfo       a glyph cluster info filled if not null
     * @return                true if glyph cluster was found; false if not
     *                        (which usually means the paragraph is empty)
     */
    virtual bool getClosestGlyphClusterAt(SkScalar dx,
                                          SkScalar dy,
                                          GlyphClusterInfo* glyphInfo) = 0;

    // The glyph and grapheme cluster information assoicated with a unicode
    // codepoint in the paragraph.
    struct GlyphInfo {
        SkRect fGraphemeLayoutBounds;
        TextRange fGraphemeClusterTextRange;
        TextDirection fDirection;
        bool fIsEllipsis;
    };

    /** Retrives the information associated with the glyph located at the given
     *  codeUnitIndex.
     *
     * @param codeUnitIndex   a UTF-16 offset into the paragraph
     * @param glyphInfo       an optional GlyphInfo struct to hold the
     *                        information associated with the glyph found at the
     *                        given index
     * @return                false only if the offset is out of bounds
     */
    virtual bool getGlyphInfoAtUTF16Offset(size_t codeUnitIndex, GlyphInfo* glyphInfo) = 0;

    /** Finds the information associated with the closest glyph to the given
     *  paragraph coordinates.
     *
     * @param dx              x coordinate
     * @param dy              y coordinate
     * @param glyphInfo       an optional GlyphInfo struct to hold the
     *                        information associated with the glyph found. The
     *                        text indices and text ranges are described using
     *                        UTF-16 offsets
     * @return                true if a graphme cluster was found; false if not
     *                        (which usually means the paragraph is empty)
     */
    virtual bool getClosestUTF16GlyphInfoAt(SkScalar dx, SkScalar dy, GlyphInfo* glyphInfo) = 0;

    struct FontInfo {
        FontInfo(const SkFont font, const TextRange textRange)
            : fFont(font), fTextRange(textRange) { }
        virtual ~FontInfo() = default;
        FontInfo(const FontInfo& ) = default;
        SkFont fFont;
        TextRange fTextRange;
    };

    /** Returns the font that is used to shape the text at the position
     *
     * @param codeUnitIndex   text index
     * @return                font info or an empty font info if the text is not found
     */
    virtual SkFont getFontAt(TextIndex codeUnitIndex) const = 0;

    /** Returns the font used to shape the text at the given UTF-16 offset.
     *
     * @param codeUnitIndex   a UTF-16 offset in the paragraph
     * @return                font info or an empty font info if the text is not found
     */
    virtual SkFont getFontAtUTF16Offset(size_t codeUnitIndex) = 0;

    /** Returns the information about all the fonts used to shape the paragraph text
     *
     * @return                a list of fonts and text ranges
     */
    virtual std::vector<FontInfo> getFonts() const = 0;

protected:
    sk_sp<FontCollection> fFontCollection;
    ParagraphStyle fParagraphStyle;

    // Things for Flutter
    SkScalar fAlphabeticBaseline;
    SkScalar fIdeographicBaseline;
    SkScalar fHeight;
    SkScalar fWidth;
    SkScalar fMaxIntrinsicWidth;
    SkScalar fMinIntrinsicWidth;
    SkScalar fLongestLine;
    bool fExceededMaxLines;
};
}  // namespace textlayout
}  // namespace skia

#endif  // Paragraph_DEFINED
