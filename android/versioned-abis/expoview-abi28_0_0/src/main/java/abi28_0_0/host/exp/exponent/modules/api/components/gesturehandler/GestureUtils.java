package abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.MotionEvent;

public class GestureUtils {
    public static float getLastPointerX(MotionEvent event, boolean averageTouches) {
        float offset = event.getRawX() - event.getX();
        int excludeIndex = event.getActionMasked() == MotionEvent.ACTION_POINTER_UP ?
                event.getActionIndex() : -1;

        if (averageTouches) {
            float sum = 0f;
            int count = 0;
            for (int i = 0, size = event.getPointerCount(); i < size; i++) {
                if (i != excludeIndex) {
                    sum += event.getX(i) + offset;
                    count++;
                }
            }
            return sum / count;
        } else {
            int lastPointerIdx = event.getPointerCount() - 1;
            if (lastPointerIdx == excludeIndex) {
                lastPointerIdx--;
            }
            return event.getX(lastPointerIdx) + offset;
        }
    }

    public static float getLastPointerY(MotionEvent event, boolean averageTouches) {
        float offset = event.getRawY() - event.getY();
        int excludeIndex = event.getActionMasked() == MotionEvent.ACTION_POINTER_UP ?
                event.getActionIndex() : -1;

        if (averageTouches) {
            float sum = 0f;
            int count = 0;
            for (int i = 0, size = event.getPointerCount(); i < size; i++) {
                if (i != excludeIndex) {
                    sum += event.getY(i) + offset;
                    count++;
                }
            }
            return sum / count;
        } else {
            int lastPointerIdx = event.getPointerCount() - 1;
            if (lastPointerIdx == excludeIndex) {
                lastPointerIdx -= 1;
            }
            return event.getY(lastPointerIdx) + offset;
        }
    }
}
