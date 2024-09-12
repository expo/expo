'use dom';

import { useState } from 'react';

export default function Page({
  index,
  setIndexAsync,
  showAlert,
  throwError,
  getNativeSettings,
}: {
  index: number;
  setIndexAsync: (index: number) => Promise<void>;
  showAlert: (time: number) => void;
  throwError: () => never;
  getNativeSettings: () => Promise<string>;
  dom?: import('expo/dom').DOMProps;
}) {
  const [nativeSetting, setNativeSetting] = useState<string | null>(null);

  return (
    <div className="bg-slate-100 rounded-xl flex flex-1 flex-col gap-8">
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={() => {
          setIndexAsync(index + 1);
        }}>
        Index: {index}
      </p>
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={() => {
          showAlert(Date.now());
        }}>
        Show alert
      </p>
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={async () => {
          setNativeSetting(await getNativeSettings());
          console.log('return value:', await getNativeSettings());
        }}>
        Read native value: "{nativeSetting}"
      </p>
      <p
        className="text-lg text-blue-900 font-medium"
        onClick={async () => {
          throwError();
        }}>
        Throw error from native
      </p>
    </div>
  );
}
