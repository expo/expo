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
              <div className="whitespace-pre-wrap text-left text-sm leading-tight text-quaternary">
                {placeholder}
              </div>
            }
            aria-label={value}
          />
        </Button>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref =>
            ref?.addEventListener('touchend', event => {
              event.preventDefault();
            })
          }
          // z-[605] to be above the dialogs (601)
          className={mergeClasses(
            'relative z-[605] max-w-[87.5vw] overflow-hidden rounded-md border border-default bg-overlay shadow-md',
            'max-md-gutters:max-w-[unset]'
          )}
          data-orientation="horizontal">
          <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center rounded-t-md bg-element">
            <ChevronUpIcon className="icon-sm text-icon-secondary" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport>
            <SelectPrimitive.Group>
              {optionsLabel && (
                <SelectPrimitive.Label className="cursor-default px-3 pb-1 pt-2 text-2xs text-tertiary">
                  {optionsLabel}
                </SelectPrimitive.Label>
              )}
              {options?.map(({ id, label, imageUrl, Icon, rightSlot, leftSlot }) => (
                <SelectPrimitive.Item
                  key={id}
                  value={id}
                  className={mergeClasses(
                    'flex h-9 cursor-pointer items-center justify-between !rounded-none px-3 py-2',
                    'hocus:bg-hover hocus:outline-0',
                    size === 'lg' && 'h-[56px]'
                  )}>
                  <SelectPrimitive.ItemText>
                    <div
                      className={mergeClasses(
                        'flex items-center gap-2 whitespace-pre-wrap text-left text-xs font-normal leading-tight text-default',
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
                        'icon-sm shrink-0 text-icon-secondary',
                        size === 'lg' && 'icon-md'
                      )}
                    />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Group>
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center rounded-b-md bg-element">
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
          <p className="text-xs font-medium text-tertiary">{caption}</p>
        ) : (
          caption
        )}
        {selectComponent}
      </div>
    );
  }

  return selectComponent;
}
