package com.reactnativecommunity.picker;

public class ReactPickerLocalData {
    private final int height;

    public ReactPickerLocalData(int height) {
        this.height = height;
    }

    public int getHeight() {
        return height;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ReactPickerLocalData that = (ReactPickerLocalData) o;
        return height == that.height;
    }

    @Override
    public int hashCode() {
        return 31 + height;
    }

    @Override
    public String toString() {
        return "RectPickerLocalData{" +
                "height=" + height +
                '}';
    }
}
