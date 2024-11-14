import { mergeClasses } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { forwardRef, Ref, InputHTMLAttributes, ReactNode } from 'react';

import { P } from '../Text';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
};

export const Checkbox = forwardRef(function Checkbox(
  { className, label, id, disabled, checked, ...rest }: Props,
  ref?: Ref<HTMLInputElement>
) {
  return (
    <div className={mergeClasses('relative flex items-center gap-2', className)}>
      {checked && (
        <CheckIcon className="absolute w-4 px-0.5 text-palette-white [&_path]:!stroke-[3px]" />
      )}
      <input
        type="checkbox"
        id={id}
        ref={ref}
        checked={checked}
        data-label={label}
        disabled={disabled}
        className={mergeClasses(
          'size-4 rounded-sm border border-palette-gray8 bg-default transition-colors',
          !disabled &&
            'focus-within:ring-palette-blue10 hocus:cursor-pointer hocus:border-palette-blue10 hocus:bg-palette-blue3',
          !disabled && 'dark:focus:ring-palette-blue8 dark:hocus:border-palette-blue8',
          'checked:border-palette-blue10 checked:bg-palette-blue10 checked:hocus:bg-palette-blue10',
          'dark:checked:bg-palette-blue8 dark:checked:hocus:bg-palette-blue8'
        )}
        {...rest}
      />
      {label && (
        <label
          htmlFor={id}
          className={mergeClasses('select-none text-default', !disabled && 'hocus:cursor-pointer')}>
          {typeof label === 'string' ? <P>{label}</P> : label}
        </label>
      )}
    </div>
  );
});
