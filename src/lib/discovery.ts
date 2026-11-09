import { Client as SsdpClient } from 'node-ssdp';

/** Search target of the second-screen service every webOS TV announces (the one the SSAP API belongs to) */
const SSDP_SEARCH_TARGET = 'urn:lge-com:service:webos-second-screen:1';

/** A TV found by `discover()` */
export interface DiscoveredTv {
    /** IP address of the TV, what goes into `native.ip` */
    ip: string;
    friendlyName: string;
    modelName: string;
    modelNumber: string;
    UDN: string;
}

/** Content of the first `<tag>` in `xml` (the description is flat enough for this) */
function xmlValue(xml: string, tag: string): string {
    const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml);
    return match ? match[1].trim() : '';
}

/**
 * Searches the network via SSDP for webOS TVs (used by the IP field of the settings).
 * A device that answers with an unusable description is skipped (debug log), it does not fail the search.
 */
export function discover(adapter: ioBroker.Adapter, timeout = 3000): Promise<DiscoveredTv[]> {
    return new Promise(resolve => {
        const ssdp = new SsdpClient();
        const discovered = new Map<string, DiscoveredTv>();
        const pending = new Set<string>();

        const skip = (address: string, reason: string): void =>
            adapter.log.debug(`Discovery: device ${address} skipped: ${reason}`);

        ssdp.on('response', (headers, statusCode, data) => {
            const location = String(headers.LOCATION || '');
            // a TV may answer several times (e.g. per network interface), read every description only once
            if (statusCode !== 200 || !location || pending.has(location)) {
                return;
            }
            pending.add(location);
            fetch(location, { signal: AbortSignal.timeout(timeout) })
                .then(async response => {
                    if (!response.ok) {
                        skip(data.address, `description answered with status ${response.status}`);
                        return;
                    }
                    const xml = await response.text();
                    const UDN = xmlValue(xml, 'UDN') || location;
                    discovered.set(UDN, {
                        ip: new URL(location).hostname || data.address,
                        friendlyName: xmlValue(xml, 'friendlyName'),
                        modelName: xmlValue(xml, 'modelName'),
                        modelNumber: xmlValue(xml, 'modelNumber'),
                        UDN,
                    });
                })
                .catch(e => skip(data.address, `cannot read the description: ${(e as Error).message}`));
        });

        adapter.setTimeout(() => {
            void ssdp.stop();
            resolve([...discovered.values()]);
        }, timeout);

        void ssdp.search(SSDP_SEARCH_TARGET);
    });
}
