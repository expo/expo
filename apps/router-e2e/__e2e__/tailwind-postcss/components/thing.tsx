'use webview';

import '../global.css';

import { useBridge } from 'expo/webview';

export default function Page() {
  console.log('WEB.start');
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
