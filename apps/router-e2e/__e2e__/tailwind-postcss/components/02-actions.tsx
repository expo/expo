'use webview';

import { useState } from 'react';
import '../global.css';

// TODO: Magically make this a prop of the component in the root HTML.
// const actions = _getActionsObject();

export default function Page({
  actions,
}: {
  actions: {
    showAlert: (time: number) => void;
    throwError: () => never;
    getNativeSettings: () => Promise<string>;
  };
}) {
  const [nativeSetting, setNativeSetting] = useState<string | null>(null);

  return (
    <div className="bg-slate-100 rounded-xl flex flex-1 flex-col gap-8">
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={() => {
          actions.showAlert(Date.now());
        }}>
        Show alert
      </p>
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={async () => {
          setNativeSetting(await actions.getNativeSettings());
          console.log('return value:', await actions.getNativeSettings());
        }}>
        Read native value: "{nativeSetting}"
      </p>
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={async () => {
          actions.throwError();
        }}>
        Throw error from native
      </p>
    </div>
  );
}
