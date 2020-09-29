import * as React from 'react';

const getAnalyticsScript = (id: string) => {
  return `
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', '${id}', {cookieDomain: 'auto', siteSpeedSampleRate: 100});
ga('send', 'pageview');
`.replace(/\n/g, '');
};

export const GoogleScript: React.FC<{ id: string }> = props => {
  const markup = { __html: getAnalyticsScript(props.id) };
  return <script dangerouslySetInnerHTML={markup} />;
};
