package com.wix.invoke.types;

import com.wix.invoke.parser.JsonParser;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

/**
 * Created by rotemm on 10/10/2016.
 */
public class Invocation {
    private Target target;
    private String method;
    private Object[] args;

    public Invocation() {

    }

    public Invocation(Target target, String method, Object... args) {
        this.target = target;
        this.method = method;
        this.args = args;
    }

    public Invocation(JSONObject json) throws JSONException {
        this.target = Target.getTarget(json.getJSONObject("target"));
        this.method = json.getString("method");
        JSONArray args = json.getJSONArray("args");
        try {
            this.setArgs(args);
        } catch (JSONException e) {
            throw new RuntimeException("Unable to convert args: " + e);
        }
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public Target getTarget() {
        return target;
    }

    public void setTarget(Target target) {
        this.target = target;
    }

    public Object[] getArgs() {
        return args;
    }

    public void setArgs(JSONArray args) throws JSONException {
        Object[] outputArgs = new Object[args.length()];
        for (int i = 0; i < args.length(); i++) {
            Object argument = null;
            if (args.get(i).getClass() == String.class) {
                argument = args.get(i);
            } else if(args.get(i).getClass() == JSONArray.class) {
                JSONArray jsonArray = (JSONArray) args.get(i);
                List<String> list = new ArrayList<>();
                for (int j = 0; j < jsonArray.length(); j++) {
                    list.add(jsonArray.getString(j));
                }
                argument = list;
            } else {
                JSONObject jsonArgument = args.optJSONObject(i);
                if (jsonArgument != null && jsonArgument.optString("type") != null) {
                    String type = jsonArgument.optString("type");
                    if (type.equals("Integer")) {
                        argument = jsonArgument.optInt("value");
                    } else if (type.equals("integer")) {
                        argument = jsonArgument.optInt("value");
                    } else if (type.equals("Float")) {
                        argument = Float.valueOf(jsonArgument.optString("value"));
                    } else if (type.equals("Double")) {
                        argument = jsonArgument.optDouble("value");
                    } else if (type.equals("String")) {
                        argument = jsonArgument.optString("value");
                    } else if (type.equals("Boolean")) {
                        argument = jsonArgument.optBoolean("value");
                    } else if (type.equals("boolean")) {
                        argument = jsonArgument.optBoolean("value");
                    } else if (type.equals("Invocation")) {
                        argument = new Invocation(jsonArgument.optJSONObject("value"));                        
                    } else {
                        throw new RuntimeException("Unhandled arg type" + type);
                    }
                }
            }
            outputArgs[i] = argument;
        }

        this.args = outputArgs;
    }

    public void setArgs(Object[] args) {
        for (int i = 0; i < args.length; i++) {
            Object argument = args[i];
            if (argument instanceof HashMap && !((HashMap) argument).isEmpty()) {
                String type = (String) ((HashMap) argument).get("type");
                Object value = ((HashMap) argument).get("value");
                if (type.equals("Integer")) {
                    argument = (int) value;
                } else if (type.equals("integer")) {
                    argument = (int) value;
                } else if (type.equals("Float")) {
                    argument = Float.valueOf(value.toString());
                } else if (type.equals("Double")) {
                    argument = Double.valueOf(value.toString());
                } else if (type.equals("String")) {
                    argument = (String) value;
                }else if (type.equals("Boolean")) {
                    argument = ((Boolean) value);
                } else if (type.equals("boolean")) {
                    argument = ((Boolean) value).booleanValue();
                } else if (type.equals("Invocation")) {
                    JsonParser parser = new JsonParser();
                    argument = parser.parse((String)value);
                } else {
                    throw new RuntimeException("Unhandled arg type" + type);
                }

                args[i] = argument;
            }
        }

        this.args = args;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Invocation)) return false;

        Invocation that = (Invocation) o;

        if (target != null ? !target.equals(that.target) : that.target != null) return false;
        if (method != null ? !method.equals(that.method) : that.method != null) return false;
        return Arrays.equals(args, that.args);

    }

    @Override
    public int hashCode() {
        int result = target != null ? target.hashCode() : 0;
        result = 31 * result + (method != null ? method.hashCode() : 0);
        result = 31 * result + Arrays.hashCode(args);
        return result;
    }
}
