package host.exp.exponent.notifications.channels;

import android.animation.TypeConverter;

@com.raizlabs.android.dbflow.annotation.TypeConverter
public class ArrayConverter extends TypeConverter<String, Long []> {

  public ArrayConverter(Class<String> fromClass, Class<Long[]> toClass) {
    super(fromClass, toClass);
  }

  @Override
  public Long[] convert(String value) {
    return new Long[0];
  }
}
