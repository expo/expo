package expo.modules.structuredheaders;

/**
 * Marker interface for Items.
 * 
 * @param <T>
 *            represented Java type
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#item">Section
 *      3.3 of draft-ietf-httpbis-header-structure-19</a>
 */
public interface Item<T> extends ListElement<T>, Parametrizable<T> {

    public Item<T> withParams(Parameters params);
}
