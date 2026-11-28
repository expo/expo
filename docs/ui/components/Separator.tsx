import { mergeClasses } from '@expo/styleguide';
import { useRouter } from 'next/compat/router';

export function Separator() {
  const router = useRouter();
  const currentPath = router?.asPath ?? router?.pathname ?? '';
  const isSdkPage = currentPath.includes('/sdk/');

  return <div aria-hidden="true" className={mergeClasses('h-12', isSdkPage && 'max-md:hidden')} />;
}
