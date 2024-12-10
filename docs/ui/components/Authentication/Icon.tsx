import { mergeClasses } from '@expo/styleguide';

type IconProps = {
  title: string;
  image?: string;
  className?: string;
  size?: number;
};

export const Icon = ({ title, image, className }: IconProps) => (
  <img
    className={mergeClasses('size-16 rounded-full bg-element p-1', className)}
    alt={title}
    src={image}
  />
);
