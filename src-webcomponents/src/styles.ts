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
 *
 * The whole remote has the status panel of the admin remote (`showStatus`), placed by the box as well:
 * - beside the keys from 460 px wide, unless the box is clearly taller than wide (`beside()`)
 * - else above the keys from 460 px high - 600 px with more than eight rows of keys, as with the number pad
 *   (`above()`)
 * - else not at all: the header keeps its status line, as in the small views
 */

/**
 * The status panel above the keys: one more row in the grid of the whole remote, the line below the name goes
 *
 * @param view the selector of the whole remote
 */
function above(view: string): string {
    return `
${view} {
    grid-template-rows: auto auto repeat(var(--rows), var(--track));
}
${view} > .panel {
    display: flex;
}
${view} > .head .status {
    display: none;
}
`;
}

/**
 * The status panel beside the keys: a second column over all rows, its facts one below the other
 *
 * @param view the selector of the whole remote
 */
function beside(view: string): string {
    return `
${view} {
    /* the keys take their width first, the panel what is left: at least 200 px, at most 280 px */
    grid-template-columns: minmax(min(340px, 100% - 200px - 4 * var(--gap)), 340px) minmax(200px, 280px);
    grid-template-rows: auto repeat(var(--rows), var(--track));
    column-gap: calc(var(--gap) * 4);
    justify-content: center;
    max-width: none;
}
${view} > :not(.panel) {
    grid-column: 1;
}
${view} > .panel {
    display: flex;
    grid-column: 2;
    grid-row: 1 / -1;
    align-self: start;
}
${view} > .head .status {
    display: none;
}
${view} .panel-title {
    display: block;
}
${view} .facts {
    grid-template-columns: minmax(0, 1fr);
}
${view} .fact {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    column-gap: calc(var(--gap) * 2);
}
/* a value too long to stand beside its label goes below it, on the right */
${view} .fact .value {
    margin-left: auto;
    text-align: right;
}
`;
}

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
    /* the number of rows and their height come from the element: --rows, --track */
    grid-template-rows: auto repeat(var(--rows), var(--track));
    align-content: center;
    max-width: 340px;
    margin: 0 auto;
    overflow-y: auto;
}
.panel {
    display: none;
    flex-direction: column;
    gap: calc(var(--gap) * 1.5);
    min-width: 0;
    box-sizing: border-box;
    padding: calc(var(--pad) * 0.8) var(--pad);
    border: 1px solid var(--iob-divider);
    border-radius: calc(var(--iob-border-radius) * 2);
}
.panel-title {
    display: none;
    padding-bottom: var(--gap);
    border-bottom: 1px solid var(--iob-divider);
    font-weight: 600;
    font-size: clamp(11px, 4.4cqmin, 14px);
}
.facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gap) calc(var(--gap) * 2);
}
.fact {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.35;
}
.fact .label {
    flex: none;
    color: var(--iob-text-secondary);
    font-size: clamp(10px, 4cqmin, 12px);
}
.fact .value {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: clamp(11px, 4.8cqmin, 14px);
    font-variant-numeric: tabular-nums;
}
.chip {
    display: inline-block;
    padding: 0 0.6em;
    border-radius: 999px;
    font-size: 0.85em;
    font-weight: 600;
    line-height: 1.5;
    vertical-align: middle;
    background: color-mix(in srgb, currentColor 12%, transparent);
}
.chip.on {
    background: var(--iob-success);
    color: #fff;
}
.chip.muted {
    margin-left: 0.5em;
    background: none;
    color: var(--iob-warning);
    box-shadow: inset 0 0 0 1px currentColor;
}
.volume {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.volume .fact {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: calc(var(--gap) * 2);
}
.slider {
    box-sizing: border-box;
    width: 100%;
    height: 20px;
    margin: 0;
    accent-color: var(--iob-primary);
    cursor: pointer;
}
.slider:disabled {
    opacity: 0.5;
    cursor: default;
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
@container lgtv (height >= 460px) {
    ${above('.auto > .full.status.rows-s')}
}
@container lgtv (height >= 600px) {
    ${above('.auto > .full.status.rows-l')}
}
/* after the rules above, with the same weight: beside wins where both fit */
@container lgtv (width >= 460px) and (height >= 340px) and (aspect-ratio >= 3 / 4) {
    ${beside('.auto > .view.full.status')}
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
 * along as CSS variables (`index.tsx`); the rows have a fixed height there. With the status panel the dialog asks
 * for more width: the panel goes beside the keys if the host gives it, above them on a narrow screen.
 */
export const DIALOG_STYLES = `
:host {
    display: block;
}
.dialog {
    width: 300px;
    max-width: 100%;
    margin: 0 auto;
    container: lgtv-dialog / inline-size;
    color: var(--iob-text);
    font-family: var(--iob-font-family);
    font-size: var(--iob-font-size);
}
.dialog.status {
    width: 580px;
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
${above('.single > .full.status')}
@container lgtv-dialog (width >= 540px) {
    ${beside('.single > .view.full.status')}
}
`;
