package expo.modules.structuredheaders;

import java.util.Objects;

/**
 * Represents a Boolean.
 * 
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#boolean">Section
 *      3.3.6 of draft-ietf-httpbis-header-structure-19</a>
 */
public class BooleanItem implements Item<Boolean> {

    private final boolean value;
    private final Parameters params;

    private static final BooleanItem TRUE = new BooleanItem(true, Parameters.EMPTY);
    private static final BooleanItem FALSE = new BooleanItem(false, Parameters.EMPTY);

    private BooleanItem(boolean value, Parameters params) {
        this.value = value;
        this.params = Objects.requireNonNull(params, "params must not be null");
    }

    /**
     * Creates a {@link BooleanItem} instance representing the specified
     * {@code boolean} value.
     * 
     * @param value
     *            a {@code boolean} value.
     * @return a {@link BooleanItem} representing {@code value}.
     */
    public static BooleanItem valueOf(boolean value) {
        return value ? TRUE : FALSE;
    }

    @Override
    public Parameters getParams() {
        return params;
    }

    @Override
    public BooleanItem withParams(Parameters params) {
        if (Objects.requireNonNull(params, "params must not be null").isEmpty()) {
            return this;
        } else {
            return new BooleanItem(this.value, params);
        }
    }

    @Override
    public StringBuilder serializeTo(StringBuilder sb) {
        sb.append(value ? "?1" : "?0");
        params.serializeTo(sb);
        return sb;
    }

    @Override
    public String serialize() {
        return serializeTo(new StringBuilder()).toString();
    }

    @Override
    public Boolean get() {
        return value;
    }
}
