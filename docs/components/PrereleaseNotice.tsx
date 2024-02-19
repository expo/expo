import { PropsWithChildren } from 'react';
import ReactMarkdown from 'react-markdown';

import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Callout } from '~/ui/components/Callout';
import { Collapsible } from '~/ui/components/Collapsible';
import { CODE } from '~/ui/components/Text';

type Props = PropsWithChildren<object>;

export default function PrereleaseNotice({ children }: Props) {
  return (
    <Callout type="info">
      {children}
      <Collapsible
        summary={
          <>
            What are Next (<CODE>/next</CODE>) libraries
          </>
        }>
        <ReactMarkdown components={mdComponents}>
          Next libraries are pre-release versions of SDK libraries. We provide them to get feedback
          from the community and test new features before their stable release. If you encounter any
          issue, we encourage reporting on the
          [Expo](https://github.com/expo/expo/issues/new?assignees=&labels=needs+validation&projects=&template=bug_report.yml)
          GitHub repository.
        </ReactMarkdown>
      </Collapsible>
    </Callout>
  );
}
