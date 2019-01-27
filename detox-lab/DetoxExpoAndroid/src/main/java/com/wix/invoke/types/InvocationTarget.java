package com.wix.invoke.types;

import org.apache.commons.lang3.reflect.MethodUtils;

import java.lang.reflect.InvocationTargetException;

/**
 * Created by rotemm on 20/10/2016.
 */
public class InvocationTarget extends Target {

    public InvocationTarget(Invocation value) {
        super(value);
    }

    @Override
    public Object execute(Invocation invocation) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        return  MethodUtils.invokeExactMethod(invocation.getTarget().getValue(), invocation.getMethod(), invocation.getArgs());
    }
}
