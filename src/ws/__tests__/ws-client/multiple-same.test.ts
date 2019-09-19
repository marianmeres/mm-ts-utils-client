import * as ws from 'ws';
import { WsClient } from '../../WsClient';
import * as dotenv from 'dotenv';
dotenv.config();
import { createCloseWssIf, createDoneIf, wssPort, wsUrl } from './_utils';

test('multiple same event handlers on one client', async (done) => {
    let counter = 0;
    let port = wssPort();

    const ss = new ws.Server({ port }, () => {
        const wsc = new WsClient(wsUrl(port));
        wsc.onOpen((e) => {
            // wsc.on(WsClient.EVENT_OPEN, (e) => {
            expect(ss.clients.size).toEqual(1);
            counter++;
            // ss.close(done);
        });
        wsc.onOpen((e) => counter++);
        wsc.onOpen((e) => counter++);
    });

    createCloseWssIf()(ss, () => counter === 3, done);
});
