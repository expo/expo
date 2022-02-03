package expo.modules.structuredheaders;

/**
 * Marker interface for things that can be elements of Outer Lists.
 * 
 * @param <T>
 *            represented Java type
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#item">Section
 *      3.3 of draft-ietf-httpbis-header-structure-19</a>
 */
public interface ListElement<T> extends Parametrizable<T> {
}
