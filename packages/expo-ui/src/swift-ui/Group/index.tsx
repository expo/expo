import { requireNativeLayoutView } from '../../requireNativeLayoutView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface GroupProps extends CommonViewModifierProps {
  children: React.ReactNode;
}

const GroupNativeView: React.ComponentType<GroupProps> = requireNativeLayoutView(
  'ExpoUI',
  'GroupView'
);

export function Group(props: GroupProps) {
  const { modifiers, ...restProps } = props;
  return (
    <GroupNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
