package expo.modules.structuredheaders;

import java.util.Objects;

/**
 * Represents an Integer.
 * 
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#integer">Section
 *      3.3.1 of draft-ietf-httpbis-header-structure-19</a>
 */
public class IntegerItem implements NumberItem<Long> {

    private final long value;
    private final Parameters params;

    private static final long MIN = -999999999999999L;
    private static final long MAX = 999999999999999L;

    private IntegerItem(long value, Parameters params) {
        if (value < MIN || value > MAX) {
            throw new IllegalArgumentException("value must be in the range from " + MIN + " to " + MAX);
        }
        this.value = value;
        this.params = Objects.requireNonNull(params, "params must not be null");
    }

    /**
     * Creates an {@link IntegerItem} instance representing the specified
     * {@code long} value.
     * 
     * @param value
     *            a {@code long} value.
     * @return a {@link IntegerItem} representing {@code value}.
     */
    public static IntegerItem valueOf(long value) {
        return new IntegerItem(value, Parameters.EMPTY);
    }

    @Override
    public IntegerItem withParams(Parameters params) {
        if (Objects.requireNonNull(params, "params must not be null").isEmpty()) {
            return this;
        } else {
            return new IntegerItem(this.value, params);
        }
    }

    @Override
    public Parameters getParams() {
        return params;
    }

    @Override
    public StringBuilder serializeTo(StringBuilder sb) {
        sb.append(Long.toString(value));
        params.serializeTo(sb);
        return sb;
    }

    @Override
    public String serialize() {
        return serializeTo(new StringBuilder()).toString();
    }

    @Override
    public Long get() {
        return value;
    }

    @Override
    public long getAsLong() {
        return value;
    }

    @Override
    public int getDivisor() {
        return 1;
    }
}
