import ReactMarkdown from 'react-markdown';
import { Collapsible } from '~/ui/components/Collapsible';
import { mdComponents } from './plugins/api/APISectionUtils';

const PrereleaseNotice = () => {
  return (
    <Collapsible summary={`What is a (Next) package?`}>
      <ReactMarkdown components={mdComponents}>
        {`\`/next\` packages are pre-release versions of SDK libraries. We provide them to get feedback from the community and test new features before their stable release. If you encounter any issue, we encourage reporting on the [Expo](https://github.com/expo/expo/issues/new?assignees=&labels=needs+validation&projects=&template=bug_report.yml) GitHub repository.`}
      </ReactMarkdown>
    </Collapsible>
  );
};

export default PrereleaseNotice;
