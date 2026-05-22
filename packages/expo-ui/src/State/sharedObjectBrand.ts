export const EXPO_SHARED_OBJECT_ID_KEY = '__expo_shared_object_id__';
export const EXPO_UI_SHARED_OBJECT_BRAND = '__expo_ui_shared_object__';

export type ExpoUISharedObject = {
  [EXPO_SHARED_OBJECT_ID_KEY]: number;
  [EXPO_UI_SHARED_OBJECT_BRAND]: true;
};

export function brandExpoUISharedObject<T extends object>(sharedObject: T): T {
  Object.defineProperty(sharedObject, EXPO_UI_SHARED_OBJECT_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return sharedObject;
}

export function isExpoUISharedObject(value: unknown): value is ExpoUISharedObject {
  'worklet';
  const objectId = (value as { [EXPO_SHARED_OBJECT_ID_KEY]?: number })[
    EXPO_SHARED_OBJECT_ID_KEY
  ];
  return (
    value != null &&
    typeof value === 'object' &&
    EXPO_SHARED_OBJECT_ID_KEY in value &&
    objectId !== 0 &&
    (value as Partial<ExpoUISharedObject>)[EXPO_UI_SHARED_OBJECT_BRAND] === true
  );
}
