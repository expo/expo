import { Button, ButtonProps } from '@expo/styleguide';

type Props = {
  onClick?: ButtonProps['onClick'];
};

export function SnippetExpandOverlay({ onClick }: Props) {
  return (
    <div className="absolute bottom-0 left-0 flex w-full bg-gradient-to-b from-transparent to-default p-6">
      <Button theme="secondary" onClick={onClick} className="mx-auto">
        Show more
      </Button>
    </div>
  );
}
