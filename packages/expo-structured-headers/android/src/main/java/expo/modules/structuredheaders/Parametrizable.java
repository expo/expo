package expo.modules.structuredheaders;

/**
 * Common interface for all {@link Type}s that can carry {@link Parameters}.
 * 
 * @param <T>
 *            represented Java type
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#item">Section
 *      3.1.2 of draft-ietf-httpbis-header-structure-19</a>
 */
public interface Parametrizable<T> extends Type<T> {

    /**
     * Given an existing {@link Item}, return a new instance with the specified
     * {@link Parameters}.
     * 
     * @param params
     *            {@link Parameters} to set (must be non-null)
     * @return new instance with specified {@link Parameters}.
     */
    public Parametrizable<T> withParams(Parameters params);

    /**
     * Get the {@link Parameters} of this {@link Item}.
     * 
     * @return the parameters.
     */
    public Parameters getParams();
}
