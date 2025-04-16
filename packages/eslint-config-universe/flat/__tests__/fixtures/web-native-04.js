import { useEffect } from 'react';

export default function Example(props) {
  const { dependentVariable } = props;
  useEffect(() => {
    console.log(dependentVariable);
  }, []);

  if (props.badConditionalHook) {
    useEffect(() => {});
  }
}

function notAHook() {
  useEffect(() => {});
}
