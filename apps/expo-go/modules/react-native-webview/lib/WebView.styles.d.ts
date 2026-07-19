declare const styles: {
    container: {
        flex: number;
        overflow: "hidden";
    };
    loadingOrErrorView: {
        position: "absolute";
        flex: number;
        justifyContent: "center";
        alignItems: "center";
        height: "100%";
        width: "100%";
        backgroundColor: string;
    };
    loadingProgressBar: {
        height: number;
    };
    errorText: {
        fontSize: number;
        textAlign: "center";
        marginBottom: number;
    };
    errorTextTitle: {
        fontSize: number;
        fontWeight: "500";
        marginBottom: number;
    };
    webView: {
        backgroundColor: string;
    };
    flexStart: {
        alignSelf: "flex-start";
    };
    colorRed: {
        color: string;
    };
};
export default styles;
