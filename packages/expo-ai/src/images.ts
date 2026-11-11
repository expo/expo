import { LanguageModelError } from './LanguageModelError';
import type { ImageInput } from './LanguageModels.types';

export type RequestImage = Required<ImageInput>;

/** Snapshot local image references before readiness checks or application callbacks. */
export function snapshotImages(value: unknown): readonly RequestImage[] | undefined {
  if (value === undefined) return undefined;
  function invalid(): never {
    throw new LanguageModelError(
      'ERR_OPTIONS_INVALID',
      'images must contain up to 8 local file URLs with unique labels of 1–128 characters.'
    );
  }
  if (
    !Array.isArray(value) ||
    value.length > 8 ||
    Reflect.ownKeys(value).length !== value.length + 1
  )
    invalid();
  const labels = new Set<string>();
  const images: RequestImage[] = [];
  for (let index = 0; index < value.length; index++) {
    const entry = Object.getOwnPropertyDescriptor(value, String(index));
    if (!entry || !entry.enumerable || !('value' in entry)) invalid();
    const image: unknown = entry.value;
    if (!image || typeof image !== 'object' || Array.isArray(image)) invalid();
    const fields = Object.getOwnPropertyDescriptors(image);
    for (const key of Reflect.ownKeys(image)) {
      if (
        (key !== 'uri' && key !== 'label') ||
        !fields[key]?.enumerable ||
        !('value' in fields[key]!)
      )
        invalid();
    }
    const uri: unknown = fields.uri?.value;
    const label: unknown =
      fields.label?.value === undefined ? `image-${index + 1}` : fields.label.value;
    if (
      typeof uri !== 'string' ||
      !uri.startsWith('file://') ||
      /[\p{Cc}\p{Cf}]/u.test(uri) ||
      typeof label !== 'string' ||
      label.length === 0 ||
      label.length > 128 ||
      /[\p{Cc}\p{Cf}]/u.test(label) ||
      labels.has(label)
    )
      invalid();
    try {
      const url = new URL(uri);
      if (
        url.protocol !== 'file:' ||
        (url.hostname !== '' && url.hostname !== 'localhost') ||
        !url.pathname.startsWith('/') ||
        url.search !== '' ||
        url.hash !== '' ||
        /[\p{Cc}\p{Cf}]/u.test(decodeURIComponent(url.pathname))
      )
        invalid();
    } catch {
      invalid();
    }
    labels.add(label);
    images.push(Object.freeze({ uri, label }));
  }
  return Object.freeze(images);
}
