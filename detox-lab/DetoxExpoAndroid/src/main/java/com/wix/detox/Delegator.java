package com.wix.detox;

import org.joor.Reflect;
import org.joor.ReflectException;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

/**
 * Created by simonracz on 29/05/2017.

 * <p>
 * Helper class for InvocationHandlers, which delegates equals, hashCode and toString
 * calls to Object.
 * </p>
 *
 * <p>
 * Copied from here
 * <a href="https://docs.oracle.com/javase/8/docs/technotes/guides/reflection/proxy.html">Delegator</a>
 * </p>
 */
public class Delegator implements InvocationHandler {

    private static Method hashCodeMethod;
    private static Method equalsMethod;
    private static Method toStringMethod;
    static {
        try {
            hashCodeMethod = Object.class.getMethod("hashCode");
            equalsMethod =
                    Object.class.getMethod("equals", new Class[] { Object.class });
            toStringMethod = Object.class.getMethod("toString");
        } catch (NoSuchMethodException e) {
            throw new NoSuchMethodError(e.getMessage());
        }
    }

    private Class[] interfaces;
    private Object[] delegates;

    public Delegator(Class[] interfaces, Object[] delegates) {
        this.interfaces = (Class[]) interfaces.clone();
        this.delegates = (Object[]) delegates.clone();
    }

    public Object invoke(Object proxy, Method m, Object[] args)
            throws Throwable
    {
        Class declaringClass = m.getDeclaringClass();

        if (declaringClass == Object.class) {
            if (m.equals(hashCodeMethod)) {
                return proxyHashCode(proxy);
            } else if (m.equals(equalsMethod)) {
                return proxyEquals(proxy, args[0]);
            } else if (m.equals(toStringMethod)) {
                return proxyToString(proxy);
            } else {
                throw new InternalError(
                        "unexpected Object method dispatched: " + m);
            }
        } else {
            for (int i = 0; i < interfaces.length; i++) {
                if (declaringClass.isAssignableFrom(interfaces[i])) {
                    try {
                        return Reflect.on(delegates[i]).call(m.getName(), args).get();
                    } catch (ReflectException e) {
                        throw e.getCause();
                    }
                }
            }

            return invokeNotDelegated(proxy, m, args);
        }
    }

    // Simple workaround for a deeply rooted issue regarding Proxy classes
    public Object invokeAsString(String methodName) throws ReflectException {
        return Reflect.on(delegates[0]).call(methodName).get();
    }

    // Simple workaround for a deeply rooted issue regarding Proxy classes
    public Object invokeAsString(String methodName, Object[] args) throws ReflectException {
        return Reflect.on(delegates[0]).call(methodName, args).get();
    }

    protected Object invokeNotDelegated(Object proxy, Method m,
                                        Object[] args)
            throws Throwable
    {
        throw new InternalError("unexpected method dispatched: " + m);
    }

    protected Integer proxyHashCode(Object proxy) {
        return System.identityHashCode(proxy);
    }

    protected Boolean proxyEquals(Object proxy, Object other) {
        return (proxy == other ? Boolean.TRUE : Boolean.FALSE);
    }

    protected String proxyToString(Object proxy) {
        return proxy.getClass().getName() + '@' +
                Integer.toHexString(proxy.hashCode());
    }
}
