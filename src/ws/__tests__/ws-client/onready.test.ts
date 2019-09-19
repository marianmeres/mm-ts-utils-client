import { WsClient } from '../../WsClient';
import * as ws from 'ws';
import * as dotenv from 'dotenv';
dotenv.config();
import { createCloseWssIf, wssPort, wsUrl } from './_utils';

test('client `onReady` works', async (done) => {
    // assertNoSs();
    let counter = 0;
    let port = wssPort();

    const wsc = new WsClient(wsUrl(port));
    wsc.onReady((e) => counter++);

    const ss = new ws.Server({ port }, () => {
        wsc.onReady((e) => counter++);
    });

    createCloseWssIf()(ss, () => counter === 2, done);
});
