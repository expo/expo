import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeEventEmitter } from 'react-native';

export default function DevLoadingView() {
  const show = useFastRefresh();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useMemo(
    () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={24}
        height={24}
        stroke="#ffffff00">
        <path
          fill="#ecedee"
          d="M36.764 1.716a1.477 1.477 0 0 0-2.325-.268L11.721 24.609c-1.464 1.493-.438 4.064 1.623 4.064h4.484a1 1 0 0 1 .889 1.46l-7.54 14.591a1.588 1.588 0 0 0 .059 1.56 1.477 1.477 0 0 0 2.325.268l22.718-23.161c1.464-1.493.438-4.064-1.623-4.064H28.53l8.295-16.051a1.588 1.588 0 0 0-.06-1.56Z"
        />
      </svg>
    ),
    []
  );

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    timer.current && clearTimeout(timer.current);

    if (show) {
      setAnimationClass('');
    } else {
      setIsAnimating(true);
      setAnimationClass('__expo_popupHide');
      timer.current = setTimeout(() => {
        setIsAnimating(false);
      }, 250);
    }
    return () => {
      timer.current && clearTimeout(timer.current);
    };
  }, [show]);

  if (!isAnimating && !show) {
    return null;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
.__expo_fast_refresh {  
  position: fixed;
  pointer-events: none;
  bottom: 8px;
  left: 8px;
  z-index: 9999;
  display: flex;
  background-color: #151718;
  border: 1px solid #313538;
  padding: 8px;
  border-radius: 8px;
  
  animation: __fastrefreshtoast 250ms forwards;
  
  opacity: 0; filter: blur(4px); transform: translateY(20%);
}

.__expo_popupHide { animation: __fastrefreshtoastDown 250ms forwards; }

@keyframes __fastrefreshtoast {
  0% { opacity: 0; filter: blur(4px); transform: translateY(20%); }
  100% { filter: blur(0); transform: scale(1); opacity: 1; }
}

@keyframes __fastrefreshtoastDown {
  0% { filter: blur(0); transform: scale(1); opacity: 1; }
  100% { opacity: 0; filter: blur(4px); transform: translateY(20%); }
}`,
        }}
      />

      <div className={'__expo_fast_refresh ' + animationClass}>{toast}</div>
    </>
  );
}

const emitter = new NativeEventEmitter({
  addListener() {},
  removeListeners() {},
});

function useFastRefresh() {
  const [isAnimating, setIsAnimating] = useState(false);
  const duration = useRef<number | null>(null);

  useEffect(() => {
    if (!emitter) return;
    function handleShowMessage() {
      setIsAnimating(true);
      duration.current = Date.now();
    }
    function handleHide() {
      const min = Math.max(0, 400 - ((duration.current ?? 0) - Date.now()));
      setTimeout(() => {
        setIsAnimating(false);
      }, min);
    }
    const show = emitter.addListener('devLoadingView:showMessage', handleShowMessage);
    const hide = emitter.addListener('devLoadingView:hide', handleHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, [emitter]);

  return isAnimating;
}
