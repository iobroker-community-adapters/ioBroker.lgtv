import{createRoot as e,useEffect as t,useRef as n,jsx as r,jsxs as i}from"../../../lib/esm/react-19.js";var a=`iob-dialog-close`;function o(e){return!!e.form}var s=[`header`,`staticText`,`divider`];function c(e,t){return e==null?``:typeof e==`object`?e[t]||e.en||Object.values(e).find(e=>!!e)||``:String(e)}function l(e){let t={};for(let[n,r]of Object.entries(e.items||{}))r&&!s.includes(r.type)&&(t[n]=r.type);return t}function u(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?e.toString():JSON.stringify(e)}function d(e,t){if(t!=null)switch(e){case`number`:case`slider`:{if(typeof t==`number`)return Number.isFinite(t)?t:void 0;let e=u(t).trim().replace(`,`,`.`);if(!e)return;let n=Number(e);return Number.isFinite(n)?n:void 0}case`checkbox`:return t===!0||t===`true`||t===1||t===`1`;default:return u(t)}}function f(e,t){let n={};for(let[r,i]of Object.entries(e)){let e=d(i,t[r]);e!==void 0&&(n[r]=e)}return n}var p=`"Roboto", "Helvetica", "Arial", sans-serif`,m=Object.freeze({type:`light`,primary:`#3399CC`,primaryContrast:`#FFFFFF`,secondary:`#164477`,secondaryContrast:`#FFFFFF`,background:`#FFFFFF`,paper:`#FFFFFF`,text:`rgba(0, 0, 0, 0.87)`,textSecondary:`rgba(0, 0, 0, 0.6)`,divider:`rgba(0, 0, 0, 0.12)`,error:`#D32F2F`,warning:`#ED6C02`,info:`#0288D1`,success:`#2E7D32`,fontFamily:p,fontSize:14,borderRadius:4}),h=Object.freeze({type:`dark`,primary:`#4DABF5`,primaryContrast:`rgba(0, 0, 0, 0.87)`,secondary:`#436A93`,secondaryContrast:`#FFFFFF`,background:`#121212`,paper:`#121212`,text:`#FFFFFF`,textSecondary:`rgba(255, 255, 255, 0.7)`,divider:`rgba(255, 255, 255, 0.12)`,error:`#F44336`,warning:`#FFA726`,info:`#29B6F6`,success:`#66BB6A`,fontFamily:p,fontSize:14,borderRadius:4}),g=[`primary`,`primaryContrast`,`secondary`,`secondaryContrast`,`background`,`paper`,`text`,`textSecondary`,`divider`,`error`,`warning`,`info`,`success`,`fontFamily`],_=[`fontSize`,`borderRadius`];function v(e){return{...e===`dark`?h:m}}function y(e){if(!e||typeof e!=`object`)return v(typeof e==`string`?e:`light`);let t=e,n=v(typeof t.type==`string`?t.type:`light`);for(let e of g){let r=t[e];typeof r==`string`&&r.trim()&&(n[e]=r.trim())}for(let e of _){let r=t[e],i=typeof r==`string`?parseFloat(r):r;typeof i==`number`&&Number.isFinite(i)&&i>=0&&(n[e]=i)}return n}function b(e,t){return e.type===t.type&&g.every(n=>e[n]===t[n])&&_.every(n=>e[n]===t[n])}function x(e){return`--iob-${e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}`}function S(e){let t={};for(let n of g)t[x(n)]=e[n];for(let n of _)t[x(n)]=`${e[n]}px`;return t[`color-scheme`]=e.type,t}var C={ok:{en:`OK`,"zh-cn":`确定`},cancel:{en:`Cancel`,de:`Abbrechen`,ru:`Отмена`,pt:`Cancelar`,nl:`Annuleren`,fr:`Annuler`,it:`Annulla`,es:`Cancelar`,pl:`Anuluj`,uk:`Скасувати`,"zh-cn":`取消`},close:{en:`Close`,de:`Schließen`,ru:`Закрыть`,pt:`Fechar`,nl:`Sluiten`,fr:`Fermer`,it:`Chiudi`,es:`Cerrar`,pl:`Zamknij`,uk:`Закрити`,"zh-cn":`关闭`}},w=`
dialog {
    box-sizing: border-box;
    width: 480px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    padding: 0;
    border: 0;
    border-radius: calc(var(--iob-border-radius) * 2);
    background: var(--iob-paper);
    color: var(--iob-text);
    font-family: var(--iob-font-family);
    font-size: var(--iob-font-size);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
/* as the dialogs of MUI: a dark paper gets lighter the higher it lies */
dialog.dark { background-image: linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16)); }
dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
dialog:focus { outline: none; }
form { display: flex; flex-direction: column; height: 100%; max-height: inherit; margin: 0; }
header { display: flex; align-items: center; gap: 8px; padding: 12px 8px 12px 16px; font-size: 1.15em; font-weight: 500; }
header span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.body { flex: 1; min-height: 0; padding: 0 16px 16px; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 16px 16px; }
button { font: inherit; padding: 6px 16px; border-radius: var(--iob-border-radius); border: 1px solid var(--iob-primary); background: transparent; color: var(--iob-primary); cursor: pointer; }
button.primary { background: var(--iob-primary); color: var(--iob-primary-contrast); }
button.close { border: 0; padding: 2px 8px; font-size: 1.4em; line-height: 1; color: var(--iob-text-secondary); }
label { display: flex; flex-direction: column; gap: 4px; }
label.check { flex-direction: row; align-items: center; gap: 8px; }
input, select, textarea { font: inherit; accent-color: var(--iob-primary); }
.help { color: var(--iob-text-secondary); font-size: 0.85em; }
h3 { margin: 4px 0 0; font-size: 1em; }
p { margin: 0; }
hr { width: 100%; border: 0; border-top: 1px solid var(--iob-divider); margin: 0; }
[hidden] { display: none !important; }
`;function T(e){if(!e)return null;try{let t=Function(`data`,`return (${e});`);return e=>{try{return!!t(e)}catch{return!1}}}catch{return null}}function E(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?String(e):``}function D(e){let{input:t,setting:n}=e;if(t)return t instanceof HTMLInputElement&&t.type===`checkbox`?t.checked:t instanceof HTMLSelectElement?n.options?.[t.selectedIndex]?.value:t.value}function O(e,t,n,r,i){let a={name:t,setting:n,box:e.createElement(`div`),hidden:T(n.hidden),disabled:T(n.disabled)},o=c(n.label,i);switch(n.type){case`header`:return a.box=e.createElement(`h3`),a.box.textContent=c(n.text,i)||o,a;case`staticText`:return a.box=e.createElement(`p`),a.box.textContent=c(n.text,i)||o,a;case`divider`:return a.box=e.createElement(`hr`),a}let s=e.createElement(`label`);a.box=s;let l=e.createElement(`span`);if(l.textContent=o||t,n.type===`checkbox`){let t=e.createElement(`input`);t.type=`checkbox`,t.checked=r===!0||r===`true`,s.className=`check`,s.append(t,l),a.input=t}else if(n.type===`select`){let t=e.createElement(`select`);for(let r of n.options||[]){let n=e.createElement(`option`);n.textContent=c(r.label,i),t.append(n)}let o=(n.options||[]).findIndex(e=>String(e.value)===E(r));t.selectedIndex=o===-1?0:o,s.append(l,t),a.input=t}else if(n.type===`text`&&(n.minRows||1)>1){let t=e.createElement(`textarea`);t.rows=n.minRows||2,t.value=E(r),s.append(l,t),a.input=t}else{let t=e.createElement(`input`),i=E(r);switch(n.type){case`number`:case`slider`:t.type=n.type===`slider`?`range`:`number`,n.min!==void 0&&(t.min=String(n.min)),n.max!==void 0&&(t.max=String(n.max)),t.step=n.step===void 0?`any`:String(n.step);break;case`password`:t.type=`password`;break;case`color`:t.type=!i||/^#[0-9a-f]{6}$/i.test(i)?`color`:`text`;break;default:t.type=`text`}if(t.value=i,t.type===`range`){let n=e.createElement(`output`);n.textContent=t.value,t.addEventListener(`input`,()=>n.textContent=t.value),l.append(`: `,n)}s.append(l,t),a.input=t}if(n.help){let t=e.createElement(`span`);t.className=`help`,t.textContent=c(n.help,i),s.append(t)}return a}function ee(e,t={}){let n=t.lang||`en`,r=document,i=e=>C[e][n]||C[e].en||e,s=r.createElement(`div`);s.setAttribute(`data-iob-dialog`,``);let u=s.attachShadow({mode:`open`}),d=r.createElement(`style`);d.textContent=w;let p=r.createElement(`dialog`),m=y(t.theme);p.className=m.type===`dark`?`dark`:``;for(let[e,t]of Object.entries(S(m)))p.style.setProperty(e,t);e.width&&(p.style.width=`${e.width}px`),e.height&&(p.style.height=`${e.height}px`);let h=r.createElement(`form`),g=r.createElement(`header`),_=r.createElement(`span`);_.textContent=c(e.title,n);let v=r.createElement(`button`);v.type=`button`,v.className=`close`,v.title=i(`close`),v.setAttribute(`aria-label`,i(`close`)),v.textContent=`×`,g.append(_,v);let b=r.createElement(`div`);return b.className=`body`,h.append(g,b),p.append(h),u.append(d,p),new Promise(t=>{let d=!1,m=e=>{d||(d=!0,p.open&&p.close(),s.remove(),t(e))};if(v.addEventListener(`click`,()=>m(null)),p.addEventListener(`close`,()=>m(null)),h.addEventListener(`submit`,e=>e.preventDefault()),o(e)){let t={},a=[];for(let[t,i]of Object.entries(e.form.items||{})){let o=e.data?.[t]??i.default,s=O(r,t,i,o,n);a.push(s),b.append(s.box)}let o=()=>{for(let e of a)e.input&&(t[e.name]=D(e));return t},s=()=>{let e=o();for(let t of a)t.box.hidden=t.hidden?t.hidden(e):!1,t.input&&(t.input.disabled=t.disabled?t.disabled(e):!1)};h.addEventListener(`input`,s),h.addEventListener(`change`,s),s();let u=a.find(e=>e.input&&!e.box.hidden&&!e.input.disabled);u?.input&&(u.input.autofocus=!0);let d=r.createElement(`footer`),p=r.createElement(`button`);p.type=`button`,p.textContent=c(e.cancel,n)||i(`cancel`),p.addEventListener(`click`,()=>m(null));let g=r.createElement(`button`);g.type=`submit`,g.className=`primary`,g.textContent=c(e.ok,n)||i(`ok`),d.append(p,g),h.append(d),h.addEventListener(`submit`,()=>m(f(l(e.form),o())))}else b.append(e.element),p.addEventListener(a,e=>m(e.detail??null));r.body.append(s),p.showModal(),u.activeElement&&u.activeElement!==v||(p.tabIndex=-1,p.focus())})}function k(e){return[...new Set(e.filter(e=>typeof e==`string`&&!!e))]}var A=[`socket`,`dialogs`,`theme`,`editMode`,`settings`,`value`],j=class extends HTMLElement{states={};objects={};#e=null;#t={};#n=y(`light`);#r=!1;#i=null;#a=void 0;#o=null;#s=!1;#c=(e,t)=>{this.#o?.states.includes(e)&&(this.states[e]=t||null,this.#_())};#l=(e,t)=>{this.#o?.objects.includes(e)&&(this.objects[e]=t||null,this.#d())};get socket(){return this.#e}set socket(e){this.#e=e||null,this.#d()}get settings(){return this.#t}set settings(e){this.#t=e||{},this.#d()}get theme(){return this.#n}set theme(e){let t=y(e);b(t,this.#n)||(this.#n=t,this.#u(),this.#_())}get editMode(){return this.#r}set editMode(e){let t=!!e;t!==this.#r&&(this.#r=t,this.#_())}get dialogs(){return this.#i}set dialogs(e){this.#i=e||null}get value(){return this.#a}set value(e){e!==this.#a&&(this.#a=e,this.#_())}connectedCallback(){for(let e of A)if(Object.prototype.hasOwnProperty.call(this,e)){let t=this[e];delete this[e],this[e]=t}this.#u(),this.#d()}disconnectedCallback(){this.#g()}getStateIds(e){return[]}getObjectIds(e){return[]}get systemLang(){return this.#e?.systemLang||`en`}text(e){return c(e,this.systemLang)}setState(e,t){return this.#e&&!this.#r?this.#e.setState(e,t):Promise.resolve()}changeValue(e){return this.#r||this.emit(`iob-change`,e)?!1:(this.value=e,!0)}emit(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0,cancelable:!0}))}async openDialog(e){if(this.#r)return null;let t=this.#i?await this.#i.open(e):await ee(e,{lang:this.systemLang,theme:this.#n});return o(e)?t&&typeof t==`object`?f(l(e.form),t):null:t??null}#u(){for(let[e,t]of Object.entries(S(this.#n)))this.style.setProperty(e,t)}#d(){if(!this.isConnected)return;let e=this.#e,t=e?k(this.getStateIds(this.#t)):[],n=e?k(this.getObjectIds(this.#t)):[];this.#o&&this.#o.socket!==e&&this.#g();let r=this.#o?.states||[],i=this.#o?.objects||[],a=r.filter(e=>!t.includes(e)),o=i.filter(e=>!n.includes(e)),s=t.filter(e=>!r.includes(e)),c=n.filter(e=>!i.includes(e));e&&a.length&&e.unsubscribeState(a,this.#c),e&&o.length&&this.#h(e,o);for(let e of a)delete this.states[e];for(let e of[...a,...o])!t.includes(e)&&!n.includes(e)&&delete this.objects[e];this.#o=e&&(t.length||n.length)?{socket:e,states:t,objects:n}:null,e&&s.length&&this.#p(e,s),e&&c.length&&this.#m(e,c),this.#_()}#f(e,t,n){return this.#o?.socket===e&&this.#o[t].includes(n)}#p(e,t){e.subscribeState(t,this.#c).catch(e=>console.warn(`<${this.localName}>: cannot subscribe ${t.join(`, `)}: ${e}`));for(let n of t)e.getState(n).then(t=>{this.#f(e,`states`,n)&&this.states[n]===void 0&&(this.states[n]=t||null,this.#_())}).catch(()=>{}),e.getObject(n).then(t=>{this.#f(e,`states`,n)&&!this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#_())}).catch(()=>{})}#m(e,t){e.subscribeObject(t,this.#l).catch(e=>console.warn(`<${this.localName}>: cannot subscribe the objects ${t.join(`, `)}: ${e}`));for(let n of t)e.getObject(n).then(t=>{this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#d())}).catch(()=>{})}#h(e,t){e.unsubscribeObject(t,this.#l).catch(()=>{})}#g(){if(this.#o){let{socket:e,states:t,objects:n}=this.#o;t.length&&e.unsubscribeState(t,this.#c),n.length&&this.#h(e,n),this.#o=null}this.states={},this.objects={}}#_(){this.#s||(this.#s=!0,queueMicrotask(()=>{this.#s=!1,this.isConnected&&this.render()}))}};function te(e,t){let n=typeof e==`string`?e:e.tag;customElements.get(n)||customElements.define(n,t)}var ne=`iob-lgtv-remote`,re=[`on`,`powerState`,`volume`,`mute`,`currentApp`,`input`],M=[`on`,`screen_off`,`screen_saver`],N=[`status`,`tv`,`powerState`,`currentApp`,`input`,`volume`,`ps_on`,`ps_screen_off`,`ps_screen_saver`,`ps_standby`,`ps_off`];function P(e){let t=(e||``).trim().match(/^(?:system\.adapter\.)?(lgtv\.\d+)$/);return t?t[1]:null}var F={chooseInstance:`Choose an LG TV instance in the settings`,notInstance:`Not an instance of the lgtv adapter`,fullRemote:`Full remote`,red:`Red`,green:`Green`,yellow:`Yellow`,blue:`Blue`,dash:`Dash`,flashback:`Previous channel`},ie={en:F,de:{chooseInstance:`LG-TV-Instanz in den Einstellungen wählen`,notInstance:`Keine Instanz des lgtv-Adapters`,fullRemote:`Ganze Fernbedienung`,red:`Rot`,green:`Grün`,yellow:`Gelb`,blue:`Blau`,dash:`Strich`,flashback:`Vorheriger Kanal`},ru:{chooseInstance:`Выберите экземпляр LG TV в настройках`,notInstance:`Это не экземпляр адаптера lgtv`,fullRemote:`Полный пульт`,red:`Красная`,green:`Зелёная`,yellow:`Жёлтая`,blue:`Синяя`,dash:`Тире`,flashback:`Предыдущий канал`},pt:{chooseInstance:`Escolha uma instância de LG TV nas configurações`,notInstance:`Não é uma instância do adaptador lgtv`,fullRemote:`Comando completo`,red:`Vermelho`,green:`Verde`,yellow:`Amarelo`,blue:`Azul`,dash:`Traço`,flashback:`Canal anterior`},nl:{chooseInstance:`Kies een LG TV-instantie in de instellingen`,notInstance:`Geen instantie van de lgtv-adapter`,fullRemote:`Volledige afstandsbediening`,red:`Rood`,green:`Groen`,yellow:`Geel`,blue:`Blauw`,dash:`Streepje`,flashback:`Vorige zender`},fr:{chooseInstance:`Choisissez une instance LG TV dans les paramètres`,notInstance:`Pas une instance de l'adaptateur lgtv`,fullRemote:`Télécommande complète`,red:`Rouge`,green:`Vert`,yellow:`Jaune`,blue:`Bleu`,dash:`Tiret`,flashback:`Chaîne précédente`},it:{chooseInstance:`Scegli un'istanza LG TV nelle impostazioni`,notInstance:`Non è un'istanza dell'adattatore lgtv`,fullRemote:`Telecomando completo`,red:`Rosso`,green:`Verde`,yellow:`Giallo`,blue:`Blu`,dash:`Trattino`,flashback:`Canale precedente`},es:{chooseInstance:`Elija una instancia de LG TV en la configuración`,notInstance:`No es una instancia del adaptador lgtv`,fullRemote:`Mando completo`,red:`Rojo`,green:`Verde`,yellow:`Amarillo`,blue:`Azul`,dash:`Guion`,flashback:`Canal anterior`},pl:{chooseInstance:`Wybierz instancję LG TV w ustawieniach`,notInstance:`To nie jest instancja adaptera lgtv`,fullRemote:`Pełny pilot`,red:`Czerwony`,green:`Zielony`,yellow:`Żółty`,blue:`Niebieski`,dash:`Myślnik`,flashback:`Poprzedni kanał`},uk:{chooseInstance:`Виберіть екземпляр LG TV у налаштуваннях`,notInstance:`Це не екземпляр адаптера lgtv`,fullRemote:`Повний пульт`,red:`Червона`,green:`Зелена`,yellow:`Жовта`,blue:`Синя`,dash:`Тире`,flashback:`Попередній канал`},"zh-cn":{chooseInstance:`请在设置中选择 LG TV 实例`,notInstance:`不是 lgtv 适配器的实例`,fullRemote:`完整遥控器`,red:`红色`,green:`绿色`,yellow:`黄色`,blue:`蓝色`,dash:`短横线`,flashback:`上一个频道`}};function I(e,t){if(t in F){let n=t;return ie[e]?.[n]||F[n]}let n=t;return{en:{title:`LG TV`,power:`Power`,up:`Up`,down:`Down`,left:`Left`,right:`Right`,ok:`OK`,back:`Back`,home:`Home`,menu:`Menu`,exit:`Exit`,info:`Info`,volumeUp:`Volume up`,volumeDown:`Volume down`,mute:`Mute`,channelUp:`Channel up`,channelDown:`Channel down`,play:`Play`,pause:`Pause`,stop:`Stop`,rewind:`Rewind`,fastForward:`Fast forward`,list:`Channel list`,qmenu:`Quick menu`,myApps:`My apps`,muted:`muted`,online:`On`,offline:`Off`,unknown:`Unknown`,status:`Status`,tv:`TV`,powerState:`Power state`,currentApp:`Current app`,input:`Input`,volume:`Volume`,ps_on:`On`,ps_screen_off:`Screen off`,ps_screen_saver:`Screen saver`,ps_standby:`Standby`,ps_off:`Off`},de:{title:`LG TV`,power:`Ein/Aus`,up:`Hoch`,down:`Runter`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Zurück`,home:`Home`,menu:`Menü`,exit:`Beenden`,info:`Info`,volumeUp:`Lauter`,volumeDown:`Leiser`,mute:`Stumm`,channelUp:`Kanal +`,channelDown:`Kanal −`,play:`Wiedergabe`,pause:`Pause`,stop:`Stopp`,rewind:`Zurückspulen`,fastForward:`Vorspulen`,list:`Kanalliste`,qmenu:`Schnellmenü`,myApps:`Meine Apps`,muted:`stumm`,online:`An`,offline:`Aus`,unknown:`Unbekannt`,status:`Status`,tv:`TV`,powerState:`Energiezustand`,currentApp:`Aktuelle App`,input:`Eingang`,volume:`Lautstärke`,ps_on:`An`,ps_screen_off:`Bildschirm aus`,ps_screen_saver:`Bildschirmschoner`,ps_standby:`Standby`,ps_off:`Aus`},ru:{title:`LG TV`,power:`Питание`,up:`Вверх`,down:`Вниз`,left:`Влево`,right:`Вправо`,ok:`OK`,back:`Назад`,home:`Домой`,menu:`Меню`,exit:`Выход`,info:`Инфо`,volumeUp:`Громче`,volumeDown:`Тише`,mute:`Без звука`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Воспроизведение`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотка назад`,fastForward:`Перемотка вперёд`,list:`Список каналов`,qmenu:`Быстрое меню`,myApps:`Мои приложения`,muted:`без звука`,online:`Вкл`,offline:`Выкл`,unknown:`Неизвестно`,status:`Статус`,tv:`Телевизор`,powerState:`Состояние питания`,currentApp:`Текущее приложение`,input:`Вход`,volume:`Громкость`,ps_on:`Включён`,ps_screen_off:`Экран выключен`,ps_screen_saver:`Заставка`,ps_standby:`Ожидание`,ps_off:`Выключен`},pt:{title:`LG TV`,power:`Ligar/Desligar`,up:`Cima`,down:`Baixo`,left:`Esquerda`,right:`Direita`,ok:`OK`,back:`Voltar`,home:`Início`,menu:`Menu`,exit:`Sair`,info:`Info`,volumeUp:`Aumentar volume`,volumeDown:`Diminuir volume`,mute:`Silenciar`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproduzir`,pause:`Pausa`,stop:`Parar`,rewind:`Retroceder`,fastForward:`Avançar`,list:`Lista de canais`,qmenu:`Menu rápido`,myApps:`As minhas apps`,muted:`silenciado`,online:`Ligado`,offline:`Desligado`,unknown:`Desconhecido`,status:`Estado`,tv:`TV`,powerState:`Estado de energia`,currentApp:`Aplicação atual`,input:`Entrada`,volume:`Volume`,ps_on:`Ligado`,ps_screen_off:`Ecrã desligado`,ps_screen_saver:`Proteção de ecrã`,ps_standby:`Em espera`,ps_off:`Desligado`},nl:{title:`LG TV`,power:`Aan/uit`,up:`Omhoog`,down:`Omlaag`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Terug`,home:`Home`,menu:`Menu`,exit:`Afsluiten`,info:`Info`,volumeUp:`Volume omhoog`,volumeDown:`Volume omlaag`,mute:`Dempen`,channelUp:`Kanaal +`,channelDown:`Kanaal −`,play:`Afspelen`,pause:`Pauze`,stop:`Stoppen`,rewind:`Terugspoelen`,fastForward:`Vooruitspoelen`,list:`Kanalenlijst`,qmenu:`Snelmenu`,myApps:`Mijn apps`,muted:`gedempt`,online:`Aan`,offline:`Uit`,unknown:`Onbekend`,status:`Status`,tv:`TV`,powerState:`Energiestatus`,currentApp:`Huidige app`,input:`Ingang`,volume:`Volume`,ps_on:`Aan`,ps_screen_off:`Scherm uit`,ps_screen_saver:`Schermbeveiliging`,ps_standby:`Stand-by`,ps_off:`Uit`},fr:{title:`LG TV`,power:`Marche/Arrêt`,up:`Haut`,down:`Bas`,left:`Gauche`,right:`Droite`,ok:`OK`,back:`Retour`,home:`Accueil`,menu:`Menu`,exit:`Quitter`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muet`,channelUp:`Chaîne +`,channelDown:`Chaîne −`,play:`Lecture`,pause:`Pause`,stop:`Arrêt`,rewind:`Retour rapide`,fastForward:`Avance rapide`,list:`Liste des chaînes`,qmenu:`Menu rapide`,myApps:`Mes applis`,muted:`muet`,online:`Allumé`,offline:`Éteint`,unknown:`Inconnu`,status:`État`,tv:`TV`,powerState:`État d'alimentation`,currentApp:`Application actuelle`,input:`Entrée`,volume:`Volume`,ps_on:`Allumé`,ps_screen_off:`Écran éteint`,ps_screen_saver:`Économiseur d'écran`,ps_standby:`Veille`,ps_off:`Éteint`},it:{title:`LG TV`,power:`Accensione`,up:`Su`,down:`Giù`,left:`Sinistra`,right:`Destra`,ok:`OK`,back:`Indietro`,home:`Home`,menu:`Menu`,exit:`Esci`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muto`,channelUp:`Canale +`,channelDown:`Canale −`,play:`Riproduci`,pause:`Pausa`,stop:`Stop`,rewind:`Riavvolgi`,fastForward:`Avanti veloce`,list:`Elenco canali`,qmenu:`Menu rapido`,myApps:`Le mie app`,muted:`muto`,online:`Acceso`,offline:`Spento`,unknown:`Sconosciuto`,status:`Stato`,tv:`TV`,powerState:`Stato di alimentazione`,currentApp:`App corrente`,input:`Ingresso`,volume:`Volume`,ps_on:`Acceso`,ps_screen_off:`Schermo spento`,ps_screen_saver:`Salvaschermo`,ps_standby:`Standby`,ps_off:`Spento`},es:{title:`LG TV`,power:`Encendido`,up:`Arriba`,down:`Abajo`,left:`Izquierda`,right:`Derecha`,ok:`OK`,back:`Atrás`,home:`Inicio`,menu:`Menú`,exit:`Salir`,info:`Info`,volumeUp:`Subir volumen`,volumeDown:`Bajar volumen`,mute:`Silencio`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproducir`,pause:`Pausa`,stop:`Detener`,rewind:`Rebobinar`,fastForward:`Avance rápido`,list:`Lista de canales`,qmenu:`Menú rápido`,myApps:`Mis aplicaciones`,muted:`silenciado`,online:`Encendido`,offline:`Apagado`,unknown:`Desconocido`,status:`Estado`,tv:`TV`,powerState:`Estado de energía`,currentApp:`Aplicación actual`,input:`Entrada`,volume:`Volumen`,ps_on:`Encendido`,ps_screen_off:`Pantalla apagada`,ps_screen_saver:`Salvapantallas`,ps_standby:`En espera`,ps_off:`Apagado`},pl:{title:`LG TV`,power:`Zasilanie`,up:`Góra`,down:`Dół`,left:`Lewo`,right:`Prawo`,ok:`OK`,back:`Wstecz`,home:`Ekran główny`,menu:`Menu`,exit:`Wyjście`,info:`Info`,volumeUp:`Głośniej`,volumeDown:`Ciszej`,mute:`Wyciszenie`,channelUp:`Kanał +`,channelDown:`Kanał −`,play:`Odtwarzaj`,pause:`Pauza`,stop:`Stop`,rewind:`Przewiń do tyłu`,fastForward:`Przewiń do przodu`,list:`Lista kanałów`,qmenu:`Szybkie menu`,myApps:`Moje aplikacje`,muted:`wyciszony`,online:`Wł`,offline:`Wył`,unknown:`Nieznany`,status:`Status`,tv:`TV`,powerState:`Stan zasilania`,currentApp:`Bieżąca aplikacja`,input:`Wejście`,volume:`Głośność`,ps_on:`Włączony`,ps_screen_off:`Ekran wyłączony`,ps_screen_saver:`Wygaszacz ekranu`,ps_standby:`Czuwanie`,ps_off:`Wyłączony`},uk:{title:`LG TV`,power:`Живлення`,up:`Вгору`,down:`Вниз`,left:`Ліворуч`,right:`Праворуч`,ok:`OK`,back:`Назад`,home:`Головна`,menu:`Меню`,exit:`Вихід`,info:`Інфо`,volumeUp:`Гучніше`,volumeDown:`Тихіше`,mute:`Без звуку`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Відтворити`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотати назад`,fastForward:`Перемотати вперед`,list:`Список каналів`,qmenu:`Швидке меню`,myApps:`Мої додатки`,muted:`без звуку`,online:`Увімк`,offline:`Вимк`,unknown:`Невідомо`,status:`Статус`,tv:`Телевізор`,powerState:`Стан живлення`,currentApp:`Поточний застосунок`,input:`Вхід`,volume:`Гучність`,ps_on:`Увімкнено`,ps_screen_off:`Екран вимкнено`,ps_screen_saver:`Заставка`,ps_standby:`Очікування`,ps_off:`Вимкнено`},"zh-cn":{title:`LG 电视`,power:`电源`,up:`上`,down:`下`,left:`左`,right:`右`,ok:`确定`,back:`返回`,home:`主页`,menu:`菜单`,exit:`退出`,info:`信息`,volumeUp:`音量+`,volumeDown:`音量−`,mute:`静音`,channelUp:`频道+`,channelDown:`频道−`,play:`播放`,pause:`暂停`,stop:`停止`,rewind:`快退`,fastForward:`快进`,list:`频道列表`,qmenu:`快捷菜单`,myApps:`我的应用`,muted:`已静音`,online:`开`,offline:`关`,unknown:`未知`,status:`状态`,tv:`电视`,powerState:`电源状态`,currentApp:`当前应用`,input:`输入源`,volume:`音量`,ps_on:`开机`,ps_screen_off:`屏幕关闭`,ps_screen_saver:`屏幕保护`,ps_standby:`待机`,ps_off:`关机`}}[e]?.[n]||{en:{title:`LG TV`,power:`Power`,up:`Up`,down:`Down`,left:`Left`,right:`Right`,ok:`OK`,back:`Back`,home:`Home`,menu:`Menu`,exit:`Exit`,info:`Info`,volumeUp:`Volume up`,volumeDown:`Volume down`,mute:`Mute`,channelUp:`Channel up`,channelDown:`Channel down`,play:`Play`,pause:`Pause`,stop:`Stop`,rewind:`Rewind`,fastForward:`Fast forward`,list:`Channel list`,qmenu:`Quick menu`,myApps:`My apps`,muted:`muted`,online:`On`,offline:`Off`,unknown:`Unknown`,status:`Status`,tv:`TV`,powerState:`Power state`,currentApp:`Current app`,input:`Input`,volume:`Volume`,ps_on:`On`,ps_screen_off:`Screen off`,ps_screen_saver:`Screen saver`,ps_standby:`Standby`,ps_off:`Off`},de:{title:`LG TV`,power:`Ein/Aus`,up:`Hoch`,down:`Runter`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Zurück`,home:`Home`,menu:`Menü`,exit:`Beenden`,info:`Info`,volumeUp:`Lauter`,volumeDown:`Leiser`,mute:`Stumm`,channelUp:`Kanal +`,channelDown:`Kanal −`,play:`Wiedergabe`,pause:`Pause`,stop:`Stopp`,rewind:`Zurückspulen`,fastForward:`Vorspulen`,list:`Kanalliste`,qmenu:`Schnellmenü`,myApps:`Meine Apps`,muted:`stumm`,online:`An`,offline:`Aus`,unknown:`Unbekannt`,status:`Status`,tv:`TV`,powerState:`Energiezustand`,currentApp:`Aktuelle App`,input:`Eingang`,volume:`Lautstärke`,ps_on:`An`,ps_screen_off:`Bildschirm aus`,ps_screen_saver:`Bildschirmschoner`,ps_standby:`Standby`,ps_off:`Aus`},ru:{title:`LG TV`,power:`Питание`,up:`Вверх`,down:`Вниз`,left:`Влево`,right:`Вправо`,ok:`OK`,back:`Назад`,home:`Домой`,menu:`Меню`,exit:`Выход`,info:`Инфо`,volumeUp:`Громче`,volumeDown:`Тише`,mute:`Без звука`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Воспроизведение`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотка назад`,fastForward:`Перемотка вперёд`,list:`Список каналов`,qmenu:`Быстрое меню`,myApps:`Мои приложения`,muted:`без звука`,online:`Вкл`,offline:`Выкл`,unknown:`Неизвестно`,status:`Статус`,tv:`Телевизор`,powerState:`Состояние питания`,currentApp:`Текущее приложение`,input:`Вход`,volume:`Громкость`,ps_on:`Включён`,ps_screen_off:`Экран выключен`,ps_screen_saver:`Заставка`,ps_standby:`Ожидание`,ps_off:`Выключен`},pt:{title:`LG TV`,power:`Ligar/Desligar`,up:`Cima`,down:`Baixo`,left:`Esquerda`,right:`Direita`,ok:`OK`,back:`Voltar`,home:`Início`,menu:`Menu`,exit:`Sair`,info:`Info`,volumeUp:`Aumentar volume`,volumeDown:`Diminuir volume`,mute:`Silenciar`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproduzir`,pause:`Pausa`,stop:`Parar`,rewind:`Retroceder`,fastForward:`Avançar`,list:`Lista de canais`,qmenu:`Menu rápido`,myApps:`As minhas apps`,muted:`silenciado`,online:`Ligado`,offline:`Desligado`,unknown:`Desconhecido`,status:`Estado`,tv:`TV`,powerState:`Estado de energia`,currentApp:`Aplicação atual`,input:`Entrada`,volume:`Volume`,ps_on:`Ligado`,ps_screen_off:`Ecrã desligado`,ps_screen_saver:`Proteção de ecrã`,ps_standby:`Em espera`,ps_off:`Desligado`},nl:{title:`LG TV`,power:`Aan/uit`,up:`Omhoog`,down:`Omlaag`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Terug`,home:`Home`,menu:`Menu`,exit:`Afsluiten`,info:`Info`,volumeUp:`Volume omhoog`,volumeDown:`Volume omlaag`,mute:`Dempen`,channelUp:`Kanaal +`,channelDown:`Kanaal −`,play:`Afspelen`,pause:`Pauze`,stop:`Stoppen`,rewind:`Terugspoelen`,fastForward:`Vooruitspoelen`,list:`Kanalenlijst`,qmenu:`Snelmenu`,myApps:`Mijn apps`,muted:`gedempt`,online:`Aan`,offline:`Uit`,unknown:`Onbekend`,status:`Status`,tv:`TV`,powerState:`Energiestatus`,currentApp:`Huidige app`,input:`Ingang`,volume:`Volume`,ps_on:`Aan`,ps_screen_off:`Scherm uit`,ps_screen_saver:`Schermbeveiliging`,ps_standby:`Stand-by`,ps_off:`Uit`},fr:{title:`LG TV`,power:`Marche/Arrêt`,up:`Haut`,down:`Bas`,left:`Gauche`,right:`Droite`,ok:`OK`,back:`Retour`,home:`Accueil`,menu:`Menu`,exit:`Quitter`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muet`,channelUp:`Chaîne +`,channelDown:`Chaîne −`,play:`Lecture`,pause:`Pause`,stop:`Arrêt`,rewind:`Retour rapide`,fastForward:`Avance rapide`,list:`Liste des chaînes`,qmenu:`Menu rapide`,myApps:`Mes applis`,muted:`muet`,online:`Allumé`,offline:`Éteint`,unknown:`Inconnu`,status:`État`,tv:`TV`,powerState:`État d'alimentation`,currentApp:`Application actuelle`,input:`Entrée`,volume:`Volume`,ps_on:`Allumé`,ps_screen_off:`Écran éteint`,ps_screen_saver:`Économiseur d'écran`,ps_standby:`Veille`,ps_off:`Éteint`},it:{title:`LG TV`,power:`Accensione`,up:`Su`,down:`Giù`,left:`Sinistra`,right:`Destra`,ok:`OK`,back:`Indietro`,home:`Home`,menu:`Menu`,exit:`Esci`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muto`,channelUp:`Canale +`,channelDown:`Canale −`,play:`Riproduci`,pause:`Pausa`,stop:`Stop`,rewind:`Riavvolgi`,fastForward:`Avanti veloce`,list:`Elenco canali`,qmenu:`Menu rapido`,myApps:`Le mie app`,muted:`muto`,online:`Acceso`,offline:`Spento`,unknown:`Sconosciuto`,status:`Stato`,tv:`TV`,powerState:`Stato di alimentazione`,currentApp:`App corrente`,input:`Ingresso`,volume:`Volume`,ps_on:`Acceso`,ps_screen_off:`Schermo spento`,ps_screen_saver:`Salvaschermo`,ps_standby:`Standby`,ps_off:`Spento`},es:{title:`LG TV`,power:`Encendido`,up:`Arriba`,down:`Abajo`,left:`Izquierda`,right:`Derecha`,ok:`OK`,back:`Atrás`,home:`Inicio`,menu:`Menú`,exit:`Salir`,info:`Info`,volumeUp:`Subir volumen`,volumeDown:`Bajar volumen`,mute:`Silencio`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproducir`,pause:`Pausa`,stop:`Detener`,rewind:`Rebobinar`,fastForward:`Avance rápido`,list:`Lista de canales`,qmenu:`Menú rápido`,myApps:`Mis aplicaciones`,muted:`silenciado`,online:`Encendido`,offline:`Apagado`,unknown:`Desconocido`,status:`Estado`,tv:`TV`,powerState:`Estado de energía`,currentApp:`Aplicación actual`,input:`Entrada`,volume:`Volumen`,ps_on:`Encendido`,ps_screen_off:`Pantalla apagada`,ps_screen_saver:`Salvapantallas`,ps_standby:`En espera`,ps_off:`Apagado`},pl:{title:`LG TV`,power:`Zasilanie`,up:`Góra`,down:`Dół`,left:`Lewo`,right:`Prawo`,ok:`OK`,back:`Wstecz`,home:`Ekran główny`,menu:`Menu`,exit:`Wyjście`,info:`Info`,volumeUp:`Głośniej`,volumeDown:`Ciszej`,mute:`Wyciszenie`,channelUp:`Kanał +`,channelDown:`Kanał −`,play:`Odtwarzaj`,pause:`Pauza`,stop:`Stop`,rewind:`Przewiń do tyłu`,fastForward:`Przewiń do przodu`,list:`Lista kanałów`,qmenu:`Szybkie menu`,myApps:`Moje aplikacje`,muted:`wyciszony`,online:`Wł`,offline:`Wył`,unknown:`Nieznany`,status:`Status`,tv:`TV`,powerState:`Stan zasilania`,currentApp:`Bieżąca aplikacja`,input:`Wejście`,volume:`Głośność`,ps_on:`Włączony`,ps_screen_off:`Ekran wyłączony`,ps_screen_saver:`Wygaszacz ekranu`,ps_standby:`Czuwanie`,ps_off:`Wyłączony`},uk:{title:`LG TV`,power:`Живлення`,up:`Вгору`,down:`Вниз`,left:`Ліворуч`,right:`Праворуч`,ok:`OK`,back:`Назад`,home:`Головна`,menu:`Меню`,exit:`Вихід`,info:`Інфо`,volumeUp:`Гучніше`,volumeDown:`Тихіше`,mute:`Без звуку`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Відтворити`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотати назад`,fastForward:`Перемотати вперед`,list:`Список каналів`,qmenu:`Швидке меню`,myApps:`Мої додатки`,muted:`без звуку`,online:`Увімк`,offline:`Вимк`,unknown:`Невідомо`,status:`Статус`,tv:`Телевізор`,powerState:`Стан живлення`,currentApp:`Поточний застосунок`,input:`Вхід`,volume:`Гучність`,ps_on:`Увімкнено`,ps_screen_off:`Екран вимкнено`,ps_screen_saver:`Заставка`,ps_standby:`Очікування`,ps_off:`Вимкнено`},"zh-cn":{title:`LG 电视`,power:`电源`,up:`上`,down:`下`,left:`左`,right:`右`,ok:`确定`,back:`返回`,home:`主页`,menu:`菜单`,exit:`退出`,info:`信息`,volumeUp:`音量+`,volumeDown:`音量−`,mute:`静音`,channelUp:`频道+`,channelDown:`频道−`,play:`播放`,pause:`暂停`,stop:`停止`,rewind:`快退`,fastForward:`快进`,list:`频道列表`,qmenu:`快捷菜单`,myApps:`我的应用`,muted:`已静音`,online:`开`,offline:`关`,unknown:`未知`,status:`状态`,tv:`电视`,powerState:`电源状态`,currentApp:`当前应用`,input:`输入源`,volume:`音量`,ps_on:`开机`,ps_screen_off:`屏幕关闭`,ps_screen_saver:`屏幕保护`,ps_standby:`待机`,ps_off:`关机`}}.en[n]}var L=[{key:`red`,color:`#d5342d`},{key:`green`,color:`#2e9b4f`},{key:`yellow`,color:`#e0b42c`},{key:`blue`,color:`#2f6fd0`}],R=[`1`,`2`,`3`,`4`,`5`,`6`,`7`,`8`,`9`,`dash`,`0`,`flashback`],z={dash:`–`,flashback:`↺`};function B({id:e,label:t,title:n,pressed:i,onPress:a,className:o,style:s}){let c=[`key`];return o&&c.push(o),i===e&&c.push(`pressed`),/* @__PURE__ */ r(`button`,{type:`button`,className:c.join(` `),title:n,"aria-label":n,style:s,onClick:()=>a(e),children:/* @__PURE__ */ r(`span`,{"aria-hidden":`true`,children:t})})}function V({cols:e,children:t}){return/* @__PURE__ */ r(`div`,{className:`row`,style:{"--cols":e},children:t})}function H(e,t){let n=[],{volume:r,muted:i,app:a}=e;return r!==null&&Number.isFinite(r)?n.push(i?`${r} (${t(`muted`)})`:String(r)):i&&n.push(t(`muted`)),a&&n.push(a),n.join(` · `)}function U({values:e,options:t,word:n,onMore:a}){let o=t.showStatus?H(e,n):``,{on:s}=e;return/* @__PURE__ */ i(`div`,{className:`head`,children:[/* @__PURE__ */ i(`div`,{className:`titles`,children:[/* @__PURE__ */ r(`div`,{className:`name`,children:e.name}),o?/* @__PURE__ */ r(`div`,{className:`status`,children:o}):null]}),/* @__PURE__ */ r(`span`,{className:`dot${s===null?``:s?` on`:` off`}`,title:n(s===null?`unknown`:s?`online`:`offline`)}),a?/* @__PURE__ */ r(`button`,{type:`button`,className:`more`,title:n(`fullRemote`),"aria-label":n(`fullRemote`),onClick:a,children:`⋯`}):null]})}function W({volume:e,label:i,onVolume:a}){let o=n(null);return t(()=>{let e=o.current;if(!e)return;let t=()=>a(Number(e.value),!0);return e.addEventListener(`change`,t),()=>e.removeEventListener(`change`,t)},[a]),/* @__PURE__ */ r(`input`,{ref:o,className:`slider`,type:`range`,min:0,max:100,step:1,value:e??0,disabled:e===null,"aria-label":i,title:i,onChange:e=>a(Number(e.currentTarget.value),!1)})}function G({label:e,children:t}){return/* @__PURE__ */ i(`div`,{className:`fact`,children:[/* @__PURE__ */ r(`span`,{className:`label`,children:e}),/* @__PURE__ */ r(`span`,{className:`value`,children:t})]})}function K(e,t){let n=`ps_${e}`;return N.includes(n)?t(n):e}function q({values:e,word:t,onVolume:n}){let{running:a,powerState:o,app:s,input:c,volume:l,muted:u}=e;return/* @__PURE__ */ i(`div`,{className:`panel`,children:[/* @__PURE__ */ r(`div`,{className:`panel-title`,children:t(`status`)}),/* @__PURE__ */ i(`div`,{className:`facts`,children:[/* @__PURE__ */ r(G,{label:t(`tv`),children:/* @__PURE__ */ r(`span`,{className:`chip${a?` on`:``}`,children:t(a===null?`unknown`:a?`online`:`offline`)})}),o?/* @__PURE__ */ r(G,{label:t(`powerState`),children:K(o,t)}):null,s?/* @__PURE__ */ r(G,{label:t(`currentApp`),children:s}):null,c?/* @__PURE__ */ r(G,{label:t(`input`),children:c}):null]}),/* @__PURE__ */ i(`div`,{className:`volume`,children:[/* @__PURE__ */ i(G,{label:t(`volume`),children:[l===null?``:l,u?/* @__PURE__ */ r(`span`,{className:`chip muted`,children:t(`muted`)}):null]}),/* @__PURE__ */ r(W,{volume:l,label:t(`volume`),onVolume:n})]})]})}function J({values:e,pressed:t,word:n,onPress:i}){return/* @__PURE__ */ r(B,{id:`power`,label:`⏻`,title:n(`power`),className:e.on?`power on`:`power`,pressed:t,onPress:i})}function ae(e){let t=6;return e.showMedia&&t++,e.showColorKeys&&t++,e.showNumpad&&(t+=4),t}function Y(e){let{options:t,pressed:n,word:a,onPress:o,rowHeight:s}=e,c=ae(t),l=[`view`,`full`];t.showStatus&&l.push(`status`,c>8?`rows-l`:`rows-s`);let u=(e,t,i,s)=>/* @__PURE__ */ r(B,{id:e,label:t,title:a(i),className:s,pressed:n,onPress:o},e),d=s?`${s}px`:`minmax(24px, 56px)`;return/* @__PURE__ */ i(`div`,{className:l.join(` `),style:{"--rows":c,"--track":d},children:[/* @__PURE__ */ r(U,{...e}),t.showStatus?/* @__PURE__ */ r(q,{...e}):null,/* @__PURE__ */ i(V,{cols:4,children:[/* @__PURE__ */ r(J,{...e}),u(`list`,`≡`,`list`),u(`qmenu`,`Q`,`qmenu`),u(`myApps`,`⊞`,`myApps`)]}),/* @__PURE__ */ i(`div`,{className:`dpad`,children:[/* @__PURE__ */ r(`span`,{}),u(`up`,`▲`,`up`),/* @__PURE__ */ r(`span`,{}),u(`left`,`◀︎`,`left`),u(`enter`,`OK`,`ok`,`text`),u(`right`,`▶︎`,`right`),/* @__PURE__ */ r(`span`,{}),u(`down`,`▼`,`down`),/* @__PURE__ */ r(`span`,{})]}),/* @__PURE__ */ i(V,{cols:4,children:[u(`back`,`↩︎`,`back`),u(`home`,`⌂`,`home`),u(`menu`,`☰`,`menu`),u(`exit`,`✕`,`exit`)]}),/* @__PURE__ */ i(V,{cols:t.showChannel?6:3,children:[u(`volumeUp`,`+`,`volumeUp`),u(`mute`,`Ø`,`mute`),u(`volumeDown`,`−`,`volumeDown`),t.showChannel?[u(`channelUp`,`CH+`,`channelUp`,`text`),u(`info`,`ℹ︎`,`info`),u(`channelDown`,`CH−`,`channelDown`,`text`)]:null]}),t.showMedia?/* @__PURE__ */ i(V,{cols:5,children:[u(`rewind`,`«`,`rewind`),u(`play`,`▶︎`,`play`),u(`pause`,`⏸︎`,`pause`),u(`stop`,`■`,`stop`),u(`fastForward`,`»`,`fastForward`)]}):null,t.showColorKeys?/* @__PURE__ */ r(V,{cols:4,children:L.map(({key:e,color:t})=>/* @__PURE__ */ r(B,{id:e,label:``,title:a(e),className:`color`,style:{"--key-color":t},pressed:n,onPress:o},e))}):null,t.showNumpad?/* @__PURE__ */ r(`div`,{className:`numpad`,children:R.map(e=>/* @__PURE__ */ r(B,{id:e,label:z[e]??e,title:e===`dash`||e===`flashback`?a(e):e,pressed:n,onPress:o},e))}):null]})}function oe(e){let{pressed:t,word:n,onPress:a}=e;return/* @__PURE__ */ i(`div`,{className:`view compact`,children:[/* @__PURE__ */ r(U,{...e}),/* @__PURE__ */ i(`div`,{className:`keys`,children:[/* @__PURE__ */ r(J,{...e}),/* @__PURE__ */ r(B,{id:`volumeUp`,label:`+`,title:n(`volumeUp`),pressed:t,onPress:a}),/* @__PURE__ */ r(B,{id:`volumeDown`,label:`−`,title:n(`volumeDown`),pressed:t,onPress:a}),/* @__PURE__ */ r(B,{id:`home`,label:`⌂`,title:n(`home`),pressed:t,onPress:a}),/* @__PURE__ */ r(B,{id:`enter`,label:`OK`,title:n(`ok`),className:`text`,pressed:t,onPress:a}),/* @__PURE__ */ r(B,{id:`mute`,label:`Ø`,title:n(`mute`),pressed:t,onPress:a})]})]})}function se(e){let{pressed:t,word:n,onPress:a}=e;return/* @__PURE__ */ i(`div`,{className:`view strip`,children:[/* @__PURE__ */ r(U,{...e}),/* @__PURE__ */ i(`div`,{className:`keys`,children:[/* @__PURE__ */ r(J,{...e}),/* @__PURE__ */ r(B,{id:`volumeDown`,label:`−`,title:n(`volumeDown`),pressed:t,onPress:a}),/* @__PURE__ */ r(B,{id:`mute`,label:`Ø`,title:n(`mute`),pressed:t,onPress:a}),/* @__PURE__ */ r(B,{id:`volumeUp`,label:`+`,title:n(`volumeUp`),pressed:t,onPress:a}),/* @__PURE__ */ r(B,{id:`home`,label:`⌂`,title:n(`home`),pressed:t,onPress:a})]})]})}function ce(e){let{editMode:t,onMore:n,...a}=e;return/* @__PURE__ */ i(`div`,{className:`remote auto${t?` edit`:``}`,children:[/* @__PURE__ */ r(Y,{...a}),/* @__PURE__ */ r(oe,{...a,onMore:n}),/* @__PURE__ */ r(se,{...a,onMore:n})]})}var le=`M15 9H9c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V10c0-.55-.45-1-1-1m-3 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2M7.05 6.05l1.41 1.41C9.37 6.56 10.62 6 12 6s2.63.56 3.54 1.46l1.41-1.41C15.68 4.78 13.93 4 12 4s-3.68.78-4.95 2.05M12 0C8.96 0 6.21 1.23 4.22 3.22l1.41 1.41C7.26 3.01 9.51 2 12 2s4.74 1.01 6.36 2.64l1.41-1.41C17.79 1.23 15.04 0 12 0`;function X({text:e,editMode:t}){return/* @__PURE__ */ i(`div`,{className:`hint${t?` edit`:``}`,children:[/* @__PURE__ */ r(`svg`,{viewBox:`0 0 24 24`,"aria-hidden":`true`,children:/* @__PURE__ */ r(`path`,{d:le})}),/* @__PURE__ */ r(`span`,{children:e})]})}function Z(e){return`
${e} {
    grid-template-rows: auto auto repeat(var(--rows), var(--track));
}
${e} > .panel {
    display: flex;
}
${e} > .head .status {
    display: none;
}
`}function Q(e){return`
${e} {
    /* the keys take their width first, the panel what is left: at least 200 px, at most 280 px */
    grid-template-columns: minmax(min(340px, 100% - 200px - 4 * var(--gap)), 340px) minmax(200px, 280px);
    grid-template-rows: auto repeat(var(--rows), var(--track));
    column-gap: calc(var(--gap) * 4);
    justify-content: center;
    max-width: none;
}
${e} > :not(.panel) {
    grid-column: 1;
}
${e} > .panel {
    display: flex;
    grid-column: 2;
    grid-row: 1 / -1;
    align-self: start;
}
${e} > .head .status {
    display: none;
}
${e} .panel-title {
    display: block;
}
${e} .facts {
    grid-template-columns: minmax(0, 1fr);
}
${e} .fact {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    column-gap: calc(var(--gap) * 2);
}
/* a value too long to stand beside its label goes below it, on the right */
${e} .fact .value {
    margin-left: auto;
    text-align: right;
}
`}var $=`
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
`,ue=`
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
${$}
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
    ${Z(`.auto > .full.status.rows-s`)}
}
@container lgtv (height >= 600px) {
    ${Z(`.auto > .full.status.rows-l`)}
}
/* after the rules above, with the same weight: beside wins where both fit */
@container lgtv (width >= 460px) and (height >= 340px) and (aspect-ratio >= 3 / 4) {
    ${Q(`.auto > .view.full.status`)}
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
`,de=`
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
${$}
.single > .view {
    display: grid;
}
.single > .view.full {
    height: auto;
    max-width: none;
    padding: 0;
    overflow: visible;
}
${Z(`.single > .full.status`)}
@container lgtv-dialog (width >= 540px) {
    ${Q(`.single > .view.full.status`)}
}
`,fe=180,pe=46,me=360,he=640,ge=3e3;te(ne,class extends j{#e;#t=null;#n=null;#r=null;#i=null;#a=null;#o=null;constructor(){super();let t=this.attachShadow({mode:`open`}),n=document.createElement(`style`);n.textContent=ue;let r=document.createElement(`div`);r.className=`mount`,t.append(n,r),this.#e=e(r)}disconnectedCallback(){super.disconnectedCallback(),this.#n&&=(clearTimeout(this.#n),null),this.#t=null,this.#c()}getStateIds(e){let t=P(e.instance);return t?re.map(e=>`${t}.states.${e}`):[]}#s=e=>{let t=P(this.settings.instance);!this.editMode&&t&&(this.setState(`${t}.remote.${e}`,!0),this.#t=e,this.#n&&clearTimeout(this.#n),this.#n=setTimeout(()=>{this.#n=null,this.#t=null,this.render()},fe),this.render())};#c(){this.#o&&=(clearTimeout(this.#o),null),this.#i=null,this.#a=null}#l=(e,t)=>{let n=P(this.settings.instance);if(this.editMode||!n||!Number.isFinite(e))this.render();else{if(this.#c(),this.#i=e,t){let t=`${n}.states.volume`;this.#a={state:this.states[t]??null},this.setState(t,e),this.#o=setTimeout(()=>{this.#c(),this.render()},ge)}this.render()}};#u(){let e=this.settings;return{showStatus:e.showStatus!==!1,showChannel:e.showChannel!==!1,showMedia:e.showMedia!==!1,showColorKeys:e.showColorKeys!==!1,showNumpad:e.showNumpad===!0}}#d(e,t){let n=t=>this.states[`${e}.states.${t}`]?.val,r=n(`on`),i=n(`powerState`),a=n(`volume`),o=n(`mute`),s=n(`currentApp`),c=n(`input`),l=r==null?null:!!r,u=a==null||a===``?null:Number(a);return{name:this.settings.name||t(`title`),on:l,powerState:i?String(i):null,running:i?M.includes(String(i)):l,volume:this.#i??(u!==null&&Number.isFinite(u)?u:null),muted:o==null?null:!!o,app:s&&String(s).split(`.`).pop()||``,input:c?String(c):``}}#f=()=>{!this.editMode&&!this.#r&&this.#p()};async#p(){let t=e=>I(this.systemLang,e),n=document.createElement(`div`);for(let[e,t]of Object.entries(S(this.theme)))n.style.setProperty(e,t);let i=n.attachShadow({mode:`open`}),a=document.createElement(`style`);a.textContent=de;let o=document.createElement(`div`),s=this.#u().showStatus;o.className=s?`dialog status`:`dialog`,i.append(a,o);let c=e(o);this.#r=()=>{let e=P(this.settings.instance);e&&c.render(/* @__PURE__ */ r(`div`,{className:`remote single`,children:/* @__PURE__ */ r(Y,{values:this.#d(e,t),options:this.#u(),pressed:this.#t,word:t,onPress:this.#s,onVolume:this.#l,rowHeight:pe})}))},this.#r();try{await this.openDialog({title:t(`fullRemote`),element:n,width:s?he:me})}finally{this.#r=null,c.unmount()}}render(){let e=this.settings,t=e=>I(this.systemLang,e),n=P(e.instance),i=n?this.states[`${n}.states.volume`]??null:null;this.#a&&(!n||i!==this.#a.state)&&this.#c(),n?this.objects[`${n}.states.on`]===null?this.#e.render(/* @__PURE__ */ r(X,{text:`${t(`notInstance`)}: ${n}`,editMode:this.editMode})):this.#e.render(/* @__PURE__ */ r(ce,{values:this.#d(n,t),options:this.#u(),pressed:this.#t,editMode:this.editMode,word:t,onPress:this.#s,onVolume:this.#l,onMore:this.#f})):this.#e.render(/* @__PURE__ */ r(X,{text:t(e.instance?`notInstance`:`chooseInstance`),editMode:this.editMode})),this.#r?.()}});