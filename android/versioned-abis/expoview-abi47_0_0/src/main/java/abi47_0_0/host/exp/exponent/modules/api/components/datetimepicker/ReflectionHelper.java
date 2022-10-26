package abi47_0_0.host.exp.exponent.modules.api.components.datetimepicker;

import androidx.annotation.Nullable;

import java.lang.reflect.Field;

public class ReflectionHelper {

    @Nullable
    public static Field findField(Class objectClass, Class fieldClass, String expectedName) {
        try {
            Field field = objectClass.getDeclaredField(expectedName);
            field.setAccessible(true);
            return field;
        } catch (NoSuchFieldException e) {
            // ignore
        }
        // search for it if it wasn't found under the expected ivar name
        for (Field searchField : objectClass.getDeclaredFields()) {
            if (searchField.getType() == fieldClass) {
                searchField.setAccessible(true);
                return searchField;
            }
        }
        return null;
    }
}
