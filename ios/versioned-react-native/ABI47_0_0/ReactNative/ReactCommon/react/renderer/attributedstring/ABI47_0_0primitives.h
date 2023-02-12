/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

enum class FontStyle { Normal, Italic, Oblique };

enum class FontWeight : int {
  Weight100 = 100,
  UltraLight = 100,
  Weight200 = 200,
  Thin = 200,
  Weight300 = 300,
  Light = 300,
  Weight400 = 400,
  Regular = 400,
  Weight500 = 500,
  Medium = 500,
  Weight600 = 600,
  Semibold = 600,
  Demibold = 600,
  Weight700 = 700,
  Bold = 700,
  Weight800 = 800,
  Heavy = 800,
  Weight900 = 900,
  Black = 900
};

enum class FontVariant : int {
  Default = 0,
  SmallCaps = 1 << 1,
  OldstyleNums = 1 << 2,
  LiningNums = 1 << 3,
  TabularNums = 1 << 4,
  ProportionalNums = 1 << 5
};

enum class EllipsizeMode {
  Clip, // Do not add ellipsize, simply clip.
  Head, // Truncate at head of line: "...wxyz".
  Tail, // Truncate at tail of line: "abcd...".
  Middle // Truncate middle of line: "ab...yz".
};

enum class TextBreakStrategy {
  Simple, // Simple strategy.
  HighQuality, // High-quality strategy, including hyphenation.
  Balanced // Balances line lengths.
};

enum class TextAlignment {
  Natural, // Indicates the default alignment for script.
  Left, // Visually left aligned.
  Center, // Visually centered.
  Right, // Visually right aligned.
  Justified // Fully-justified. The last line in a paragraph is natural-aligned.
};

enum class WritingDirection {
  Natural, // Determines direction using the Unicode Bidi Algorithm rules P2 and
           // P3.
  LeftToRight, // Left to right writing direction.
  RightToLeft // Right to left writing direction.
};

enum class TextDecorationLineType {
  None,
  Underline,
  Strikethrough,
  UnderlineStrikethrough
};

enum class TextDecorationStyle { Solid, Double, Dotted, Dashed };

enum class AccessibilityRole {
  None,
  Button,
  Link,
  Search,
  Image,
  Imagebutton,
  Keyboardkey,
  Text,
  Adjustable,
  Summary,
  Header,
  Alert,
  Checkbox,
  Combobox,
  Menu,
  Menubar,
  Menuitem,
  Progressbar,
  Radio,
  Radiogroup,
  Scrollbar,
  Spinbutton,
  Switch,
  Tab,
  TabBar,
  Tablist,
  Timer,
  Toolbar,
};

enum class TextTransform {
  None,
  Uppercase,
  Lowercase,
  Capitalize,
  Unset,
};

enum class HyphenationFrequency {
  None, // No hyphenation.
  Normal, // Less frequent hyphenation.
  Full // Standard amount of hyphenation.
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook

namespace std {
template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::FontVariant> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::FontVariant &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::TextAlignment> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::TextAlignment &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::FontStyle> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::FontStyle &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::TextDecorationLineType> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::TextDecorationLineType &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::WritingDirection> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::WritingDirection &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::TextDecorationStyle> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::TextDecorationStyle &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::FontWeight> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::FontWeight &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::EllipsizeMode> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::EllipsizeMode &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::TextBreakStrategy> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::TextBreakStrategy &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::AccessibilityRole> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::AccessibilityRole &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::TextTransform> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::TextTransform &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::HyphenationFrequency> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::HyphenationFrequency &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};
} // namespace std
