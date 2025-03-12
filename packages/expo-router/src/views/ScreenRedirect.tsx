import { useRouter } from '../hooks';
import { RedirectProps } from '../link/Link';
import { useFocusEffect } from '../useFocusEffect';

export type ScreenRedirectProps = RedirectProps & {
  name: string;
};

export function ScreenRedirect({ href, relativeToDirectory, withAnchor }: RedirectProps) {
  const router = useRouter();
  useFocusEffect(() => {
    try {
      router.replace(href, { relativeToDirectory, withAnchor });
    } catch (error) {
      console.error(error);
    }
  });
  return null;
}
