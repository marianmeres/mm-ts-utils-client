import * as ws from 'ws';
import * as dotenv from 'dotenv';
dotenv.config();

export const wssPort = () => parseInt(process.env.MM_TS_TESTING_WSS_PORT, 10);
export const wsUrl = (port) => `ws://localhost:${port}`;

export const createCloseWssIf = () => {
    let _closeWssIfTimer = 0;

    const closeWssIf = (_wss: ws.Server, condition: () => boolean, done) => {
        if (!_wss) {
            done();
        } else if (condition()) {
            _wss.close(async (err) => {
                _wss = void 0;
                done();
            });
        } else {
            _closeWssIfTimer && clearTimeout(_closeWssIfTimer);
            _closeWssIfTimer = setTimeout(() => closeWssIf(_wss, condition, done), 10) as any;
        }
    };

    return closeWssIf;
};

export const createDoneIf = () => {
    let _doneIfTimer = 0;

    const doneIf = (condition: () => boolean, done) => {
        if (condition()) {
            done();
        } else {
            _doneIfTimer && clearTimeout(_doneIfTimer);
            _doneIfTimer = setTimeout(() => doneIf(condition, done), 10) as any;
        }
    };

    return doneIf;
};

test('fake', () => void 0);