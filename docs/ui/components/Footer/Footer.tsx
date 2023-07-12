import { useRouter } from 'next/compat/router';

import { ForumsLink, EditPageLink, IssuesLink } from './Links';

import { NewsletterSignUp } from '~/ui/components/Footer/NewsletterSignUp';
import { PageVote } from '~/ui/components/Footer/PageVote';
import { UL } from '~/ui/components/Text';

const NEWSLETTER_DISABLED = true as const;

type Props = {
  title: string;
  sourceCodeUrl?: string;
  packageName?: string;
};

export const Footer = ({ title, sourceCodeUrl, packageName }: Props) => {
  const router = useRouter();
  const isAPIPage = router?.pathname.includes('/sdk/') ?? false;
  const isExpoPackage = packageName && packageName.startsWith('expo-');

  return (
    <footer className="flex flex-row border-t border-solid border-default mt-10 pt-10 max-md-gutters:flex-col">
      <UL className="flex-1 !mt-0 !ml-0 mb-5 !list-none">
        <ForumsLink isAPIPage={isAPIPage} title={title} />
        {isAPIPage && (
          <IssuesLink title={title} repositoryUrl={isExpoPackage ? undefined : sourceCodeUrl} />
        )}
        {router?.pathname && <EditPageLink pathname={router.pathname} />}
      </UL>
      <PageVote />
      {!NEWSLETTER_DISABLED && <NewsletterSignUp />}
    </footer>
  );
};
