package expo.modules.structuredheaders;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.Test;

public class ItemAPITests {

    @Test
    public void testBoolean() {

        BooleanItem b0 = BooleanItem.valueOf(false);
        assertEquals(false, b0.get());
        assertEquals("?0", b0.serialize());

        BooleanItem b1 = BooleanItem.valueOf(true);
        assertEquals(true, b1.get());
        assertEquals("?1", b1.serialize());
    }

    @Test
    public void testInteger() {

        long tests[] = new long[] { 0L, -0L, 999999999999999L, -999999999999999L };

        for (long l : tests) {
            IntegerItem item = IntegerItem.valueOf(l);
            assertEquals(Long.valueOf(l), item.get());
            assertEquals(l, item.getAsLong());
            assertEquals(Long.valueOf(l).toString(), item.serialize());
            assertEquals(1, item.getDivisor());
        }
    }

    @Test
    public void testIntegerInvalid() {

        Long tests[] = new Long[] { 1000000000000000L, -1000000000000000L };

        for (Long l : tests) {
            try {
                IntegerItem item = IntegerItem.valueOf(l);
                fail("should fail for " + l + " but got '" + item.get() + "'");
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testDecimal() {

        long tests[] = new long[] { 0L, -0L, 999999999999999L, -999999999999999L, -123, 1000, 500, 10, -1 };

        for (long l : tests) {
            DecimalItem item = DecimalItem.valueOf(l);
            assertEquals(BigDecimal.valueOf(l, 3), item.get());
            assertEquals(l, item.getAsLong());
            assertEquals(1000, item.getDivisor());
        }
    }

    @Test
    public void testDecimalByBigDecimal() {

        BigDecimal[] tests = new BigDecimal[] { new BigDecimal(0.5), new BigDecimal(1), new BigDecimal(-1.1),
                new BigDecimal(0.1234) };

        for (BigDecimal b : tests) {
            BigDecimal permille = b.multiply(new BigDecimal(1000));
            DecimalItem item = DecimalItem.valueOf(b);
            assertEquals(permille.longValue(), item.getAsLong());
        }
    }

    @Test
    public void testString() {

        String tests[] = new String[] { "", "'", "\"", "\\" };

        for (String s : tests) {
            StringItem item = StringItem.valueOf(s);
            assertEquals(s, item.get());
            // TODO: figure out how to check the serialization without copying
            // the actual impl code
        }
    }

    @Test
    public void testStringInvalid() {

        String tests[] = new String[] { "\n", "\u0080", "\u007f", "\u0000" };

        for (String s : tests) {
            try {
                StringItem item = StringItem.valueOf(s);
                fail("should fail for '" + s + "' but got '" + item.get() + "'");
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testToken() {

        String tests[] = new String[] { "*", "x", "*-/", "foo.bar-qux" };

        for (String s : tests) {
            TokenItem item = TokenItem.valueOf(s);
            assertEquals(s, item.get());
            // TODO: figure out how to check the serialization without copying
            // the actual impl code
        }
    }

    @Test
    public void testTokenInvalid() {

        String tests[] = new String[] { "123", ".x", "a(b)", "\u0000foo" };

        for (String s : tests) {
            try {
                TokenItem item = TokenItem.valueOf(s);
                fail("should fail for '" + s + "' but got '" + item.get() + "'");
            } catch (IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testByteSequence() {

        byte tests[][] = new byte[][] { new byte[0], "x".getBytes() };
        String results[] = new String[] { "::", ":eA==:" };

        for (int i = 0; i < tests.length; i++) {
            ByteSequenceItem item = ByteSequenceItem.valueOf(tests[i]);
            assertEquals(tests[i], item.get().array());
            assertEquals(results[i], item.serialize());
        }
    }

    @Test
    public void testByteSequenceInvalid() {

        byte tests[][] = new byte[][] { null };

        for (byte[] ba : tests) {
            try {
                ByteSequenceItem item = ByteSequenceItem.valueOf(ba);
                fail("should fail for '" + item + "' but got '" + item.get() + "'");
            } catch (NullPointerException | IllegalArgumentException expected) {
            }
        }
    }

    @Test
    public void testParameters() {

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("*", "star");
        m.put("i", 1);
        m.put("l", 2l);
        m.put("b", false);
        m.put("o", new byte[0]);
        m.put("d", new BigDecimal(0.1));
        Parameters p = Parameters.valueOf(m);
        assertEquals(p.get("*").getClass(), StringItem.class);
        assertEquals(p.get("i").getClass(), IntegerItem.class);
        assertEquals(p.get("l").getClass(), IntegerItem.class);
        assertEquals(p.get("b").getClass(), BooleanItem.class);
        assertEquals(p.get("o").getClass(), ByteSequenceItem.class);
        assertEquals(p.get("d").getClass(), DecimalItem.class);
    }

    @Test
    public void testInvalidParameterKeys() {

        String tests[] = { "Aa", "-a", "/a", "", " ", "1" };
        Map<String, Object> m = new LinkedHashMap<>();
        for (String key : tests) {
            m.clear();
            m.put(key, IntegerItem.valueOf(1));
            try {
                Parameters p = Parameters.valueOf(m);
                fail("should fail for key '" + key + "' but got: " + p);
            } catch (IllegalArgumentException ex) {
            }
        }
    }

    @Test
    public void testInvalidParameterValues() {

        Map<String, Object> itemParam = new LinkedHashMap<>();
        itemParam.put("foo", IntegerItem.valueOf(2));
        IntegerItem iitem = IntegerItem.valueOf(1).withParams(Parameters.valueOf(itemParam));

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("bar", iitem);
        try {
            Parameters test = Parameters.valueOf(m);
            fail("Parameters containing non-bare Item should fail, but got: " + test.serialize());
        } catch (IllegalArgumentException expected) {
        }
    }
}
