type Head = React.FC<{ children?: React.ReactNode }> & {
  Provider: React.FC<{ children?: React.ReactNode; context: any }>;
};

export default Head;
