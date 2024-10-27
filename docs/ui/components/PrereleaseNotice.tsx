import { PropsWithChildren } from 'react';

import { Callout } from '~/ui/components/Callout';
import { Collapsible } from '~/ui/components/Collapsible';
import { A, CODE } from '~/ui/components/Text';

export default function PrereleaseNotice({ children }: PropsWithChildren) {
  return (
    <Callout>
      {children}
      <Collapsible
        summary={
          <>
            What are Next (<CODE>/next</CODE>) libraries
          </>
        }>
        Next libraries are pre-release versions of SDK libraries. We provide them to get feedback
        from the community and test new features before their stable release. If you encounter any
        issue, we encourage reporting on the{' '}
        <A href="https://github.com/expo/expo/issues/new?assignees=&labels=needs+validation&projects=&template=bug_report.yml">
          Expo
        </A>{' '}
        GitHub repository.
      </Collapsible>
    </Callout>
  );
}
