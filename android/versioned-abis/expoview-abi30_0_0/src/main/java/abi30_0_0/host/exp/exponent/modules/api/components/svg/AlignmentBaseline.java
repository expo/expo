package abi30_0_0.host.exp.exponent.modules.api.components.svg;

import com.facebook.common.internal.ImmutableMap;

import java.util.HashMap;
import java.util.Map;

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

    public static AlignmentBaseline getEnum(String strVal) {
        if (!alignmentToEnum.containsKey(strVal)) {
            throw new IllegalArgumentException("Unknown String Value: " + strVal);
        }
        return alignmentToEnum.get(strVal);
    }

    private static final Map<String, AlignmentBaseline> alignmentToEnum;

    static {
        final Map<String, AlignmentBaseline> tmpMap = new HashMap<>();
        for (final AlignmentBaseline en : AlignmentBaseline.values()) {
            tmpMap.put(en.alignment, en);
        }
        alignmentToEnum = ImmutableMap.copyOf(tmpMap);
    }

    @Override
    public String toString() {
        return alignment;
    }
}
