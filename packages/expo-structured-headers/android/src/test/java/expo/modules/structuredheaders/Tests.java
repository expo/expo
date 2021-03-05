package expo.modules.structuredheaders;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.junit.Test;

public class Tests {

    @Test
    public void testValidIntegers() {
        String tests[] = new String[] { "0", "1", "-1", "999999999999", "-999999999999", "3;a=b" };

        for (String s : tests) {
            IntegerItem i = Parser.parseInteger(s);
            assertEquals("should round-trip", i.serialize(), s);
        }
    }

    @Test
    public void testInvalidIntegers() {
        String tests[] = new String[] { "a", "1a", "1.", "9999999999999999", "-9999999999999999", "0999999999999999", "1-2",
                "3 4" };

        for (String s : tests) {
            try {
                Parser.parseInteger(s);
                fail("should not parse as integer: " + s);
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testValidDecimals() {
        String tests[] = new String[] { "0.1", "1.345", "123.99", "-1.567", "999999999999.999", "-999999999999.999", "123.0",
                "3.14;this-is-pi" };

        for (String s : tests) {
            DecimalItem i = Parser.parseDecimal(s);
            assertEquals("should round-trip", s, i.serialize());
        }
    }

    @Test
    public void testInvalidDecimals() {
        String tests[] = new String[] { " 0.1", "1.3453", "-1.56.7", "99999999999999.90", "-99999999999999.90" };

        for (String s : tests) {
            try {
                Parser.parseDecimal(s);
                fail("should not parse as decimal: " + s);
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testValidStrings() {
        String tests[] = new String[] { "\"\"", "\"abc\"", "\"a\\\\\\\"b\"", "\"a\";c=2" };

        for (String s : tests) {
            StringItem i = Parser.parseString(s);
            assertEquals("should round-trip", s, i.serialize());
        }
    }

    @Test
    public void testInvalidStrings() {
        String tests[] = new String[] { "\"abc", "\"\\g\"" };

        for (String s : tests) {
            try {
                Parser.parseString(s);
                fail("should not parse as string: " + s);
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testValidTokens() {
        String tests[] = new String[] { "x", "a2", "C", "text/plain;q=0.123", "foo:bar" };

        for (String s : tests) {
            TokenItem i = Parser.parseToken(s);
            assertEquals("should round-trip", s, i.serialize());
        }
    }

    @Test
    public void testInvalidTokens() {
        String tests[] = new String[] { "", "1", "a(b)", "3, ::" };

        for (String s : tests) {
            try {
                Parser.parseToken(s);
                fail("should not parse as token: " + s);
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testValidBooleans() {
        String tests[] = new String[] { "?0", "?1", "?0;maybe" };

        for (String s : tests) {
            BooleanItem i = Parser.parseBoolean(s);
            assertEquals("should round-trip", i.serialize(), s);
        }
    }

    @Test
    public void testInvalidBooleans() {
        String tests[] = new String[] { "?", "1", "?0 " };

        for (String s : tests) {
            try {
                Parser.parseBoolean(s);
                fail("should not parse as boolean: " + s);
            } catch (ParseException expected) {
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testValidByteSequences() {
        String tests[] = new String[] { ":cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:;foo=bar" };

        for (String s : tests) {
            ByteSequenceItem i = Parser.parseByteSequence(s);
            assertEquals("should round-trip", i.serialize(), s);
        }
    }

    @Test
    public void testInvalidByteSequences() {
        String tests[] = new String[] { "cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==",
                ":cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==", "cHJld\nGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:" };

        for (String s : tests) {
            try {
                Parser.parseByteSequence(s);
                fail("should not parse as byte sequence: " + s);
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testValidParameters() {
        Map<String, String> tests = new HashMap<>();

        tests.put("; a=b;c=1;d=?1;s=\"foo\"", ";a=b;c=1;d;s=\"foo\"");
        tests.put(";a=1;b=2;a=3", ";a=3;b=2");

        for (Map.Entry<String, String> e : tests.entrySet()) {
            Parameters i = Parser.parseParameters(e.getKey());
            assertEquals("should round-trip as ", e.getValue(), i.serialize());
        }
    }

    private static final String EMPTY = "";

    @Test
    public void testValidLists() {
        Map<String, Object[]> tests = new HashMap<>();

        tests.put("1, 2", new Object[] { 1L, EMPTY, 2L, EMPTY });
        tests.put("1;a, 1.1, \"foo\", ?0, a2, :Zg==:", new Object[] { 1L, ";a", BigDecimal.valueOf(1100, 3), EMPTY, "foo", EMPTY,
                Boolean.FALSE, EMPTY, "a2", EMPTY, ByteSequenceItem.valueOf("f".getBytes()).get(), EMPTY });
        tests.put("1, ();a", new Object[] { 1L, EMPTY, Collections.emptyList(), ";a" });

        for (Map.Entry<String, Object[]> e : tests.entrySet()) {
            OuterList list = Parser.parseList(e.getKey());
            Object[] expected = e.getValue();
            assertTrue(list instanceof OuterList);
            assertEquals(list.get().size(), expected.length / 2);
            for (int i = 0; i < expected.length / 2; i++) {
                assertEquals(expected[i * 2], list.get().get(i).get());
                Parameters p = list.get().get(i).getParams();
                assertEquals(expected[i * 2 + 1], p.serialize());
            }
        }
    }

    @Test
    public void testValidInnerLists() {
        Map<String, Object[]> tests = new HashMap<>();

        tests.put("(1;foo=bar 2);a;b=1", new Object[] { 1L, ";foo=bar", 2L, EMPTY, ";a;b=1" });

        for (Map.Entry<String, Object[]> e : tests.entrySet()) {
            InnerList list = Parser.parseInnerList(e.getKey());
            Object[] expected = e.getValue();
            assertTrue(list instanceof InnerList);
            assertEquals(list.get().size(), (expected.length - 1) / 2);
            for (int i = 0; i < (expected.length - 1) / 2; i++) {
                assertEquals(expected[i * 2], list.get().get(i).get());
                Parameters p = list.get().get(i).getParams();
                assertEquals(expected[i * 2 + 1], p == null ? null : p.serialize());
            }
            assertEquals(list.getParams().serialize(), expected[expected.length - 1]);
        }
    }

    @Test
    public void testInvalidLists() {
        String tests[] = new String[] { "(abc\"def\"?0123*dXZ3*xyz)" };

        for (String s : tests) {
            try {
                Parser.parseList(s);
                fail("should not parse as list sequence: " + s);
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testParseValidDictionary() {
        String tests[] = new String[] { "en=\"Applepie\", da=:w4ZibGV0w6ZydGU=:", "a=?0, b, c;foo=bar",
                "rating=1.5, feelings=(joy sadness)", "a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid" };

        for (String s : tests) {
            Dictionary i = Parser.parseDictionary(s);
            assertEquals("should round-trip", i.serialize(), s);
        }
    }

    @Test
    public void parserAPI() {
        Parser p = new Parser("a=?0, b, c; foo=bar");
        Dictionary d = p.parseDictionary();
        for (Map.Entry<String, ListElement<? extends Object>> e : d.get().entrySet()) {
            String key = e.getKey();
            Parametrizable<? extends Object> item = e.getValue();
            Object value = item.get();
            Parameters params = item.getParams();
            System.out.println(key + " -> " + value + (params.isEmpty() ? "" : (" (" + params.serialize() + ")")));
        }
    }

    @Test
    public void brokenFieldLines() {
        String tests[][] = new String[][] { new String[] { "\"foo", "bar\"" }, new String[] { "a", "", "b" } };

        for (String t[] : tests) {
            Parser p = new Parser(t);
            try {
                p.parseList();
                fail("should fail");
            } catch (IllegalArgumentException ex) {
            }
        }
    }
}
