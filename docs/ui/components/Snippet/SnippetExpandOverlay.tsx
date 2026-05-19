import { Button, ButtonProps } from '@expo/styleguide';

type Props = {
  onClick?: ButtonProps['onClick'];
};

export function SnippetExpandOverlay({ onClick }: Props) {
  return (
    <div className="sticky bottom-0 left-0 flex w-full bg-linear-to-b from-transparent to-default p-6">
      <Button theme="secondary" onClick={onClick} className="mx-auto asset-sm-shadow">
        Show more
      </Button>
    </div>
  );
}
