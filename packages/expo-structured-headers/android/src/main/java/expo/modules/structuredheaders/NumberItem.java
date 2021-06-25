package expo.modules.structuredheaders;

/**
 * Common interface for all {@link Type}s that can carry numbers.
 * 
 * @param <T>
 *            represented Java type
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#integer">Section
 *      3.3.1 of draft-ietf-httpbis-header-structure-19</a>
 * @see <a href=
 *      "https://greenbytes.de/tech/webdav/draft-ietf-httpbis-header-structure-19.html#decimal">Section
 *      3.3.2 of draft-ietf-httpbis-header-structure-19</a>
 */
public interface NumberItem<T> extends Item<T>, LongSupplier {

    /**
     * Returns the divisor to be used to obtain the actual numerical value (as
     * opposed to the underlying long value returned by
     * {@link LongSupplier#getAsLong()}).
     * 
     * @return the divisor ({@code 1} for Integers, {@code 1000} for Decimals)
     */
    public int getDivisor();

    public NumberItem<T> withParams(Parameters params);
}
