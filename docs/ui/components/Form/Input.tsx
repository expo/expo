import { mergeClasses } from '@expo/styleguide';
import { type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: Props) {
  return (
    <input
      className={mergeClasses(
        'border-default bg-default text-default placeholder:text-icon-quaternary my-2.5 block h-12 w-full rounded-md border px-4 shadow-xs',
        className
      )}
      {...rest}
    />
  );
}
