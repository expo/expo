import { mergeClasses } from '@expo/styleguide';
import { useState } from 'react';
import ConfettiExplosionComponent from 'react-confetti-explosion';

const CONFETTI_DURATION = 2250;

export function ConfettiPopper() {
  const [confettiPressed, setConfettiPressed] = useState(false);
  const [confettiShown, setConfettiShown] = useState(false);

  function onEasterEggClick() {
    if (!confettiShown) {
      setConfettiShown(true);
      setTimeout(() => {
        setConfettiShown(false);
      }, CONFETTI_DURATION);
    }
  }
  return (
    <>
      <div
        onClick={onEasterEggClick}
        onMouseDown={() => {
          if (!confettiShown) {
            setConfettiPressed(true);
          }
        }}
        onMouseUp={() => {
          setConfettiPressed(false);
        }}
        onTouchStart={() => {
          if (!confettiShown) {
            setConfettiPressed(true);
          }
        }}
        onTouchEnd={() => {
          setConfettiPressed(false);
        }}
        className={mergeClasses(
          'inline-flex cursor-help transition duration-150',
          confettiPressed && 'scale-90'
        )}>
        🎉
      </div>
      {confettiShown && (
        <div className="absolute top-1/2 left-1/2">
          <ConfettiExplosionComponent
            zIndex={10}
            duration={CONFETTI_DURATION}
            colors={['#006CFF', '#D22323', '#F3AD0D']}
          />
        </div>
      )}
    </>
  );
}
