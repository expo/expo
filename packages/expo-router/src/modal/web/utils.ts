import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';

// Helper to determine if a given screen should be treated as a modal-type presentation
export function isModalPresentation(
  options?: Partial<Pick<ExtendedStackNavigationOptions, 'presentation'>> | null
) {
  const presentation = options?.presentation;
  return (
    presentation === 'modal' ||
    presentation === 'formSheet' ||
    presentation === 'fullScreenModal' ||
    presentation === 'containedModal'
  );
}
