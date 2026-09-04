// Shapes of the SSAP responses this adapter reads. The TV sends far more than
// is modelled here — only the fields actually consumed are declared, everything
// else stays untyped on purpose so a firmware change cannot break the build.

/** Fields present on almost every SSAP answer */
export interface SsapResponse {
    returnValue?: boolean;
}

/** `ssap://audio/getVolume` — webOS <= 4 reports flat fields, webOS >= 5 nests them in `volumeStatus` */
export interface VolumeResponse extends SsapResponse {
    changed?: string[];
    volume?: number | string;
    muted?: boolean;
    volumeStatus?: {
        volume?: number | string;
        muteStatus?: boolean;
        soundOutput?: string;
    };
}

/** One entry of `ssap://tv/getExternalInputList` */
export interface ExternalInput {
    id: string;
    label: string;
}

export interface ExternalInputListResponse extends SsapResponse {
    devices?: ExternalInput[];
}

/** One entry of `ssap://com.webos.applicationManager/listLaunchPoints` */
export interface LaunchPoint {
    id: string;
    title: string;
}

export interface LaunchPointsResponse extends SsapResponse {
    launchPoints?: LaunchPoint[];
}

/** `ssap://tv/getCurrentChannel` */
export interface CurrentChannelResponse extends SsapResponse {
    channelNumber?: string | number;
    channelId?: string;
}

/** `ssap://com.webos.applicationManager/getForegroundAppInfo` */
export interface ForegroundAppResponse extends SsapResponse {
    appId?: string;
}

/** `ssap://com.webos.service.apiadapter/audio/getSoundOutput` */
export interface SoundOutputResponse extends SsapResponse {
    soundOutput?: string;
}

/** `ssap://settings/getSystemSettings` */
export interface SystemSettingsResponse extends SsapResponse {
    settings?: Record<string, unknown>;
}

/** `ssap://com.webos.service.update/getCurrentSWInformation` */
export interface SwInformationResponse extends SsapResponse {
    /** the TV reports its MAC address here */
    device_id?: string;
}

/** `ssap://system/getSystemInfo` */
export interface SystemInfoResponse extends SsapResponse {
    modelName?: string;
}

/** `ssap://system.notifications/createAlert` */
export interface CreateAlertResponse extends SsapResponse {
    alertId?: string;
}

/** Payload of the `states.raw` state: a free-form SSAP call */
export interface RawCommand {
    url: string;
    cmd?: Record<string, unknown> | null;
}

/** Callback used by every command helper in this adapter */
export type CommandCallback<T = SsapResponse> = (error: Error | null | undefined, result?: T) => void;

/** Payload accepted by the command helpers */
export type CommandPayload = Record<string, unknown> | null;
