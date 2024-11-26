import ServerActionTest from '../components/dom-two';

export default function ServerActionNestedDomTest() {
  return (
    <ServerActionTest
      dom={{
        pullToRefreshEnabled: true,
      }}
    />
  );
}
