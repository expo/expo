package com.wix.invoke.parser;

import org.json.JSONObject;
import org.json.JSONException;

/**
 * Created by rotemm on 13/10/2016.
 */
public class JsonParser {

    public JsonParser() {
    }

    public JSONObject parse(String jsonData) {
        try {
            JSONObject obj = new JSONObject(jsonData);
            return obj;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }
}
