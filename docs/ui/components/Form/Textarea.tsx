import { mergeClasses } from '@expo/styleguide';
import { useState, type InputHTMLAttributes } from 'react';

import { CAPTION } from '../Text';

type Props = {
  characterLimit?: number;
} & InputHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ characterLimit, className, onChange, ...rest }: Props) {
  const [characterCount, setCharacterCount] = useState(0);

  return (
    <div className="relative">
      <textarea
        onChange={e => {
          setCharacterCount(e.target.value.length ?? 0);
          if (onChange) onChange(e);
        }}
        className={mergeClasses(
          'my-2.5 block h-12 w-full rounded-sm border border-default bg-default p-4 leading-5 text-default shadow-xs placeholder:text-icon-tertiary',
          className
        )}
        {...rest}
      />
      {characterLimit && (
        <CAPTION
          theme={characterCount > characterLimit ? 'danger' : 'secondary'}
          tag="code"
          className="absolute bottom-1.5 right-3 z-10">
          {characterLimit - characterCount}
        </CAPTION>
      )}
    </div>
  );
}
