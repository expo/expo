package expo.modules.structuredheaders;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import java.util.Arrays;

import org.junit.Assert;
import org.junit.Test;

public class DiagnosticsTests {

    private class TestCase {

        final String[] input;
        final String type;
        final int position;
        final String message;

        TestCase(String[] input, String type, int position, String message) {
            this.input = input;
            this.type = type;
            this.position = position;
            this.message = message;
        }

        TestCase(String input, String type, int position, String message) {
            this(new String[] { input }, type, position, message);
        }
    }

    @Test
    public void diagnostics() {

        TestCase[] tests = new TestCase[] { new TestCase("\u0080", null, 0, "Invalid character in field line "),
                new TestCase("   \u0080", null, 3, "Invalid character in field line "),
                new TestCase("-a", "item", 1, "Illegal start for Integer or Decimal:"),
                new TestCase("1234567890123.2", "item", 13, "Illegal position for decimal point in Decimal after "),
                new TestCase("12345678901234567", "item", 15, "Integer too long: "),
                new TestCase("123456789012.5556", "item", 16, "Decimal too long: "),
                new TestCase("123456789012.", "item", 12, "Decimal must not end in '.'"),
                new TestCase("0.1234", "item", 5, "Maximum number of fractional digits is 3, found:"),
                new TestCase(new String[] { "\"foo", "bar\"" }, "item", 4, "String crosses field line boundary "),
                new TestCase("\"\\", "item", 2, "Incomplete escape sequence at position "),
                new TestCase("\"\\a\"", "item", 2, "Invalid escape sequence character 'a'"),
                new TestCase("\"\u007f\"", "item", 2, "Invalid character in String"),
                new TestCase("\"incomplete", "item", 11, "Closing DQUOTE missing"),
                new TestCase(":empty", "item", 6, "Byte Sequence must end with COLON"),
                new TestCase(":em pty:", "item", 4, "Invalid Byte Sequence Character "),
                new TestCase(":empty:", "item", 7, "Last unit does not have enough valid bits"),
                new TestCase("?", "item", 1, "Missing data in Boolean"),
                new TestCase("??", "item", 1, "Expected '0' or '1' in Boolean, found"),
                new TestCase("1;", "item", 2, "Missing data in Key"),
                new TestCase("1;_", "item", 2, "Key must start with LCALPHA or '*': '_' (\\u005f)"),
                new TestCase("<uri>", "item", 0, "Unexpected start character in Bare Item: '<' (\\u003c)") ,
                new TestCase("1 2", "list", 2, "Expected COMMA in List, got: '2' (\\u0032)"),
                new TestCase("1, 2,", "list", 5, "Found trailing COMMA in List"),
                new TestCase("(1 2", "list", 4, "Missing data in Inner List"),
                new TestCase("(1 2#", "list", 4, "Expected SP or ')' in Inner List, got: '#' (\\u0023)"),
                new TestCase("a b", "dictionary", 2, "Expected COMMA in Dictionary, found: 'b' (\\u0062)"),
                new TestCase("a,b,", "dictionary", 4, "Found trailing COMMA in Dictionary")
                };

        for (TestCase test : tests) {
            try {
                Parser p = new Parser(test.input);
                switch (test.type) {
                    case "item":
                        p.parseItem();
                        break;
                    case "list":
                        p.parseList();
                        break;
                    case "dictionary":
                        p.parseDictionary();
                        break;
                    default:
                        fail("unknown type: " + test.type);
                }
                fail("Should not parse: " + Arrays.asList(test.input));
            } catch (ParseException ex) {
                // System.out.println();
                // System.out.println(Arrays.asList(test.input));
                // System.out.println(ex.getPosition());
                // System.out.println(ex.getMessage());
                Assert.assertTrue("does not start with '" + test.message + "' : '" + ex.getMessage() + "'",
                        ex.getMessage().startsWith(test.message));
                assertEquals(test.position, ex.getPosition());
            }
        }
    }
}
