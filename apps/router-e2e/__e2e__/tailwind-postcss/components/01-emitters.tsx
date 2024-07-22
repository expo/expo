'use dom';

import '../global.css';

import { useBridge } from 'expo/dom';

export default function Page() {
  const [emit] = useBridge((msg) => {
    console.log('WEB:', msg);
  });

  return (
    <div className="bg-slate-100 rounded-xl flex flex-1">
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={() => {
          emit({ type: 'hello', data: 'world' });
        }}>
        Welcome to Tailwind
      </p>
    </div>
  );
}
