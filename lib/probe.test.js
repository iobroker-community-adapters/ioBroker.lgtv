'use strict';

const { expect } = require('chai');
const net = require('node:net');
const { probeTcpReachable } = require('./probe');

function startListener() {
    return new Promise((resolve, reject) => {
        const server = net.createServer(socket => socket.end());
        server.unref();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

describe('lib/probe — probeTcpReachable', () => {
    it('resolves true when the port accepts the connection', async () => {
        const server = await startListener();
        try {
            const port = server.address().port;
            const reachable = await probeTcpReachable('127.0.0.1', port, 1000);
            expect(reachable).to.equal(true);
        } finally {
            server.close();
        }
    });

    it('resolves false when nothing listens on the port', async () => {
        // Pick an ephemeral port we know is free by opening + closing a server.
        const tmp = await startListener();
        const port = tmp.address().port;
        await new Promise(r => tmp.close(r));
        const reachable = await probeTcpReachable('127.0.0.1', port, 1000);
        expect(reachable).to.equal(false);
    });

    it('resolves false within the timeout when the host swallows the SYN', async () => {
        // 192.0.2.0/24 is TEST-NET-1 (RFC 5737) — guaranteed unroutable.
        const start = Date.now();
        const reachable = await probeTcpReachable('192.0.2.1', 3001, 300);
        const elapsed = Date.now() - start;
        expect(reachable).to.equal(false);
        expect(elapsed).to.be.lessThan(1500);
    });

    it('resolves false for an empty host without touching the network', async () => {
        const reachable = await probeTcpReachable('', 3001, 1000);
        expect(reachable).to.equal(false);
    });
});
