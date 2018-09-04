package abi30_0_0.host.exp.exponent.modules.api.components.svg;

import com.facebook.common.internal.ImmutableMap;

import java.util.HashMap;
import java.util.Map;

enum FontWeight {
    Normal ("normal"),
    Bold ("bold"),
    Bolder ("bolder"),
    Lighter ("lighter"),
    w100 ("100"),
    w200 ("200"),
    w300 ("300"),
    w400 ("400"),
    w500 ("500"),
    w600 ("600"),
    w700 ("700"),
    w800 ("800"),
    w900 ("900");

    private final String weight;
    FontWeight(String weight) {
        this.weight = weight;
    }

    public static FontWeight getEnum(String strVal) {
        if(!weightToEnum.containsKey(strVal)) {
            throw new IllegalArgumentException("Unknown String Value: " + strVal);
        }
        return weightToEnum.get(strVal);
    }

    private static final Map<String, FontWeight> weightToEnum;
    static {
        final Map<String, FontWeight> tmpMap = new HashMap<>();
        for(final FontWeight en : FontWeight.values()) {
            tmpMap.put(en.weight, en);
        }
        weightToEnum = ImmutableMap.copyOf(tmpMap);
    }

    @Override
    public String toString() {
        return weight;
    }
}
