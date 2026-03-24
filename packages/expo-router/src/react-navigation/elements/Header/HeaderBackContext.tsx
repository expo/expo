import { getNamedContext } from '../getNamedContext';

export const HeaderBackContext = getNamedContext<
  { title: string | undefined; href: string | undefined } | undefined
>('HeaderBackContext', undefined);
