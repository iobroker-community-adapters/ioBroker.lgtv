/**
 * The styles of the shadow roots. The element fills the box of the host, has a transparent background and inherits
 * `color` and `font`; borders, the colors of the power key and of the status dot come from the theme of the host
 * (`--iob-divider`, `--iob-success`, `--iob-error`, ...), so it looks right in light and dark. Nothing is measured:
 * the layout is chosen by container queries on the box, the sizes follow it with `cqmin` and grid tracks.
 *
 * Three views, as the devices widget has them; all are in the DOM, only the one that fits is shown:
 * - `compact` (default): the header and six keys - power, volume up/down, home, OK, mute
 * - `strip` (at most 110 px high and 2.5 times as wide as high): the header and five keys in one row
 * - `full` (from 340 px high and 180 px wide): the whole remote, rows as the settings switch them on
 */

/** The parts every view uses: the header, the keys and their rows */
const PARTS = `
.remote {
    --gap: clamp(3px, 1.6cqmin, 6px);
    --pad: clamp(4px, 3cqmin, 10px);
    width: 100%;
    height: 100%;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}
.remote.edit {
    pointer-events: none;
}
.view {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: var(--pad);
    gap: var(--gap);
    overflow: hidden;
}
.head {
    display: flex;
    align-items: center;
    gap: var(--gap);
    min-width: 0;
}
.titles {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}
.name,
.status {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
}
.name {
    font-weight: 600;
    font-size: clamp(11px, 6cqmin, 15px);
}
.status {
    font-size: clamp(10px, 4.6cqmin, 13px);
    color: var(--iob-text-secondary);
    font-variant-numeric: tabular-nums;
}
.dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--iob-text-secondary);
}
.dot.on {
    background: var(--iob-success);
}
.dot.off {
    background: var(--iob-error);
}
.more {
    flex: none;
    width: 24px;
    height: 24px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.more:hover {
    background: color-mix(in srgb, currentColor 12%, transparent);
}
.more:focus-visible {
    outline: 2px solid var(--iob-primary);
    outline-offset: 1px;
}
.row,
.dpad,
.numpad,
.keys {
    display: grid;
    gap: var(--gap);
    min-width: 0;
    min-height: 0;
}
.row {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
}
.dpad {
    grid-row: span 3;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    height: 100%;
    aspect-ratio: 1;
    max-width: 100%;
    justify-self: center;
}
.numpad {
    grid-row: span 4;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
}
.key {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    margin: 0;
    padding: 0;
    /* the glyph follows the size of its key */
    container-type: size;
    display: flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    font-weight: 700;
    line-height: 1;
    color: inherit;
    background: color-mix(in srgb, currentColor 7%, transparent);
    border: 1px solid var(--iob-divider);
    border-radius: var(--iob-border-radius);
    cursor: pointer;
    transition:
        transform 0.08s ease,
        background-color 0.15s ease;
}
.key > span {
    font-size: clamp(9px, 46cqmin, 22px);
}
.key.text > span {
    font-size: clamp(8px, 30cqmin, 15px);
}
.key:hover {
    background: color-mix(in srgb, currentColor 14%, transparent);
}
.key:focus-visible {
    outline: 2px solid var(--iob-primary);
    outline-offset: 1px;
}
.key.pressed {
    background: color-mix(in srgb, currentColor 26%, transparent);
    transform: scale(0.92);
}
.key.power {
    background: var(--iob-success);
    border-color: transparent;
    color: #fff;
}
.key.power.on {
    background: var(--iob-error);
}
.key.color {
    background: var(--key-color);
    border-color: transparent;
}
.key.power:hover,
.key.color:hover {
    filter: brightness(1.12);
}
.view.full {
    grid-template-columns: minmax(0, 1fr);
    align-content: center;
    max-width: 340px;
    margin: 0 auto;
    overflow-y: auto;
}
`;

/** The element: the box of the host, the three views and the hint */
export const STYLES = `
:host {
    display: block;
    width: 100%;
    height: 100%;
}
.mount {
    width: 100%;
    height: 100%;
    /* the size of the box does not depend on what is in it */
    container-type: size;
    container-name: lgtv;
}
${PARTS}
.view.compact {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
}
.compact .keys {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    width: 100%;
    height: 100%;
    max-width: 320px;
    max-height: 170px;
    justify-self: center;
    align-self: center;
}
.view.strip {
    --k: clamp(20px, min(100cqh - 2 * var(--pad), (100cqw - 2 * var(--pad)) / 8), 44px);
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
}
.strip .head {
    flex: 1;
}
.strip .keys {
    display: flex;
    flex: none;
}
.strip .key {
    width: var(--k);
    height: var(--k);
}
.auto > .view {
    display: none;
}
.auto > .view.compact {
    display: grid;
}
@container lgtv (aspect-ratio >= 11 / 5) {
    .compact .keys {
        grid-template-columns: repeat(6, minmax(0, 1fr));
        grid-template-rows: minmax(0, 1fr);
        max-width: 480px;
        max-height: 80px;
    }
}
@container lgtv (aspect-ratio >= 5 / 2) and (height <= 110px) {
    .auto > .view.compact {
        display: none;
    }
    .auto > .view.strip {
        display: flex;
    }
}
@container lgtv (height < 56px) {
    .strip .status {
        display: none;
    }
}
@container lgtv (height >= 340px) and (width >= 180px) {
    .auto > .view.compact {
        display: none;
    }
    .auto > .view.full {
        display: grid;
    }
}
.hint {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(2px, 3cqmin, 8px);
    overflow: hidden;
    text-align: center;
    color: var(--iob-text-secondary);
    font-size: clamp(10px, 6cqmin, 15px);
}
.hint.edit {
    pointer-events: none;
}
.hint svg {
    flex: none;
    width: clamp(16px, 14cqmin, 36px);
    height: clamp(16px, 14cqmin, 36px);
    fill: currentColor;
}
`;

/**
 * The whole remote in a dialog of the host. The host moves the content out of the element, so it brings the theme
 * along as CSS variables (`index.tsx`); the rows have a fixed height there.
 */
export const DIALOG_STYLES = `
:host {
    display: block;
}
.dialog {
    width: 300px;
    max-width: 100%;
    margin: 0 auto;
    color: var(--iob-text);
    font-family: var(--iob-font-family);
    font-size: var(--iob-font-size);
}
${PARTS}
.single > .view {
    display: grid;
}
.single > .view.full {
    height: auto;
    max-width: none;
    padding: 0;
    overflow: visible;
}
`;
