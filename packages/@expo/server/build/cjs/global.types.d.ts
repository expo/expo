declare global {
    interface RequestInit {
        duplex?: 'half';
    }
    interface Request {
        duplex?: 'half';
    }
    interface Response {
        cf?: unknown;
        webSocket?: unknown;
    }
}
export {};
