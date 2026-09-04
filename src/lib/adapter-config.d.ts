// Augments the globally declared ioBroker types with everything this adapter adds.
// The attributes of `AdapterConfig` must be kept in sync with `native` in io-package.json
// and with admin/jsonConfig.json.

declare global {
    namespace ioBroker {
        interface AdapterConfig {
            /** IP address or hostname of the LG WebOS TV */
            ip: string;
            /** MAC address used for Wake-on-LAN; falls back to the address learned from the TV */
            mac: string;
            /** Request timeout in ms */
            timeout: number;
            /** Reconnect interval in ms, never less than 5000 */
            reconnect: number;
            /** Poll interval in ms; 0 disables the health poll */
            healthInterval: number;
            /** Switch the TV off with the remote POWER button instead of `ssap://system/turnOff` */
            power: boolean;
            /** Include the TV IP in the Wake-on-LAN packet to send it as unicast */
            wolwithip: boolean;
        }
    }
}

export {}; // required so that this file is treated as a module
