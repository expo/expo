import { mergeClasses } from '@expo/styleguide';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ComponentType, HTMLAttributes, ReactNode } from 'react';

import { A, CALLOUT, FOOTNOTE } from '../Text';

type Props = Omit<DropdownMenu.DropdownMenuItemProps, 'onClick'> & {
  label: string;
  description?: React.ReactNode;
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
        'relative z-40 flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1',
        'hocus:bg-hover hover:outline-0',
        disabled && 'cursor-default opacity-60 hocus:bg-default'
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
      <div className="flex flex-1 flex-col gap-0.5">
        <div
          className={mergeClasses(
            'flex items-center justify-between',
            disabled && 'pointer-events-none'
          )}>
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className={mergeClasses('icon-sm', destructive && 'text-icon-danger')} />
            )}
            <CALLOUT theme={destructive ? 'danger' : 'default'}>{label}</CALLOUT>
          </div>
          {typeof rightSlot === 'string' ? (
            <FOOTNOTE theme="secondary">{rightSlot}</FOOTNOTE>
          ) : (
            rightSlot
          )}
        </div>
        {description && typeof description === 'string' ? (
          <FOOTNOTE theme="tertiary" className="!leading-[18px]">
            {description}
          </FOOTNOTE>
        ) : null}
        {description && typeof description !== 'string' ? description : null}
      </div>
    </DropdownMenu.Item>
  );

  if (href) {
    return (
      <A href={href} openInNewTab={openInNewTab}>
        {textItem}
      </A>
    );
  } else {
    return textItem;
  }
}
