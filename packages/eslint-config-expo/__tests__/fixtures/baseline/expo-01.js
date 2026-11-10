'use dom';

export const notAllowed = 'only the default export may leave a DOM component';

export default function DomComponent() {
  return <div>Hello</div>;
}
