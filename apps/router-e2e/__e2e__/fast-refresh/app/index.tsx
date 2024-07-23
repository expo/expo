import React from 'react';

export default function Page() {
  const [index, setIndex] = React.useState(0);
  // Do not change this value, it is used in tests
  const input = 'ROUTE_VALUE';

  return (
    <>
      <button data-testid="index-increment" onClick={() => setIndex((i) => i + 1)}>
        increment
      </button>
      <div data-testid="index-count">{index}</div>
      <div data-testid="index-text">{input}</div>
    </>
  );
}
