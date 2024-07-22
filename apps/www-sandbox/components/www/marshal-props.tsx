'use dom';

export default function MyCounter({ index, ...props }: { index: number; onPress: () => void }) {
  console.log('Props', props);
  return (
    <>
      <h1>Counter {index}</h1>
      <button onClick={() => props.onPress()}>Increment from web -> native -> web</button>
    </>
  );
}
