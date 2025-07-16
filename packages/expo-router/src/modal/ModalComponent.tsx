import { NavigationContext } from '@react-navigation/native';

import { type ModalConfig } from './ModalContext';

interface ModalComponentProps {
  modalConfig: ModalConfig;
}

export function ModalComponent({ modalConfig }: ModalComponentProps) {
  const component = modalConfig.component;
  const navigationProp = modalConfig.parentNavigationProp;

  return <NavigationContext value={navigationProp}>{component}</NavigationContext>;
}
