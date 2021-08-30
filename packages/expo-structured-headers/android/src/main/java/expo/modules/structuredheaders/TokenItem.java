package expo.modules.structuredheaders;

import java.util.Objects;

/**
 * Represents a Token.
 * 
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#token">Section
 *      3.3.4 of draft-ietf-httpbis-header-structure-19</a>
 */
public class TokenItem implements Item<String> {

    private final String value;
    private final Parameters params;

    private TokenItem(String value, Parameters params) {
        this.value = checkParam(Objects.requireNonNull(value, "value must not be null"));
        this.params = Objects.requireNonNull(params, "params must not be null");
    }

    /**
     * Creates a {@link TokenItem} instance representing the specified
     * {@code String} value.
     * 
     * @param value
     *            a {@code String} value.
     * @return a {@link TokenItem} representing {@code value}.
     */
    public static TokenItem valueOf(String value) {
        return new TokenItem(value, Parameters.EMPTY);
    }

    @Override
    public TokenItem withParams(Parameters params) {
        if (Objects.requireNonNull(params, "params must not be null").isEmpty()) {
            return this;
        } else {
            return new TokenItem(this.value, params);
        }
    }

    @Override
    public Parameters getParams() {
        return params;
    }

    @Override
    public StringBuilder serializeTo(StringBuilder sb) {
        sb.append(this.value);
        params.serializeTo(sb);
        return sb;
    }

    @Override
    public String serialize() {
        return serializeTo(new StringBuilder()).toString();
    }

    @Override
    public String get() {
        return this.value;
    }

    private static String checkParam(String value) {
        if (value.length() == 0) {
            throw new IllegalArgumentException("Token can not be empty");
        }
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if ((i == 0 && (c != '*' && !Utils.isAlpha(c))) || (c <= ' ' || c >= 0x7f || "\"(),;<=>?@[\\]{}".indexOf(c) >= 0)) {
                throw new IllegalArgumentException(
                        String.format("Invalid character in Token at position %d: '%c' (0x%04x)", i, c, (int) c));
            }
        }
        return value;
    }
}
