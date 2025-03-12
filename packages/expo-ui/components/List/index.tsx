import { requireNativeView } from 'expo';

const ListNativeView = requireNativeView('ExpoUI', 'ListView');

type ListProps = {
  children: React.ReactNode;
};
export function List(props: ListProps) {
  const { children, ...restProps } = props;
  return <ListNativeView {...restProps}>{children}</ListNativeView>;
}
