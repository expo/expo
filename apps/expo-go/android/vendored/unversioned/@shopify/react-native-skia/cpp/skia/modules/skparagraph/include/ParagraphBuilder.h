// Copyright 2019 Google LLC.
#ifndef ParagraphBuilder_DEFINED
#define ParagraphBuilder_DEFINED

#include <memory>
#include <stack>
#include <string>
#include <tuple>
#include "modules/skparagraph/include/FontCollection.h"
#include "modules/skparagraph/include/Paragraph.h"
#include "modules/skparagraph/include/ParagraphStyle.h"
#include "modules/skparagraph/include/TextStyle.h"
#include "modules/skunicode/include/SkUnicode.h"

namespace skia {
namespace textlayout {

class ParagraphBuilder {
protected:
    ParagraphBuilder() {}

public:
    virtual ~ParagraphBuilder() = default;

    // Push a style to the stack. The corresponding text added with AddText will
    // use the top-most style.
    virtual void pushStyle(const TextStyle& style) = 0;

    // Remove a style from the stack. Useful to apply different styles to chunks
    // of text such as bolding.
    // Example:
    //   builder.PushStyle(normal_style);
    //   builder.AddText("Hello this is normal. ");
    //
    //   builder.PushStyle(bold_style);
    //   builder.AddText("And this is BOLD. ");
    //
    //   builder.Pop();
    //   builder.AddText(" Back to normal again.");
    virtual void pop() = 0;

    virtual TextStyle peekStyle() = 0;

    // Adds UTF16-encoded text to the builder. Forms the proper runs to use the upper-most style
    // on the style_stack.
    virtual void addText(const std::u16string& text) = 0;

    // Adds UTF8-encoded text to the builder, using the top-most style on the style_stack.
    virtual void addText(const char* text) = 0;
    virtual void addText(const char* text, size_t len) = 0;

    // Pushes the information required to leave an open space, where Flutter may
    // draw a custom placeholder into.
    // Internally, this method adds a single object replacement character (0xFFFC)
    virtual void addPlaceholder(const PlaceholderStyle& placeholderStyle) = 0;

    // Constructs a SkParagraph object that can be used to layout and paint the text to a SkCanvas.
    virtual std::unique_ptr<Paragraph> Build() = 0;

    virtual SkSpan<char> getText() = 0;
    virtual const ParagraphStyle& getParagraphStyle() const = 0;

    // Mainly, support for "Client" unicode
    virtual void setWordsUtf8(std::vector<SkUnicode::Position> wordsUtf8) = 0;
    virtual void setWordsUtf16(std::vector<SkUnicode::Position> wordsUtf16) = 0;

    virtual void setGraphemeBreaksUtf8(std::vector<SkUnicode::Position> graphemesUtf8) = 0;
    virtual void setGraphemeBreaksUtf16(std::vector<SkUnicode::Position> graphemesUtf16) = 0;

    virtual void setLineBreaksUtf8(std::vector<SkUnicode::LineBreakBefore> lineBreaksUtf8) = 0;
    virtual void setLineBreaksUtf16(std::vector<SkUnicode::LineBreakBefore> lineBreaksUtf16) = 0;

    virtual void SetUnicode(std::unique_ptr<SkUnicode> unicode) = 0;

    // Resets this builder to its initial state, discarding any text, styles, placeholders that have
    // been added, but keeping the initial ParagraphStyle.
    virtual void Reset() = 0;

    // Just until we fix all the google3 code
    static std::unique_ptr<ParagraphBuilder> make(const ParagraphStyle& style,
                                                  sk_sp<FontCollection> fontCollection);
};
}  // namespace textlayout
}  // namespace skia

#endif  // ParagraphBuilder_DEFINED
