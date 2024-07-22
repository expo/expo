'use dom';

import '../global.css';

import { useBridge, _getActionsObject } from 'expo/dom';

// TODO: Magically make this a prop of the component in the root HTML.
// const actions = _getActionsObject();

export default function Page({
  actions,
}: {
  actions: {
    showAlert: (time: number) => void;
  };
}) {
  console.log('WEB.start');
  const [emit] = useBridge((msg) => {
    console.log('WEB:', msg);
  });

  return (
    <div className="bg-slate-100 rounded-xl flex flex-1">
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={() => {
          actions.showAlert(Date.now());
          emit({ type: 'hello', data: 'world' });
        }}>
        Welcome to Tailwind
      </p>
    </div>
  );
}
