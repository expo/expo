package expo.modules.structuredheaders;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonNumber;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonString;
import javax.json.JsonValue;

import org.apache.commons.codec.binary.Base32;

public abstract class AbstractSpecificationTests {

    public TestParams p;

    public static class TestParams {
        public String name;
        List<String> raw;
        public String header_type;
        public boolean must_fail;
        public JsonValue expected_value;
        public JsonValue expected_params;
        public String canonical;
    }

    public static Collection<Object[]> makeParameters(List<String> filenames) {
        List<Object[]> result = new ArrayList<>();
        for (String filename : filenames) {
            result.addAll(makeParameters(filename));
        }
        return result;
    }

    private static Collection<Object[]> makeParameters(String filename) {
        String basename = filename.substring(0, filename.length() - ".json".length());
        List<Object[]> result = new ArrayList<>();

        JsonReader reader = Json.createReader(AbstractSpecificationTests.class.getClassLoader().getResourceAsStream(filename));
        for (JsonValue vt : reader.readArray()) {
            TestParams p = makeOneTest(vt);
            result.add(new Object[] { basename + ": " + p.name, p });
        }

        return result;
    }

    private static TestParams makeOneTest(JsonValue vt) {
        JsonObject v = (JsonObject) vt;
        TestParams p = new TestParams();

        p.name = ((JsonObject) v).getString("name");
        p.raw = new ArrayList<>();
        for (JsonValue raw : v.getJsonArray("raw")) {
            String t = ((JsonString) raw).getString();
            p.raw.add(t);
        }
        p.header_type = v.getString("header_type");
        p.must_fail = v.getBoolean("must_fail", false);

        JsonValue expected = v.get("expected");

        if (expected == null) {
            p.expected_value = null;
            p.expected_params = null;
        } else if ("item".equals(p.header_type)) {
            if (expected instanceof JsonArray) {
                JsonArray array = (JsonArray) expected;
                p.expected_value = array.get(0);
                p.expected_params = array.get(1);
            } else {
                p.expected_value = (JsonObject) expected;
                p.expected_params = null;
            }
        } else if ("dictionary".equals(p.header_type)) {
            if (expected instanceof JsonArray) {
                p.expected_value = (JsonArray) expected;
            } else {
                throw new RuntimeException("unexpected dictionary expected value for test: " + p.name);
            }
        } else if ("list".equals(p.header_type)) {
            p.expected_value = v.getJsonArray("expected");
            p.expected_params = null;
        } else {
            throw new RuntimeException("unexpected header_type: " + p.header_type);
        }
        JsonArray canarr = v.getJsonArray("canonical");
        p.canonical = canarr == null || canarr.size() == 0 ? null : canarr.getString(0);
        return p;
    }

    public Type<? extends Object> parse() {
        Parser parser = new Parser(p.raw);
        if (p.header_type.equals("item")) {
            return parser.parseItem();
        } else if (p.header_type.equals("list")) {
            return parser.parseList();
        } else if (p.header_type.equals("dictionary")) {
            return parser.parseDictionary();
        } else {
            fail("unsupported header type");
            return null;
        }
    }

