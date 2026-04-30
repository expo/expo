import { Button, ButtonProps } from '@expo/styleguide';
import { FormattedMessage } from 'react-intl';

type Props = {
  onClick?: ButtonProps['onClick'];
};

export function SnippetExpandOverlay({ onClick }: Props) {
  return (
    <div className="to-default sticky bottom-0 left-0 flex w-full bg-linear-to-b from-transparent p-6">
      <Button theme="secondary" onClick={onClick} className="asset-sm-shadow mx-auto">
        <FormattedMessage id="showMore" defaultMessage="Show More" />
      </Button>
    </div>
  );
}
