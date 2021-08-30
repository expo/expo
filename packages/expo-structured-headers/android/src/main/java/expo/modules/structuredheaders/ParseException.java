package expo.modules.structuredheaders;

import java.nio.CharBuffer;

/**
 * {@link IllegalArgumentException}, augmented with details.
 */
public class ParseException extends IllegalArgumentException {

    private final int position;
    private final String data;

    /**
     * Create instance of {@link ParseException}.
     * 
     * @param message
     *            exception message.
     * @param input
     *            parser input.
     * @param position
     *            position where parse exception occurred.
     * @param cause
     *            underlying exception, if any.
     */
    public ParseException(String message, String input, int position, Throwable cause) {
        super(message, cause);
        this.position = position;
        this.data = input;
    }

    /**
     * Create instance of {@link ParseException}.
     * 
     * @param message
     *            exception message.
     * @param input
     *            parser input.
     * @param position
     *            position where parse exception occurred.
     */
    public ParseException(String message, String input, int position) {
        this(message, input, position, null);
    }

    /**
     * Create instance of {@link ParseException}.
     * 
     * @param message
     *            exception message.
     * @param input
     *            current state of input buffer.
     * @param cause
     *            underlying exception, if any.
     */
    public ParseException(String message, CharBuffer input, Throwable cause) {
        this(message, asString(input), input.position(), cause);
    }

    /**
     * Create instance of {@link ParseException}.
     * 
     * @param message
     *            exception message.
     * @param input
     *            current state of input buffer.
     */
    public ParseException(String message, CharBuffer input) {
        this(message, asString(input), input.position(), null);
    }

    /**
     * Return the raw data on which the parser operated..
     * 
     * @return the raw data.
     */
    public String getData() {
        return data;
    }

    /**
     * Return the approximate position where the parse error occurred.
     * 
     * @return the position.
     */
    public int getPosition() {
        return position;
    }

    /**
     * Gets additional diagnostics.
     * 
     * @return two lines of data; first contains the raw parse data enclosed in
     *         "&gt;&gt;" and "&lt;&lt;", the second ASCII artwork with "^"
     *         pointing to the parse position, followed by the actual exception
     *         message.
     */
    public String getDiagnostics() {
        StringBuilder sb = new StringBuilder();
        sb.append(">>").append(data).append("<<").append('\n');
        sb.append("  ");
        for (int i = 0; i < position; i++) {
            sb.append('-');
        }
        sb.append("^ ");
        if (position < data.length()) {
            char c = data.charAt(position);
            sb.append(String.format("(0x%02x) ", (int) c));
        }
        sb.append(super.getMessage()).append('\n');
        return sb.toString();
    }

    private static String asString(CharBuffer input) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.position() + input.remaining(); i++) {
            sb.append(input.get(i));
        }
        return sb.toString();
    }

    private static final long serialVersionUID = -5222947525946866985L;
}
