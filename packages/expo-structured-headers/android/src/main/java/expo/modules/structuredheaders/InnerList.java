package expo.modules.structuredheaders;

import java.util.List;
import java.util.Objects;

/**
 * Represents an Inner List.
 *
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#inner-list">Section
 *      3.1.1 of draft-ietf-httpbis-header-structure-19</a>
 */
public class InnerList implements ListElement<List<Item<? extends Object>>>, Parametrizable<List<Item<? extends Object>>> {

    private final List<Item<? extends Object>> value;
    private final Parameters params;

    private InnerList(List<Item<? extends Object>> value, Parameters params) {
        this.value = Objects.requireNonNull(value, "value must not be null");
        this.params = Objects.requireNonNull(params, "params must not be null");
    }

    /**
     * Creates an {@link InnerList} instance representing the specified
     * {@code List<Item>} value.
     * 
     * @param value
     *            a {@code List<Item>} value.
     * @return a {@link InnerList} representing {@code value}.
     */
    public static InnerList valueOf(List<Item<? extends Object>> value) {
        return new InnerList(value, Parameters.EMPTY);
    }

    @Override
    public InnerList withParams(Parameters params) {
        if (Objects.requireNonNull(params, "params must not be null").isEmpty()) {
            return this;
        } else {
            return new InnerList(this.value, params);
        }
    }

    @Override
    public StringBuilder serializeTo(StringBuilder sb) {
        String separator = "";

        sb.append('(');

        for (Item<? extends Object> i : value) {
            sb.append(separator);
            separator = " ";
            i.serializeTo(sb);
        }

        sb.append(')');

        params.serializeTo(sb);

        return sb;
    }

    @Override
    public Parameters getParams() {
        return params;
    }

    @Override
    public String serialize() {
        return serializeTo(new StringBuilder()).toString();
    }

    @Override
    public List<Item<? extends Object>> get() {
        return value;
    }
}
