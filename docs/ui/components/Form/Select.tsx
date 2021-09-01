import { css } from '@emotion/react';
import { theme, shadows } from '@expo/styleguide';
import React from 'react';

import { Label } from './Label';

import { ChevronDownIcon } from '~/ui/foundations/icons';

type SelectProps = {
  className?: string;
  defaultValue?: string;
  htmlFor?: string;
  options?: SelectOption[];
  title?: string | ((value?: string) => JSX.Element);
  description?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  autoComplete?: string;
  value?: string;
};

type SelectOption =
  | string
  | {
      title?: string;
      value: string;
    };

export function Select(props: SelectProps) {
  const { options, htmlFor, title, description, ...rest } = props;
  const titleIsString = typeof title === 'string';

  return (
    <div css={containerStyle}>
      {titleIsString && <Label title={title} description={description} htmlFor={htmlFor} />}
      {isRenderer(title) && title(rest.value || rest.defaultValue)}
      <div css={containerStyle}>
        <svg css={iconStyle}>
          <ChevronDownIcon />
        </svg>
        <select css={selectInputStyle} id={htmlFor} {...rest}>
          {options?.map(optionOrString => {
            const option =
              typeof optionOrString === 'string' ? { value: optionOrString } : optionOrString;

            return (
              <option key={option.value} value={option.value}>
                {option.title || option.value}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}

function isRenderer(title: SelectProps['title']): title is (value?: string) => JSX.Element {
  return typeof title === 'function';
}

const containerStyle = css({
  position: 'relative',
  width: '100%',
  flex: 1,
});

const iconStyle = css({
  pointerEvents: 'none',
  position: 'absolute',
  right: 16,
  top: 16,
  height: 20,
  width: 20,
});

const selectInputStyle = css({
  boxShadow: shadows.input,
  backgroundColor: theme.background.default,
  color: theme.text.default,
  display: 'block',
  outline: 'none',
  appearance: 'none',
  borderRadius: 3,
  border: `1px solid ${theme.border.default}`,
  width: '100%',
  padding: 16,
  paddingRight: 48,
  fontSize: 16,
  userSelect: 'none',
  ':hover': {
    transition: 'background-color 100ms',
    cursor: 'pointer',
    backgroundColor: theme.background.secondary,
  },
});
