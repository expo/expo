import { Diagram } from './Diagram';

type Props = {
  source: string;
  alt: string;
  darkSource?: string;
};

export const ComponentDiagram = ({ source, darkSource, alt }: Props) => (
  <div className="mx-auto w-fit [&_img]:max-h-[360px] [&_img]:w-auto [&_img]:max-w-full">
    <Diagram source={source} darkSource={darkSource} alt={alt} disableSrcSet />
  </div>
);
