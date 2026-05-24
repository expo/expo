export const EXPO_SHARED_OBJECT_ID_KEY = '__expo_shared_object_id__';
export const EXPO_UI_SHARED_OBJECT_BRAND = '__expo_ui_shared_object__';

export type ExpoUISharedObject = {
  [EXPO_SHARED_OBJECT_ID_KEY]: number;
  [EXPO_UI_SHARED_OBJECT_BRAND]: true;
};

export function isExpoUISharedObject(value: unknown): value is ExpoUISharedObject {
  'worklet';
  if (value == null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Partial<ExpoUISharedObject>;
  return (
    obj[EXPO_UI_SHARED_OBJECT_BRAND] === true &&
    typeof obj[EXPO_SHARED_OBJECT_ID_KEY] === 'number' &&
    obj[EXPO_SHARED_OBJECT_ID_KEY] !== 0
  );
}
