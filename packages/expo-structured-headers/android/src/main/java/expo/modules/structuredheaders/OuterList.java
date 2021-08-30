package expo.modules.structuredheaders;

import java.util.List;
import java.util.Objects;

/**
 * Represents a List.
 * 
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#list">Section
 *      3.1 of draft-ietf-httpbis-header-structure-19</a>
 */
public class OuterList implements Type<List<ListElement<? extends Object>>> {

    private final List<ListElement<? extends Object>> value;

    private OuterList(List<ListElement<? extends Object>> value) {
        this.value = Objects.requireNonNull(value, "value must not be null");
    }

    /**
     * Creates an {@link OuterList} instance representing the specified
     * {@code List<Item>} value.
     * 
     * @param value
     *            a {@code List<Item>} value.
     * @return a {@link OuterList} representing {@code value}.
     */
    public static OuterList valueOf(List<ListElement<? extends Object>> value) {
        return new OuterList(value);
    }

    @Override
    public StringBuilder serializeTo(StringBuilder sb) {
        String separator = "";

        for (ListElement<? extends Object> i : value) {
            sb.append(separator);
            separator = ", ";
            i.serializeTo(sb);
        }

        return sb;
    }

    @Override
    public String serialize() {
        return serializeTo(new StringBuilder()).toString();
    }

    @Override
    public List<ListElement<? extends Object>> get() {
        return value;
    }
}
