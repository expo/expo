import { mergeClasses } from '@expo/styleguide';

type Props = {
  className?: string;
};

export function DottedBackground({ className }: Props) {
  return (
    <div
      className={mergeClasses('absolute inset-0 size-full', className)}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '9px 9px',
        backgroundPositionX: 4.5,
        backgroundPositionY: 4.5,
        opacity: '10%',
      }}
    />
  );
}
