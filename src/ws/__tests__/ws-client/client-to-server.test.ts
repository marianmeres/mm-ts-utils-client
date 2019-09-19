import * as ws from 'ws';
import * as fs from 'fs';
import * as path from 'path';
import { WsClient } from '../../WsClient';
import * as dotenv from 'dotenv';
dotenv.config();
import { createCloseWssIf, createDoneIf, wssPort, wsUrl } from './_utils';

// because of how jest handles settimeouts... I'm using filesystem to temporarily
// save values
const _file = path.resolve(__dirname, '../tmp/output.txt');
const fileWrite = (data) => fs.writeFileSync(_file, data);
const fileRead = () => (fs.existsSync(_file) ? fs.readFileSync(_file).toString() : null);
const fileDelete = () => fs.existsSync(_file) && fs.unlinkSync(_file);

test('client to server message works', async (done) => {
    fileDelete();
    let port = wssPort();
    const ss = new ws.Server({ port }, () => {
        const wsc = new WsClient(wsUrl(port), { debug: false });
        wsc.send('heyho');
        ss.on('connection', (client) => client.on('message', fileWrite));
    });
    createCloseWssIf()(ss, () => fileRead() === 'heyho', done);
});