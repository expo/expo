import '@/global.css';

import { getDOMComponents, MDXComponents } from '@bacons/mdx';

export default function BlogWrapper({ children }) {
  const { img: Img, ...components } = getDOMComponents();
  return (
    <div style={{ display: 'block', overflow: 'scroll' }} className="container pt-8">
      <MDXComponents
        components={{
          ...components,
          h1: ({ parentName, ...props }) => <h1 className="text-3xl font-bold" {...props} />,
          h2: ({ parentName, ...props }) => <h2 className="text-2xl font-bold" {...props} />,
          ol: ({ parentName, ...props }) => <ol className="list-decimal list-inside" {...props} />,
          ul: ({ parentName, ...props }) => <ul className="list-disc list-inside" {...props} />,
          hr: ({ parentName, ...props }) => (
            <hr className="border-t border-gray-200 my-8" {...props} />
          ),
          li: ({ parentName, ...props }) => <li className="my-2" {...props} />,
          a: ({ parentName, ...props }) => (
            <a className="text-blue-500 hover:underline" {...props} />
          ),
          blockquote: (props) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 py-2 my-4" {...props} />
          ),
          img: (props) => <Img {...props} className="my-4 rounded-lg p-2" />,
        }}>
        {children}
      </MDXComponents>
    </div>
  );
}
