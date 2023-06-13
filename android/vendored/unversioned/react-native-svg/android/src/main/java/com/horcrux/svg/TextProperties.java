package com.horcrux.svg;

import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nonnull;

class TextProperties {

  /*
      https://drafts.csswg.org/css-inline/#propdef-alignment-baseline
      2.2.1. Alignment Point: alignment-baseline longhand

      Name:	alignment-baseline
      Value:	baseline | text-bottom | alphabetic | ideographic | middle | central | mathematical | text-top | bottom | center | top
      Initial:	baseline
      Applies to:	inline-level boxes, flex items, grid items, table cells
      Inherited:	no
      Percentages:	N/A
      Media:	visual
      Computed value:	as specified
      Canonical order:	per grammar
      Animation type:	discrete
  */
  enum AlignmentBaseline {
    baseline("baseline"),
    textBottom("text-bottom"),
    alphabetic("alphabetic"),
    ideographic("ideographic"),
    middle("middle"),
    central("central"),
    mathematical("mathematical"),
    textTop("text-top"),
    bottom("bottom"),
    center("center"),
    top("top"),
    /*
        SVG implementations may support the following aliases in order to support legacy content:

        text-before-edge = text-top
        text-after-edge = text-bottom
    */
    textBeforeEdge("text-before-edge"),
    textAfterEdge("text-after-edge"),
    // SVG 1.1
    beforeEdge("before-edge"),
    afterEdge("after-edge"),
    hanging("hanging"),
    ;

    private final String alignment;

    AlignmentBaseline(String alignment) {
      this.alignment = alignment;
    }

    static AlignmentBaseline getEnum(String strVal) {
      if (!alignmentToEnum.containsKey(strVal)) {
        throw new IllegalArgumentException("Unknown String Value: " + strVal);
      }
      return alignmentToEnum.get(strVal);
    }

    private static final Map<String, AlignmentBaseline> alignmentToEnum = new HashMap<>();

    static {
      for (final AlignmentBaseline en : AlignmentBaseline.values()) {
        alignmentToEnum.put(en.alignment, en);
      }
    }

    @Nonnull
    @Override
    public String toString() {
      return alignment;
    }
  }

  // TODO implement rtl
  @SuppressWarnings("unused")
  enum Direction {
    ltr,
    rtl
  }

  enum FontVariantLigatures {
    normal,
    @SuppressWarnings("unused")
    none
  }

  enum FontStyle {
    normal,
    italic,
    @SuppressWarnings("unused")
    oblique
  }

  enum FontWeight {
    // Absolute
    Normal("normal"),
    Bold("bold"),
    w100("100"),
    w200("200"),
    w300("300"),
    w400("400"),
    w500("500"),
    w600("600"),
    w700("700"),
    w800("800"),
    w900("900"),
    // Relative
    Bolder("bolder"),
    Lighter("lighter");

    private final String weight;

    FontWeight(String weight) {
      this.weight = weight;
    }

    static boolean hasEnum(String strVal) {
      return weightToEnum.containsKey(strVal);
    }

    static FontWeight get(String strVal) {
      return weightToEnum.get(strVal);
    }

    private static final Map<String, FontWeight> weightToEnum = new HashMap<>();

    static {
      for (final FontWeight en : FontWeight.values()) {
        weightToEnum.put(en.weight, en);
      }
    }

    @Nonnull
    @Override
    public String toString() {
      return weight;
    }
  }

  enum TextAnchor {
    start,
    middle,
    end
  }

  enum TextDecoration {
    None("none"),
    Underline("underline"),
    Overline("overline"),
    LineThrough("line-through"),
    Blink("blink");

    private final String decoration;

    TextDecoration(String decoration) {
      this.decoration = decoration;
    }

    static TextDecoration getEnum(String strVal) {
      if (!decorationToEnum.containsKey(strVal)) {
        throw new IllegalArgumentException("Unknown String Value: " + strVal);
      }
      return decorationToEnum.get(strVal);
    }

    private static final Map<String, TextDecoration> decorationToEnum = new HashMap<>();

    static {
      for (final TextDecoration en : TextDecoration.values()) {
        decorationToEnum.put(en.decoration, en);
      }
    }

    @Nonnull
    @Override
    public String toString() {
      return decoration;
    }
  }

  enum TextLengthAdjust {
    spacing,
    spacingAndGlyphs
  }

  enum TextPathMethod {
    align,
    @SuppressWarnings("unused")
    stretch
  }

  /*
      TODO suggest adding a compatibility mid-line rendering attribute to textPath,
      for a chrome/firefox/opera/safari compatible sharp text path rendering,
      which doesn't bend text smoothly along a right angle curve, (like Edge does)
      but keeps the mid-line orthogonal to the mid-point tangent at all times instead.
  */
  enum TextPathMidLine {
    sharp,
    @SuppressWarnings("unused")
    smooth
  }

  enum TextPathSide {
    @SuppressWarnings("unused")
    left,
    right
  }

  enum TextPathSpacing {
    @SuppressWarnings("unused")
    auto,
    exact
  }
}
