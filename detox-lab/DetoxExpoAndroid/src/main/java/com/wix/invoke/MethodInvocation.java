package com.wix.invoke;

import com.wix.invoke.exceptions.EmptyInvocationInstructionException;
import com.wix.invoke.parser.JsonParser;
import com.wix.invoke.types.Invocation;
import com.wix.invoke.types.Target;

import org.apache.commons.lang3.StringUtils;

import java.lang.reflect.InvocationTargetException;
import org.json.JSONException;


/**
 * Created by rotemm on 10/10/2016.
 */
public class MethodInvocation {

    public static Object invoke(String invocationJson) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException, JSONException {
        return invoke(invocationJson, null);
    }

    public static Object invoke(String invocationJson, Class<?> extendWith) throws ClassNotFoundException, NoSuchMethodException, InvocationTargetException, IllegalAccessException, JSONException {
        JsonParser parser = new JsonParser();
        Invocation invocation = new Invocation(parser.parse(invocationJson));
        return invoke(invocation);
    }

    public static Object invoke(Invocation invocation) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        if (StringUtils.isBlank(invocation.getMethod()))
            throw new EmptyInvocationInstructionException();

        try {
            Target target = invocation.getTarget();
            return target.invoke(invocation);
        } catch (Exception e) {
            throw e;
        }
    }
}
