package expo.modules.structuredheaders;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Represents a Decimal.
 * <p>
 * A Decimal - despite it's name - is essentially the same thing as an Integer,
 * but has an implied divisor of 1000 (in other words, a scale of 3). Thus, a
 * value represented as {@code 0.5} in a field value will be internally stored
 * as {@code long} with value {@code 500}. The only difference to
 * {@link IntegerItem} is that {@link #get()} will return a {@link BigDecimal},
 * and that the implied divisor is taken into account when serializing the
 * value. {@link #getAsLong()} provides access to the raw value when the
 * overhead of {@link BigDecimal} is not needed.
 * 
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#decimal">Section
 *      3.3.2 of draft-ietf-httpbis-header-structure-19</a>
 */
public class DecimalItem implements NumberItem<BigDecimal> {

    private final long value;
    private final Parameters params;

    private static final long MIN = -999999999999999L;
    private static final long MAX = 999999999999999L;
    private static final BigDecimal THOUSAND = new BigDecimal(1000);

    private DecimalItem(long value, Parameters params) {
        if (value < MIN || value > MAX) {
            throw new IllegalArgumentException("value must be in the range from " + MIN + " to " + MAX);
        }
        this.value = value;
        this.params = Objects.requireNonNull(params, "params must not be null");
    }

    /**
     * Creates a {@link DecimalItem} instance representing the specified
     * {@code long} value, where the implied divisor is {@code 1000}.
     * 
     * @param value
     *            a {@code long} value.
     * @return a {@link DecimalItem} representing {@code value}.
     */
    public static DecimalItem valueOf(long value) {
        return new DecimalItem(value, Parameters.EMPTY);
    }

    /**
     * Creates a {@link DecimalItem} instance representing the specified
     * {@code BigDecimal} value, with potential rounding.
     * 
     * @param value
     *            a {@code BigDecimal} value.
     * @return a {@link DecimalItem} representing {@code value}.
     */
    public static DecimalItem valueOf(BigDecimal value) {
        BigDecimal permille = (Objects.requireNonNull(value, "value must not be null")).multiply(THOUSAND);
        return valueOf(permille.longValue());
    }

    @Override
    public DecimalItem withParams(Parameters params) {
        if (Objects.requireNonNull(params, "params must not be null").isEmpty()) {
            return this;
        } else {
            return new DecimalItem(this.value, params);
        }
    }

    @Override
    public Parameters getParams() {
        return params;
    }

    @Override
    public StringBuilder serializeTo(StringBuilder sb) {

        String sign = value < 0 ? "-" : "";

        long abs = Math.abs(value);
        long left = abs / 1000;
        long right = abs % 1000;

        if (right % 10 == 0) {
            right /= 10;
        }
        if (right % 10 == 0) {
            right /= 10;
        }
        sb.append(sign).append(Long.toString(left)).append('.').append(Long.toString(right));

        params.serializeTo(sb);

        return sb;
    }

    @Override
    public String serialize() {
        return serializeTo(new StringBuilder(20)).toString();
    }

    @Override
    public BigDecimal get() {
        return BigDecimal.valueOf(value, 3);
    }

    @Override
    public long getAsLong() {
        return value;
    }

    @Override
    public int getDivisor() {
        return 1000;
    }
}
