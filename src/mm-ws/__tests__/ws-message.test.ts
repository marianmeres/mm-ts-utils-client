import { WsMessage } from '../WsMessage';

test('`WsMessage.factory` default', () => {
    const m = WsMessage.factory('hoho');
    let json = m.toJSON();
    delete json.id;
    expect(json).toEqual({
        payload: 'hoho',
        type: null,
        room: '',
    });
});

test('`WsMessage.factory` join room', () => {
    const m = WsMessage.factory(
        JSON.stringify({
            payload: 'hoho',
            type: WsMessage.TYPE_JOIN_ROOM,
            room: 'chat',
        })
    );
    let json = m.toJSON();
    delete json.id;
    expect(json).toEqual({
        payload: 'hoho',
        type: WsMessage.TYPE_JOIN_ROOM,
        room: 'chat',
    });
});

test('`WsMessage.factory` leave room', () => {
    const m = WsMessage.factory(
        JSON.stringify({
            payload: 'hoho',
            type: WsMessage.TYPE_LEAVE_ROOM,
            room: 'chat',
        })
    );
    let json = m.toJSON();
    delete json.id;
    expect(json).toEqual({
        payload: 'hoho',
        type: WsMessage.TYPE_LEAVE_ROOM,
        room: 'chat',
    });
});

test('`WsMessage.factory` broadcast', () => {
    const m = WsMessage.factory(
        JSON.stringify({
            payload: 'hoho',
            type: WsMessage.TYPE_BROADCAST,
            room: 'chat/foo/bar',
        })
    );
    let json = m.toJSON();
    delete json.id;
    expect(json).toEqual({
        payload: 'hoho',
        type: WsMessage.TYPE_BROADCAST,
        room: 'chat/foo/bar',
    });
});

test('`WsMessage.factory` unknown object', () => {
    let serialized = JSON.stringify({
        some: 'unknown',
        obj: 'ect',
    });
    const m = WsMessage.factory(serialized);
    let json = m.toJSON();
    delete json.id;
    expect(json).toEqual({
        payload: serialized,
        type: null,
        room: '',
    });
});

test('factory from object works', () => {
    const data = {
        payload: 'foo',
        room: '123',
        id: '456',
        type: 'bar',
    };
    const m = WsMessage.factory(data);

    expect(m.toJSON()).toEqual(data);
});

test('factory from unknown object works', () => {
    const data: any = {
        foo: 'bar',
    };
    const m = WsMessage.factory(data);

    // custom format treba posielat uz ako string...
    expect(m.toJSON().payload).toEqual('[object Object]');
});
