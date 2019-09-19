import * as ws from 'ws';
import { WsClient } from '../../WsClient';
import * as dotenv from 'dotenv';
dotenv.config();
import { createCloseWssIf, createDoneIf, wssPort, wsUrl } from './_utils';


test('server to client message works', async (done) => {
    let msg = '';
    let port = wssPort();

    const ss = new ws.Server({ port }, () => {
        const wsc = new WsClient(wsUrl(port));

        wsc.onOpen(() => {
            ['a', 'b', 'c'].forEach((text) => {
                ss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(text);
                    }
                });
            });
        });

        wsc.onMessage((data) => (msg += data));
    });

    createCloseWssIf()(ss, () => msg === 'abc', done);
});