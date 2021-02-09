package expo.modules.structuredheaders;

import java.util.Map;
import java.util.Objects;

/**
 * Common utility methods.
 */
public class Utils {

    private Utils() {
    }

    protected static boolean isDigit(char c) {
        return c >= '0' && c <= '9';
    }

    protected static boolean isLcAlpha(char c) {
        return (c >= 'a' && c <= 'z');
    }

    protected static boolean isAlpha(char c) {
        return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
    }

    protected static String checkKey(String value) {
        if (value == null || value.length() == 0) {
            throw new IllegalArgumentException("Key can not be null or empty");
        }
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if ((i == 0 && (c != '*' && !isLcAlpha(c)))
                    || !(isLcAlpha(c) || isDigit(c) || c == '_' || c == '-' || c == '.' || c == '*')) {
                throw new IllegalArgumentException(
                        String.format("Invalid character in key at position %d: '%c' (0x%04x)", i, c, (int) c));
            }
        }
        return value;
    }

    protected static Map<String, ListElement<? extends Object>> checkKeys(Map<String, ListElement<? extends Object>> value) {
        for (String key : Objects.requireNonNull(value, "value must not be null").keySet()) {
            checkKey(key);
        }
        return value;
    }
}
