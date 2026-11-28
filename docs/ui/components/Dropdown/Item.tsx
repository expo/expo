import { mergeClasses } from '@expo/styleguide';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ComponentType, HTMLAttributes, ReactNode } from 'react';

import { A, CALLOUT, FOOTNOTE } from '../Text';

type Props = Omit<DropdownMenu.DropdownMenuItemProps, 'onClick'> & {
  label: string;
  description?: ReactNode;
  href?: string;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  rightSlot?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  openInNewTab?: boolean;
  preventAutoClose?: boolean;
};

export function Item({
  label,
  description,
  Icon,
  rightSlot,
  href,
  openInNewTab,
  disabled,
  destructive,
  onSelect,
  preventAutoClose,
  ...rest
}: Props) {
  const textItem = (
    <DropdownMenu.Item
      aria-disabled={disabled}
      className={mergeClasses(
        'group relative z-40 flex h-6.75 cursor-pointer items-center justify-between rounded-sm p-1.5 transition-colors select-none',
        'hover:outline-0 data-highlighted:bg-element',
        disabled && 'cursor-default opacity-60 data-highlighted:bg-default'
      )}
      onSelect={event => {
        // prevent default behavior of closing the menu without using pointer-events-none on the
        // whole item
        if (disabled) {
          event.preventDefault();
          return;
        }

        if (preventAutoClose) {
          event.preventDefault();
        } else {
          // note(simek): workaround for Radix primitives interaction blocking styles desync,
          // when clicking Dropdown option spawns another Radix primitive utilizing Portal, i.e. Dialog
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
        onSelect?.(event);
      }}
      {...rest}>
      <div className="flex flex-1 flex-col gap-1">
        <div
          className={mergeClasses(
            'flex items-center justify-between transition-colors',
            disabled && 'pointer-events-none'
          )}>
          <div className="flex items-center gap-1">
            {Icon && (
              <Icon
                aria-hidden="true"
                className={mergeClasses(
                  'icon-2xs text-icon-default transition-colors',
                  destructive
                    ? 'group-hocus:text-icon-danger group-data-[highlighted]:text-icon-danger'
                    : 'group-hocus:text-icon-secondary group-data-[highlighted]:text-icon-secondary'
                )}
              />
            )}
            <CALLOUT
              theme={destructive ? 'danger' : 'default'}
              className={mergeClasses(
                'text-xs leading-[1.6] font-medium tracking-normal transition-colors',
                destructive
                  ? 'group-hocus:text-danger group-data-[highlighted]:text-danger'
                  : 'text-secondary'
              )}>
              {label}
            </CALLOUT>
          </div>
          {typeof rightSlot === 'string' ? (
            <FOOTNOTE theme="secondary">{rightSlot}</FOOTNOTE>
          ) : (
            rightSlot
          )}
        </div>
        {description && typeof description === 'string' ? (
          <FOOTNOTE theme="tertiary" className="leading-4.5!">
            {description}
          </FOOTNOTE>
        ) : null}
        {description && typeof description !== 'string' ? description : null}
      </div>
    </DropdownMenu.Item>
  );

  if (href) {
    return (
      <A href={href} openInNewTab={openInNewTab} isStyled>
        {textItem}
      </A>
    );
  }

  return textItem;
}
