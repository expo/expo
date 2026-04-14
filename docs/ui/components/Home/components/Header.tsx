import { mergeClasses } from '@expo/styleguide';

import { P } from '../../Text';

type Props = {
  title: string;
  description: string;
  className?: string;
};

export function Header({ title, description, className }: Props) {
  return (
    <div className={mergeClasses('mt-5 mb-1.5 flex flex-col gap-1', className)}>
      <h3 className="heading-lg max-md-gutters:heading-xl">{title}</h3>
      <P className="text-secondary">{description}</P>
    </div>
  );
}
