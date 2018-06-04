package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import com.facebook.common.internal.ImmutableMap;

import java.util.HashMap;
import java.util.Map;

enum TextDecoration
{
    None("none"),
    Underline("underline"),
    Overline("overline"),
    LineThrough("line-through"),
    Blink("blink");

    private final String decoration;
    TextDecoration(String decoration) {
        this.decoration = decoration;
    }

    public static TextDecoration getEnum(String strVal) {
        if(!decorationToEnum.containsKey(strVal)) {
            throw new IllegalArgumentException("Unknown String Value: " + strVal);
        }
        return decorationToEnum.get(strVal);
    }

    private static final Map<String, TextDecoration> decorationToEnum;
    static {
        final Map<String, TextDecoration> tmpMap = new HashMap<>();
        for(final TextDecoration en : TextDecoration.values()) {
            tmpMap.put(en.decoration, en);
        }
        decorationToEnum = ImmutableMap.copyOf(tmpMap);
    }

    @Override
    public String toString() {
        return decoration;
    }
}
