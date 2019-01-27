package com.wix.invoke.types;


import org.apache.commons.lang3.reflect.MethodUtils;

import java.lang.reflect.InvocationTargetException;

/**
 * Created by rotemm on 20/10/2016.
 */

public class ObjectInstanceTarget extends Target {

    public ObjectInstanceTarget(Object value) {
        super(value);
    }

    @Override
    public Object execute(Invocation invocation) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        return  MethodUtils.invokeExactMethod(this.value, invocation.getMethod(), invocation.getArgs());
    }
}
