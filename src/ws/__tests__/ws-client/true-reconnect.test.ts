import { WsClient } from '../../WsClient';
import * as ws from 'ws';
import { mmDelay, mmGetRandomInt } from 'mm-ts-utils';
import * as dotenv from 'dotenv';
import { wssPort, wsUrl } from './_utils';
dotenv.config();

test('true reconnect works', async (done) => {
    // assertNoSs();
    let wsc: WsClient;
    let port = wssPort();

    let counter = 0;
    let closeCounter = 0;
    let openCounter = 0;

    const delay = 50;

    let log = [];
    const logger = (...args) => log.push(args[0]);

    const ss = new ws.Server({ port }, () => {
        // server's client message handling
        ss.on('connection', (client) => { // client: WebSocket, socket: WebSocket, request: http.IncomingMessage
            client.on('message', (data) => {
                expect(data).toEqual('1');
                ss.close(afterClose);
            });
        });

        // 'frontend' client...
        wsc = new WsClient(wsUrl(port), { debug: true, delay, logger });

        wsc.onOpen(() => openCounter++);
        wsc.onClose(() => closeCounter++);

        wsc.send(`${++counter}`);
    });

    const afterClose = async (err) => {
        if (err) {
            throw err;
        }
        await mmDelay(5); // bulharske pozorovanie...
        expect(wsc.connection.readyState).toEqual(WsClient.READYSTATE_CLOSED);
        expect(closeCounter).toEqual(1);
        expect(openCounter).toEqual(1);

        // restart ws server
        const ss2 = new ws.Server({ port }, () => {
            ss2.on('connection', (client) => {
                (async () => {
                    await mmDelay(2 * delay);
                    expect(closeCounter).toEqual(1); // no change here...
                    expect(openCounter).toEqual(2); // IMPORTANT!
                    expect(wsc.connection.readyState).toEqual(WsClient.READYSTATE_OPEN); // IMPORTANT!
                    ss2.close(async () => {
                        await mmDelay(5);
                        expect(wsc.connection.readyState).toEqual(
                            WsClient.READYSTATE_CLOSED
                        );
                        expect(closeCounter).toEqual(2);
                        expect(openCounter).toEqual(2);
                        assertLogIsOK();
                        done();
                    });
                })();
            });
        });
    };

    const assertLogIsOK = () => {
        const countLogRecord = (name) =>
            log.reduce((memo, logged) => {
                logged === name && memo++;
                return memo;
            }, 0);

        // console.log(log);
        expect(countLogRecord(WsClient.EVENT_OPEN)).toEqual(2);
        expect(countLogRecord(WsClient.EVENT_CLOSE)).toEqual(2);
        expect(countLogRecord(WsClient.EVENT_RECONNECT_OPEN)).toEqual(1);
        expect(countLogRecord(WsClient.EVENT_SEND)).toEqual(2);
    };
});