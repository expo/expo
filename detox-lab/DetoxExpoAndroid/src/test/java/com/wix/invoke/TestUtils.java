package com.wix.invoke;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;

/**
 * Created by rotemm on 13/10/2016.
 */
public class TestUtils {
    public static String jsonFileToString(String path) {
        try {
            return StringUtils.deleteWhitespace(IOUtils.toString(
                    MethodInvocation.class.getClassLoader().getResourceAsStream(path)));
        } catch (IOException e) {

            throw new RuntimeException(e);
        }
    }
}
