import { mergeClasses } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';

type Props = {
  className?: string;
  size?: 'sm' | 'md';
};

export function SuccessCheckmark({ size = 'md', className }: Props) {
  return (
    <div
      className={mergeClasses(
        'border-success bg-success flex items-center justify-center rounded-full border-2',
        size === 'md' && 'size-20',
        size === 'sm' && 'size-15',
        className
      )}>
      <CheckIcon
        className={mergeClasses(
          'text-success',
          size === 'md' && 'size-10',
          size === 'sm' && 'size-[30px]'
        )}
      />
    </div>
  );
}
