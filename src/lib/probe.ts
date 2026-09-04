import { Socket } from 'node:net';

/**
 * Best-effort TCP reachability probe.
 *
 * Resolves `true` if a TCP connection to `host:port` can be established
 * within `timeoutMs`, `false` on any error or timeout. Never rejects —
 * callers can treat a `false` result as "unreachable".
 *
 * @param host hostname or IP address; empty string resolves false immediately
 * @param port TCP port to connect to
 * @param timeoutMs maximum time to wait for the TCP handshake before resolving false
 * @returns true when the handshake completed, false on timeout or error
 */
export function probeTcpReachable(host: string, port: number, timeoutMs: number): Promise<boolean> {
    return new Promise<boolean>(resolve => {
        if (!host) {
            resolve(false);
            return;
        }
        const socket = new Socket();
        let settled = false;
        const finish = (result: boolean): void => {
            if (settled) {
                return;
            }
            settled = true;
            try {
                socket.destroy();
            } catch {
                /* ignore */
            }
            resolve(result);
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        try {
            socket.connect(port, host);
        } catch {
            finish(false);
        }
    });
}
