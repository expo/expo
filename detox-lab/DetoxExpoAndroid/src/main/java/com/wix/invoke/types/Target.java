package com.wix.invoke.types;

import java.lang.reflect.InvocationTargetException;
import org.json.JSONObject;
import org.json.JSONException;

/**
 * Created by rotemm on 10/10/2016.
 */

public abstract class Target {

    Object value;

    public static Target getTarget(JSONObject target) throws JSONException {
        String type = target.getString("type");

        if (type.equals("Invocation")) {
            JSONObject objectValue = target.getJSONObject("value");
            return new InvocationTarget(new Invocation(objectValue));
        }

        if (type.equals("Espresso")) {
            String stringValue = target.getString("value");
            return new ObjectInstanceTarget(stringValue);
        }

        // Default to Class
        String value = target.getString("value");
        return new ClassTarget(value);
    }

    public Target(Object value) {
        this.value = value;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public Object invoke(Invocation invocation) throws ClassNotFoundException, NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        if (this.value instanceof Invocation) {
            Invocation innerInvocation = (Invocation) this.value;
            this.value = innerInvocation.getTarget().invoke(innerInvocation);
        }

        Object[] args = invocation.getArgs();
        for (int i = 0; i < args.length; i++) {
            if (args[i] instanceof Invocation) {
                Invocation innerInvocation = (Invocation) args[i];
                args[i] = innerInvocation.getTarget().invoke(innerInvocation);
            }
        }
        invocation.setArgs(args);
        return execute(invocation);
    }

    public abstract Object execute(Invocation invocation) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Target)) return false;

        Target target = (Target) o;

        return value != null ? value.equals(target.value) : target.value == null;
    }

    @Override
    public int hashCode() {
        int result = (value != null ? value.hashCode() : 0);
        return result;
    }
}