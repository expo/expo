import { useRouter } from 'next/compat/router';

export function Separator() {
  const router = useRouter();
  const currentPath = router?.asPath ?? router?.pathname ?? '';
  const isSdkPage = currentPath.includes('/sdk/');

  if (isSdkPage) {
    return <hr className="mb-6 h-[0.05rem] border-0 bg-palette-gray6" />;
  }

  return <hr className="mb-6 mt-4 h-[0.05rem] border-0 bg-palette-gray6" />;
}
