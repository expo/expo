import { Diagram } from './Diagram';

type Props = {
  source: string;
  alt: string;
  darkSource?: string;
};

export const ComponentDiagram = ({ source, darkSource, alt }: Props) => (
  <div className="mx-auto w-fit [&_img]:h-[360px] [&_img]:max-w-full [&_img]:object-contain">
    <Diagram source={source} darkSource={darkSource} alt={alt} disableSrcSet />
  </div>
);
