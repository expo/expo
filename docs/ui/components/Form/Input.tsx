import { mergeClasses } from '@expo/styleguide';
import { type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: Props) {
  return (
    <input
      className={mergeClasses(
        'my-2.5 block h-12 w-full rounded-md border border-default bg-default px-4 text-default shadow-xs placeholder:text-icon-quaternary',
        className
      )}
      {...rest}
    />
  );
}
