import { mergeClasses, Button } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { ChevronUpIcon } from '@expo/styleguide-icons/outline/ChevronUpIcon';
import * as RawSelectPrimitive from '@radix-ui/react-select';
import { ComponentType, HTMLAttributes, ReactElement, ReactNode } from 'react';

// note(simek): Radix Jest ESM issue workaround: https://github.com/radix-ui/primitives/issues/1848
let SelectPrimitive = { default: undefined, ...RawSelectPrimitive };
SelectPrimitive = SelectPrimitive.default ?? SelectPrimitive;

export type SelectProps = RawSelectPrimitive.SelectProps & {
  id?: string;
  optionsLabel?: string;
  placeholder?: string;
  testID?: string;
  ariaLabel?: string;
  className?: string;
  caption?: ReactNode;
  size?: 'md' | 'lg';
  options?: {
    id: string;
    label: string;
    imageUrl?: string;
    Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
    leftSlot?: ReactElement;
    rightSlot?: ReactElement;
  }[];
};

export function Select({
  options,
  optionsLabel,
  id,
  value,
  onValueChange,
  onOpenChange,
  placeholder,
  testID,
  ariaLabel,
  className,
  caption,
  disabled = false,
  size = 'md',
}: SelectProps) {
  const selectComponent = (
    <SelectPrimitive.Root
      name={id}
      onOpenChange={onOpenChange}
      onValueChange={onValueChange}
      value={value}
      disabled={disabled}>
      <SelectPrimitive.Trigger asChild className="flex">
        <Button
          disabled={disabled}
          theme="secondary"
          size={size === 'lg' ? 'xl' : 'sm'}
          aria-label={ariaLabel}
          rightSlot={
            <ChevronDownIcon
              className={mergeClasses('icon-sm text-icon-secondary', size === 'lg' && 'icon-md')}
            />
          }
          className={mergeClasses(
            'min-h-[36px] transform-none justify-between truncate px-3',
            !value && 'text-quaternary',
            size === 'lg' && 'min-h-[52px]',
            className
          )}
          {...{ 'data-testid': testID }}>
          <SelectPrimitive.Value
            placeholder={
              <div className="text-quaternary text-left text-sm leading-tight whitespace-pre-wrap">
                {placeholder}
              </div>
            }
            aria-label={value}
          />
        </Button>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          // z-[605] to be above the dialogs (601)
          className={mergeClasses(
            'border-default bg-overlay relative z-[605] max-w-[87.5vw] overflow-hidden rounded-md border shadow-md',
            'max-md-gutters:max-w-[unset]'
          )}
          data-orientation="horizontal">
          <SelectPrimitive.ScrollUpButton className="bg-element flex h-7 items-center justify-center rounded-t-md">
            <ChevronUpIcon className="icon-sm text-icon-secondary" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport>
            <SelectPrimitive.Group>
              {optionsLabel && (
                <SelectPrimitive.Label className="text-tertiary cursor-default px-3 pt-2 pb-1 text-xs">
                  {optionsLabel}
                </SelectPrimitive.Label>
              )}
              {options?.map(({ id, label, imageUrl, Icon, rightSlot, leftSlot }) => (
                <SelectPrimitive.Item
                  key={id}
                  value={id}
                  className={mergeClasses(
                    'flex h-9 cursor-pointer items-center justify-between rounded-none! px-3 py-2',
                    'hocus:bg-hover hocus:outline-0',
                    size === 'lg' && 'h-[56px]'
                  )}>
                  <SelectPrimitive.ItemText>
                    <div
                      className={mergeClasses(
                        'text-default flex items-center gap-2 text-left text-sm leading-tight font-normal whitespace-pre-wrap',
                        size === 'lg' && 'text-lg'
                      )}>
                      {leftSlot}
                      {Icon && (
                        <SelectPrimitive.Icon>
                          <Icon className={mergeClasses('icon-sm', size === 'lg' && 'icon-md')} />
                        </SelectPrimitive.Icon>
                      )}
                      {imageUrl && (
                        <img alt={String(id)} src={imageUrl} className="size-8 rounded-full" />
                      )}
                      {label}
                      {rightSlot}
                    </div>
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <CheckIcon
                      className={mergeClasses(
                        'icon-sm text-icon-secondary shrink-0',
                        size === 'lg' && 'icon-md'
                      )}
                    />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Group>
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="bg-element flex h-7 items-center justify-center rounded-b-md">
            <ChevronDownIcon className="icon-sm text-icon-secondary" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );

  if (caption) {
    return (
      <div className="flex flex-col gap-1">
        {typeof caption === 'string' ? (
          <p className="text-tertiary text-sm font-medium">{caption}</p>
        ) : (
          caption
        )}
        {selectComponent}
      </div>
    );
  }

  return selectComponent;
}
