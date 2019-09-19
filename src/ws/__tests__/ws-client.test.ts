import * as ws from 'ws';
import * as fs from 'fs';
import * as path from 'path';
import { WsClient } from '../WsClient';
import * as dotenv from 'dotenv';
import { mmDelay } from 'mm-ts-utils';
dotenv.config();

const WSS_PORT = parseInt(process.env.MM_TS_TESTING_WSS_PORT, 10);
const WS_URL = `ws://localhost:${WSS_PORT}`;

let ss: ws.Server;

// async closer helper... hm...
let _closeWssIfTimer = 0;
const closeWssIf = (_wss: ws.Server, condition: () => boolean, done) => {
    if (!_wss) {
        done();
    } else if (condition()) {
        _wss.close(() => {
            _wss = void 0;
            done();
        });
    } else {
        _closeWssIfTimer && clearTimeout(_closeWssIfTimer);
        _closeWssIfTimer = setTimeout(() => closeWssIf(_wss, condition, done), 10) as any;
    }
};

let _doneIfTimer = 0;
const doneIf = (condition: () => boolean, done) => {
    if (condition()) {
        done();
    } else {
        _doneIfTimer && clearTimeout(_doneIfTimer);
        _doneIfTimer = setTimeout(() => doneIf(condition, done), 10) as any;
    }
};

// because of how jest handles settimeouts... I'm using filesystem to temporarily
// save values
const _file = path.resolve(__dirname, './tmp/output.txt');
const fileWrite = (data) => fs.writeFileSync(_file, data);
const fileRead = () => (fs.existsSync(_file) ? fs.readFileSync(_file).toString() : null);
const fileDelete = () => fs.existsSync(_file) && fs.unlinkSync(_file);

beforeEach(async (done) => {
    fileDelete();
    ss ? ss.close(done) : done();
});

afterEach(async (done) => {
    ss ? ss.close(done) : done();
});

test('multiple same event handlers on one client', async (done) => {
    let counter = 0;

    ss = new ws.Server({ port: WSS_PORT }, () => {
        const wsc = new WsClient(WS_URL);
        wsc.onOpen((e) => {
            // wsc.on(WsClient.EVENT_OPEN, (e) => {
            expect(ss.clients.size).toEqual(1);
            counter++;
            // ss.close(done);
        });
        wsc.onOpen((e) => counter++);
        wsc.onOpen((e) => counter++);
    });

    closeWssIf(ss, () => counter === 3, done);
});

test('server to client message works', async (done) => {
    let msg = '';

    ss = new ws.Server({ port: WSS_PORT }, () => {
        const wsc = new WsClient(WS_URL);

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

    closeWssIf(ss, () => msg === 'abc', done);
});

test('client to server message works', async (done) => {
    ss = new ws.Server({ port: WSS_PORT }, () => {
        const wsc = new WsClient(WS_URL, { debug: false });
        wsc.send('heyho');
        ss.on('connection', (client) => client.on('message', fileWrite));
    });
    closeWssIf(ss, () => fileRead() === 'heyho', done);
});

test('onclose + onerror is emitted on unsuccessfull init', async (done) => {
    let close = 0;
    let error = 0;

    // let's test logger features here as well
    let log = {};
    const logger = (...args) => {
        // console.log(...args);
        log[args[1]] = args;
    };

    // tu server nebezi...
    const wsc = new WsClient(WS_URL, { debug: true, logger });
    wsc.onClose((e) => close++); // wsc.on(WsClient.EVENT_CLOSE, (e) => close++);
    wsc.onError((e) => error++); // wsc.on(WsClient.EVENT_ERROR, (e) => error++);

    //
    doneIf(() => {
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

test('true reconnect works', (done) => {
    let wsc: WsClient;

    let counter = 0;
    let closeCounter = 0;
    let openCounter = 0;

    const delay = 50;

    let log = [];
    const logger = (...args) => log.push(args[0]);

    ss = new ws.Server({ port: WSS_PORT }, () => {
        // server's client message handling
        ss.on('connection', (client) => {
            client.on('message', (data) => {
                expect(data).toEqual('1');
                ss.close(afterClose);
            });
        });

        // 'frontend' client...
        wsc = new WsClient(WS_URL, { debug: true, delay, logger });

        wsc.onOpen(() => openCounter++);
        wsc.onClose(() => closeCounter++);

        wsc.send(`${++counter}`);
    });

    const afterClose = async (err) => {
        await mmDelay(5); // bulharske pozorovanie...
        expect(wsc.connection.readyState).toEqual(WsClient.READYSTATE_CLOSED);
        expect(closeCounter).toEqual(1);
        expect(openCounter).toEqual(1);

        // restart ws server
        ss = new ws.Server({ port: WSS_PORT }, () => {
            ss.on('connection', (client) => {
                (async () => {
                    await mmDelay(2 * delay);
                    expect(closeCounter).toEqual(1); // no change here...
                    expect(openCounter).toEqual(2); // IMPORTANT!
                    expect(wsc.connection.readyState).toEqual(WsClient.READYSTATE_OPEN); // IMPORTANT!
                    ss.close(async () => {
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

test('client `onReady` works', async (done) => {
    let counter = 0;

    const wsc = new WsClient(WS_URL);
    wsc.onReady((e) => counter++);

    ss = new ws.Server({ port: WSS_PORT }, () => {
        wsc.onReady((e) => counter++);
    });

    closeWssIf(ss, () => counter === 2, done);
});

// update: not automatically generating anymore...
// test.skip('client `cid` is generated automatically', async (done) => {
//     const wsc = new WsClient(WS_URL, { debug: false });
//     const wsc2 = new WsClient(WS_URL, { debug: false });
//     expect(wsc.cid).toBeTruthy();
//     expect(wsc2.cid).toBeTruthy();
//     expect(wsc.cid === wsc2.cid).toBeFalsy();
//     done();
// });
