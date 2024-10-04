import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeEventEmitter } from 'react-native';

const MIN_DURATION = 400;
const ANIMATION_DURATION = 150;

const emitter = new NativeEventEmitter({
  addListener() {},
  removeListeners() {},
});

export default function DevLoadingView() {
  const show = useFastRefresh();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useMemo(
    () => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={24} height={24}>
        <path
          fill="#ECEDEE"
          d="M36.764 1.716a1.477 1.477 0 0 0-2.325-.268L11.721 24.609c-1.464 1.493-.438 4.064 1.623 4.064h4.484a1 1 0 0 1 .889 1.46l-7.54 14.591a1.588 1.588 0 0 0 .059 1.56 1.477 1.477 0 0 0 2.325.268l22.718-23.161c1.464-1.493.438-4.064-1.623-4.064H28.53l8.295-16.051a1.588 1.588 0 0 0-.06-1.56Z"
        />
      </svg>
    ),
    []
  );
  const style = useMemo(
    () => (
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
  background-color: #1B1D1E;
  border: 1px solid #4D5155;
  padding: 8px;
  border-radius: 8px;
  transition: all ${ANIMATION_DURATION}ms;
  opacity: 0; 
  filter: blur(4px); 
  transform: translateY(20%);
}

.__expo_fast_refresh_show { opacity: 1; filter: blur(0); transform: scale(1); }
`,
        }}
      />
    ),
    []
  );

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const refreshIndicator = useMemo(
    () => (
      <>
        {style}

        <div className={'__expo_fast_refresh ' + animationClass}>{toast}</div>
      </>
    ),
    [animationClass, style, toast]
  );

  useEffect(() => {
    timer.current && clearTimeout(timer.current);

    if (show) {
      setAnimationClass('__expo_fast_refresh_show');
    } else {
      setIsAnimating(true);
      setAnimationClass('');
      timer.current = setTimeout(() => {
        setIsAnimating(false);
      }, MIN_DURATION - ANIMATION_DURATION);
    }
    return () => {
      timer.current && clearTimeout(timer.current);
    };
  }, [show]);

  if (!isAnimating && !show) {
    return null;
  }

  return <>{refreshIndicator}</>;
}

function useFastRefresh() {
  const [isShown, setShown] = useState(false);
  const duration = useRef<number | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleShowMessage() {
      setShown(true);
      duration.current = Date.now();
    }

    function handleHide() {
      // Bail out if the timeout is already set
      if (timeout.current) {
        return;
      }

      const timeVisible = duration.current ? Date.now() - duration.current : 0;

      const min = Math.max(0, MIN_DURATION - timeVisible);

      timeout.current = setTimeout(() => {
        timeout.current = null;
        setShown(false);
      }, min);
    }
    const show = emitter.addListener('devLoadingView:showMessage', handleShowMessage);
    const hide = emitter.addListener('devLoadingView:hide', handleHide);
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      show.remove();
      hide.remove();
    };
  }, [emitter]);

  return isShown;
}
