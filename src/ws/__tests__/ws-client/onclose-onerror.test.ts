import { WsClient } from '../../WsClient';
import * as dotenv from 'dotenv';
dotenv.config();
import { createDoneIf, wssPort, wsUrl } from './_utils';

test('onclose + onerror is emitted on unsuccessfull init', async (done) => {
    let close = 0;
    let error = 0;

    // let's test logger features here as well
    let log = {};
    const logger = (...args) => {
        // console.log(...args);
        log[args[1]] = args;
    };

    let port = wssPort();

    // tu server nebezi...
    const wsc = new WsClient(wsUrl(port), { debug: true, logger });
    wsc.onClose((e) => close++); // wsc.on(WsClient.EVENT_CLOSE, (e) => close++);
    wsc.onError((e) => error++); // wsc.on(WsClient.EVENT_ERROR, (e) => error++);

    //
    createDoneIf()(() => {
        if (close === 1 && error === 1) {
            // testujeme bazalne logger
            if (!Object.keys(log).length) {
                throw new Error('Expecting not empty log');
            }

            let willReconnectFlag = false;
            for (let k in log) {
                if (/reconnect/i.test(log[k].join())) {
                    willReconnectFlag = true;
                }
            }
            if (!willReconnectFlag) {
                throw new Error('Expecting reconnect info in log');
            }

            return true;
        }
        return false;
    }, done);
});
