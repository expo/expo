import type { ModalProps } from './Modal';

export function areDetentsValid(detents: ModalProps['detents']): boolean {
  if (Array.isArray(detents)) {
    return (
      !!detents.length &&
      detents.every(
        (detent, index, arr) =>
          typeof detent === 'number' &&
          detent >= 0 &&
          detent <= 1 &&
          detent >= (arr[index - 1] ?? 0)
      )
    );
  }
  return detents === 'fitToContents' || detents === undefined || detents === null;
}