    private static void match(JsonValue value, JsonValue params, Type<? extends Object> item) {
        if (value instanceof JsonString) {
            CharSequence expected = (((JsonString) value).getChars());
            assertEquals(expected, item.get());
        } else if (value instanceof JsonNumber) {
            JsonNumber num = (JsonNumber) value;
            if (num.isIntegral()) {
                assertEquals(num.longValueExact(), item.get());
            } else {
                assertEquals(num.toString(), item.serialize());
            }
        } else if (value instanceof JsonObject) {
            JsonObject container = (JsonObject) value;
            if (container.containsKey("__type")) {
                String type = container.getString("__type");
                if ("binary".equals(type)) {
                    byte expectedBytes[] = new Base32().decode(container.get("value").toString());
                    byte actualBytes[] = ((ByteBuffer) (item.get())).array();
                    assertArrayEquals(expectedBytes, actualBytes);
                } else if ("token".equals(type)) {
                    CharSequence expectedString = ((JsonString) container.get("value")).getChars();
                    assertEquals(expectedString, item.get());
                } else {
                    fail("unexpected type: " + type);
                }
            } else {
                Map<String, Item<? extends Object>> result = (Map<String, Item<? extends Object>>) item.get();
                assertEquals(container.size(), result.size());
                for (Map.Entry<String, JsonValue> e : container.entrySet()) {
                    if (e.getValue() instanceof JsonArray) {
                        JsonArray array = (JsonArray) e.getValue();
                        assertEquals(2, array.size());
                        match(array.get(0), array.get(1), result.get(e.getKey()));
                    } else {
                        match(e.getValue(), null, result.get(e.getKey()));
                    }
                }
            }
        } else if (value instanceof JsonArray) {
            JsonArray array = (JsonArray) value;
            List<Item<? extends Object>> result = (List<Item<? extends Object>>) item.get();
            assertEquals(array.size(), result.size());
            for (int i = 0; i < array.size(); i++) {
                JsonArray t = (JsonArray) array.get(i);
                assertEquals(2, t.size());
                match(t.get(0), t.get(1), result.get(i));
            }
        } else if (value instanceof JsonValue) {
            if (JsonValue.TRUE.equals(value) || JsonValue.FALSE.equals(value)) {
                Boolean expected = Boolean.valueOf(((JsonValue) value).toString());
                assertEquals(expected, item.get());
            } else {
                fail("unexpected JsonValue: " + value + " (" + value.getClass() + ")");
            }
        } else {
            fail("unexpected type: " + value.getClass());
        }
        if (params != null) {
            assertTrue(item instanceof Parametrizable);
            Map<String, Item<? extends Object>> result = ((Parametrizable<? extends Object>) item).getParams();

            if (params instanceof JsonArray) {
                // new format
                JsonArray expected = (JsonArray) params;
                assertEquals(expected.size(), result.size());
                int i = 0;
                for (Map.Entry<String, Item<? extends Object>> param : result.entrySet()) {
                    JsonArray e = (JsonArray) expected.get(i);
                    assertEquals(2, e.size());
                    assertEquals(((JsonString) e.get(0)).getString(), param.getKey());
                    match(e.get(1), null, param.getValue());
                    i += 1;
                }
            } else {
                fail("unexpected param type: " + params);
            }

        }
    }

    public void executeTest() {
        if (p.must_fail) {
            try {
                Type<? extends Object> parsed = parse();
                fail("should fail, but passed. Input >>>" + p.raw + "<<<, Output >>>" + parsed.serialize() + "<<<");
            } catch (ParseException expected) {
                // System.out.println(p.name);
                // System.err.println(expected.getDiagnostics());
            }
        } else {
            Type<? extends Object> item = parse();
            if (p.expected_value instanceof JsonArray) {
                JsonArray array = (JsonArray) p.expected_value;
                if (item instanceof OuterList) {
                    for (int i = 0; i < array.size(); i++) {
                        JsonValue m = array.get(i);
                        match(((JsonArray) m).get(0), ((JsonArray) m).get(1), ((OuterList) item).get().get(i));
                    }
                } else if (item instanceof Dictionary) {
                    int i = 0;
                    for (Map.Entry<String, ListElement<? extends Object>> e : ((Dictionary) item).get().entrySet()) {
                        JsonArray m = (JsonArray) array.get(i);
                        JsonValue name = m.get(0);
                        JsonArray val = (JsonArray) m.get(1);
                        assertEquals(((JsonString) name).getString(), e.getKey());
                        match(val.get(0), val.get(1), e.getValue());
                        i += 1;
                    }
                } else {
                    fail("unexpected parse result: " + item.getClass());
                }
            } else {
                match(p.expected_value, p.expected_params, item);
            }

            if (p.canonical != null) {
                assertEquals(p.canonical, item.serialize());
            }
        }
    }
}
