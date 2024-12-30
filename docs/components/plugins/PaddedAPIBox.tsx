import { mergeClasses } from '@expo/styleguide';

import { APIBox, APIBoxProps } from '~/components/plugins/APIBox';

export function PaddedAPIBox({ children, className, ...props }: APIBoxProps) {
  return (
    <APIBox className={mergeClasses('px-4 py-3', className)} {...props}>
      {children}
    </APIBox>
  );
}
