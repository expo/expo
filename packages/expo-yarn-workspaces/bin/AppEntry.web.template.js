import React from 'react';
import ReactDOM from 'react-dom';
import App from '{{relativeProjectPath}}/App';
import registerServiceWorker from '{{relativeProjectPath}}/registerServiceWorker';
ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
