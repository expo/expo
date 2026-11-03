import React from 'react';

export function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
}

export function Children() {
  return <div children="text" />;
}

export function Quote() {
  return <p>It's quoted</p>;
}

export class Form extends React.Component {
  render() {
    return <input ref="field" />;
  }
}
