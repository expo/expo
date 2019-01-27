package com.wix.invoke.types;

import org.junit.Test;

import java.util.HashMap;
import java.util.LinkedHashMap;
import static org.assertj.core.api.Java6Assertions.assertThat;
/**
 * Created by rotemm on 26/10/2016.
 */

public class InvocationTest {

    @Test
    public void InvocationArgTypes() {
        Invocation invocation = new Invocation(new ClassTarget("java.lang.System"), "lineSeparator");

        Object[] inputArgs = new Object[7];

        inputArgs[0] = createArg("Integer", 1);
        inputArgs[1] = createArg("Float", 1.0);
        inputArgs[2] = createArg("Double", 1.0);
        inputArgs[3] = createArg("Float", 1.0);
        inputArgs[4] = createArg("String", "bla");
        inputArgs[5] = createArg("Boolean", true);

        invocation.setArgs(inputArgs);
        Object[] outputArgs = invocation.getArgs();

        assertThat(outputArgs[0].getClass()).isEqualTo(Integer.class);
        assertThat(outputArgs[1].getClass()).isEqualTo(Float.class);
        assertThat(outputArgs[2].getClass()).isEqualTo(Double.class);
        assertThat(outputArgs[3].getClass()).isEqualTo(Float.class);
        assertThat(outputArgs[4].getClass()).isEqualTo(String.class);
        assertThat(outputArgs[5].getClass()).isEqualTo(Boolean.class);
    }

    public HashMap<String, Object> createArg(String type, Object value) {
        LinkedHashMap<String, Object> arg = new LinkedHashMap<>();
        arg.put("type", type);
        arg.put("value", value);

        return arg;
    }
}
