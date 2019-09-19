import * as ws from 'ws';
export declare const wssPort: () => number;
export declare const wsUrl: (port: any) => string;
export declare const createCloseWssIf: () => (_wss: ws.Server, condition: () => boolean, done: any) => void;
export declare const createDoneIf: () => (condition: () => boolean, done: any) => void;
