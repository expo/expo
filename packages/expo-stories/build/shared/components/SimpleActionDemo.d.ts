declare type SimpleActionDemoProps = {
    title: string;
    action: (setValue: (value: any) => any) => any;
};
export default function SimpleActionDemo(props: SimpleActionDemoProps): JSX.Element;
export {};
