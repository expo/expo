declare global {
    interface RequestInit {
        duplex?: 'half';
    }
    interface Request {
        duplex?: 'half';
    }
}
export {};
