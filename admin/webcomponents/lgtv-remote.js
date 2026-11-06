import{createRoot as e,jsx as t,jsxs as n}from"../../../lib/esm/react-19.js";var r=`iob-dialog-close`;function i(e){return!!e.form}var a=[`header`,`staticText`,`divider`];function o(e,t){return e==null?``:typeof e==`object`?e[t]||e.en||Object.values(e).find(e=>!!e)||``:String(e)}function s(e){let t={};for(let[n,r]of Object.entries(e.items||{}))r&&!a.includes(r.type)&&(t[n]=r.type);return t}function c(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?e.toString():JSON.stringify(e)}function l(e,t){if(t!=null)switch(e){case`number`:case`slider`:{if(typeof t==`number`)return Number.isFinite(t)?t:void 0;let e=c(t).trim().replace(`,`,`.`);if(!e)return;let n=Number(e);return Number.isFinite(n)?n:void 0}case`checkbox`:return t===!0||t===`true`||t===1||t===`1`;default:return c(t)}}function u(e,t){let n={};for(let[r,i]of Object.entries(e)){let e=l(i,t[r]);e!==void 0&&(n[r]=e)}return n}var d=`"Roboto", "Helvetica", "Arial", sans-serif`,f=Object.freeze({type:`light`,primary:`#3399CC`,primaryContrast:`#FFFFFF`,secondary:`#164477`,secondaryContrast:`#FFFFFF`,background:`#FFFFFF`,paper:`#FFFFFF`,text:`rgba(0, 0, 0, 0.87)`,textSecondary:`rgba(0, 0, 0, 0.6)`,divider:`rgba(0, 0, 0, 0.12)`,error:`#D32F2F`,warning:`#ED6C02`,info:`#0288D1`,success:`#2E7D32`,fontFamily:d,fontSize:14,borderRadius:4}),p=Object.freeze({type:`dark`,primary:`#4DABF5`,primaryContrast:`rgba(0, 0, 0, 0.87)`,secondary:`#436A93`,secondaryContrast:`#FFFFFF`,background:`#121212`,paper:`#121212`,text:`#FFFFFF`,textSecondary:`rgba(255, 255, 255, 0.7)`,divider:`rgba(255, 255, 255, 0.12)`,error:`#F44336`,warning:`#FFA726`,info:`#29B6F6`,success:`#66BB6A`,fontFamily:d,fontSize:14,borderRadius:4}),m=[`primary`,`primaryContrast`,`secondary`,`secondaryContrast`,`background`,`paper`,`text`,`textSecondary`,`divider`,`error`,`warning`,`info`,`success`,`fontFamily`],h=[`fontSize`,`borderRadius`];function g(e){return{...e===`dark`?p:f}}function _(e){if(!e||typeof e!=`object`)return g(typeof e==`string`?e:`light`);let t=e,n=g(typeof t.type==`string`?t.type:`light`);for(let e of m){let r=t[e];typeof r==`string`&&r.trim()&&(n[e]=r.trim())}for(let e of h){let r=t[e],i=typeof r==`string`?parseFloat(r):r;typeof i==`number`&&Number.isFinite(i)&&i>=0&&(n[e]=i)}return n}function v(e,t){return e.type===t.type&&m.every(n=>e[n]===t[n])&&h.every(n=>e[n]===t[n])}function y(e){return`--iob-${e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}`}function b(e){let t={};for(let n of m)t[y(n)]=e[n];for(let n of h)t[y(n)]=`${e[n]}px`;return t[`color-scheme`]=e.type,t}var x={ok:{en:`OK`,"zh-cn":`确定`},cancel:{en:`Cancel`,de:`Abbrechen`,ru:`Отмена`,pt:`Cancelar`,nl:`Annuleren`,fr:`Annuler`,it:`Annulla`,es:`Cancelar`,pl:`Anuluj`,uk:`Скасувати`,"zh-cn":`取消`},close:{en:`Close`,de:`Schließen`,ru:`Закрыть`,pt:`Fechar`,nl:`Sluiten`,fr:`Fermer`,it:`Chiudi`,es:`Cerrar`,pl:`Zamknij`,uk:`Закрити`,"zh-cn":`关闭`}},S=`
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
`;function C(e){if(!e)return null;try{let t=Function(`data`,`return (${e});`);return e=>{try{return!!t(e)}catch{return!1}}}catch{return null}}function w(e){return typeof e==`string`?e:typeof e==`number`||typeof e==`boolean`?String(e):``}function T(e){let{input:t,setting:n}=e;if(t)return t instanceof HTMLInputElement&&t.type===`checkbox`?t.checked:t instanceof HTMLSelectElement?n.options?.[t.selectedIndex]?.value:t.value}function E(e,t,n,r,i){let a={name:t,setting:n,box:e.createElement(`div`),hidden:C(n.hidden),disabled:C(n.disabled)},s=o(n.label,i);switch(n.type){case`header`:return a.box=e.createElement(`h3`),a.box.textContent=o(n.text,i)||s,a;case`staticText`:return a.box=e.createElement(`p`),a.box.textContent=o(n.text,i)||s,a;case`divider`:return a.box=e.createElement(`hr`),a}let c=e.createElement(`label`);a.box=c;let l=e.createElement(`span`);if(l.textContent=s||t,n.type===`checkbox`){let t=e.createElement(`input`);t.type=`checkbox`,t.checked=r===!0||r===`true`,c.className=`check`,c.append(t,l),a.input=t}else if(n.type===`select`){let t=e.createElement(`select`);for(let r of n.options||[]){let n=e.createElement(`option`);n.textContent=o(r.label,i),t.append(n)}let s=(n.options||[]).findIndex(e=>String(e.value)===w(r));t.selectedIndex=s===-1?0:s,c.append(l,t),a.input=t}else if(n.type===`text`&&(n.minRows||1)>1){let t=e.createElement(`textarea`);t.rows=n.minRows||2,t.value=w(r),c.append(l,t),a.input=t}else{let t=e.createElement(`input`),i=w(r);switch(n.type){case`number`:case`slider`:t.type=n.type===`slider`?`range`:`number`,n.min!==void 0&&(t.min=String(n.min)),n.max!==void 0&&(t.max=String(n.max)),t.step=n.step===void 0?`any`:String(n.step);break;case`password`:t.type=`password`;break;case`color`:t.type=!i||/^#[0-9a-f]{6}$/i.test(i)?`color`:`text`;break;default:t.type=`text`}if(t.value=i,t.type===`range`){let n=e.createElement(`output`);n.textContent=t.value,t.addEventListener(`input`,()=>n.textContent=t.value),l.append(`: `,n)}c.append(l,t),a.input=t}if(n.help){let t=e.createElement(`span`);t.className=`help`,t.textContent=o(n.help,i),c.append(t)}return a}function D(e,t={}){let n=t.lang||`en`,a=document,c=e=>x[e][n]||x[e].en||e,l=a.createElement(`div`);l.setAttribute(`data-iob-dialog`,``);let d=l.attachShadow({mode:`open`}),f=a.createElement(`style`);f.textContent=S;let p=a.createElement(`dialog`),m=_(t.theme);p.className=m.type===`dark`?`dark`:``;for(let[e,t]of Object.entries(b(m)))p.style.setProperty(e,t);e.width&&(p.style.width=`${e.width}px`),e.height&&(p.style.height=`${e.height}px`);let h=a.createElement(`form`),g=a.createElement(`header`),v=a.createElement(`span`);v.textContent=o(e.title,n);let y=a.createElement(`button`);y.type=`button`,y.className=`close`,y.title=c(`close`),y.setAttribute(`aria-label`,c(`close`)),y.textContent=`×`,g.append(v,y);let C=a.createElement(`div`);return C.className=`body`,h.append(g,C),p.append(h),d.append(f,p),new Promise(t=>{let f=!1,m=e=>{f||(f=!0,p.open&&p.close(),l.remove(),t(e))};if(y.addEventListener(`click`,()=>m(null)),p.addEventListener(`close`,()=>m(null)),h.addEventListener(`submit`,e=>e.preventDefault()),i(e)){let t={},r=[];for(let[t,i]of Object.entries(e.form.items||{})){let o=e.data?.[t]??i.default,s=E(a,t,i,o,n);r.push(s),C.append(s.box)}let i=()=>{for(let e of r)e.input&&(t[e.name]=T(e));return t},l=()=>{let e=i();for(let t of r)t.box.hidden=t.hidden?t.hidden(e):!1,t.input&&(t.input.disabled=t.disabled?t.disabled(e):!1)};h.addEventListener(`input`,l),h.addEventListener(`change`,l),l();let d=r.find(e=>e.input&&!e.box.hidden&&!e.input.disabled);d?.input&&(d.input.autofocus=!0);let f=a.createElement(`footer`),p=a.createElement(`button`);p.type=`button`,p.textContent=o(e.cancel,n)||c(`cancel`),p.addEventListener(`click`,()=>m(null));let g=a.createElement(`button`);g.type=`submit`,g.className=`primary`,g.textContent=o(e.ok,n)||c(`ok`),f.append(p,g),h.append(f),h.addEventListener(`submit`,()=>m(u(s(e.form),i())))}else C.append(e.element),p.addEventListener(r,e=>m(e.detail??null));a.body.append(l),p.showModal(),d.activeElement&&d.activeElement!==y||(p.tabIndex=-1,p.focus())})}function O(e){return[...new Set(e.filter(e=>typeof e==`string`&&!!e))]}var k=[`socket`,`dialogs`,`theme`,`editMode`,`settings`,`value`],A=class extends HTMLElement{states={};objects={};#e=null;#t={};#n=_(`light`);#r=!1;#i=null;#a=void 0;#o=null;#s=!1;#c=(e,t)=>{this.#o?.states.includes(e)&&(this.states[e]=t||null,this.#_())};#l=(e,t)=>{this.#o?.objects.includes(e)&&(this.objects[e]=t||null,this.#d())};get socket(){return this.#e}set socket(e){this.#e=e||null,this.#d()}get settings(){return this.#t}set settings(e){this.#t=e||{},this.#d()}get theme(){return this.#n}set theme(e){let t=_(e);v(t,this.#n)||(this.#n=t,this.#u(),this.#_())}get editMode(){return this.#r}set editMode(e){let t=!!e;t!==this.#r&&(this.#r=t,this.#_())}get dialogs(){return this.#i}set dialogs(e){this.#i=e||null}get value(){return this.#a}set value(e){e!==this.#a&&(this.#a=e,this.#_())}connectedCallback(){for(let e of k)if(Object.prototype.hasOwnProperty.call(this,e)){let t=this[e];delete this[e],this[e]=t}this.#u(),this.#d()}disconnectedCallback(){this.#g()}getStateIds(e){return[]}getObjectIds(e){return[]}get systemLang(){return this.#e?.systemLang||`en`}text(e){return o(e,this.systemLang)}setState(e,t){return this.#e&&!this.#r?this.#e.setState(e,t):Promise.resolve()}changeValue(e){return this.#r||this.emit(`iob-change`,e)?!1:(this.value=e,!0)}emit(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0,cancelable:!0}))}async openDialog(e){if(this.#r)return null;let t=this.#i?await this.#i.open(e):await D(e,{lang:this.systemLang,theme:this.#n});return i(e)?t&&typeof t==`object`?u(s(e.form),t):null:t??null}#u(){for(let[e,t]of Object.entries(b(this.#n)))this.style.setProperty(e,t)}#d(){if(!this.isConnected)return;let e=this.#e,t=e?O(this.getStateIds(this.#t)):[],n=e?O(this.getObjectIds(this.#t)):[];this.#o&&this.#o.socket!==e&&this.#g();let r=this.#o?.states||[],i=this.#o?.objects||[],a=r.filter(e=>!t.includes(e)),o=i.filter(e=>!n.includes(e)),s=t.filter(e=>!r.includes(e)),c=n.filter(e=>!i.includes(e));e&&a.length&&e.unsubscribeState(a,this.#c),e&&o.length&&this.#h(e,o);for(let e of a)delete this.states[e];for(let e of[...a,...o])!t.includes(e)&&!n.includes(e)&&delete this.objects[e];this.#o=e&&(t.length||n.length)?{socket:e,states:t,objects:n}:null,e&&s.length&&this.#p(e,s),e&&c.length&&this.#m(e,c),this.#_()}#f(e,t,n){return this.#o?.socket===e&&this.#o[t].includes(n)}#p(e,t){e.subscribeState(t,this.#c).catch(e=>console.warn(`<${this.localName}>: cannot subscribe ${t.join(`, `)}: ${e}`));for(let n of t)e.getState(n).then(t=>{this.#f(e,`states`,n)&&this.states[n]===void 0&&(this.states[n]=t||null,this.#_())}).catch(()=>{}),e.getObject(n).then(t=>{this.#f(e,`states`,n)&&!this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#_())}).catch(()=>{})}#m(e,t){e.subscribeObject(t,this.#l).catch(e=>console.warn(`<${this.localName}>: cannot subscribe the objects ${t.join(`, `)}: ${e}`));for(let n of t)e.getObject(n).then(t=>{this.#f(e,`objects`,n)&&(this.objects[n]=t||null,this.#d())}).catch(()=>{})}#h(e,t){e.unsubscribeObject(t,this.#l).catch(()=>{})}#g(){if(this.#o){let{socket:e,states:t,objects:n}=this.#o;t.length&&e.unsubscribeState(t,this.#c),n.length&&this.#h(e,n),this.#o=null}this.states={},this.objects={}}#_(){this.#s||(this.#s=!0,queueMicrotask(()=>{this.#s=!1,this.isConnected&&this.render()}))}};function j(e,t){let n=typeof e==`string`?e:e.tag;customElements.get(n)||customElements.define(n,t)}var M=`iob-lgtv-remote`,N=[`on`,`volume`,`mute`,`currentApp`];function P(e){let t=(e||``).trim().match(/^(?:system\.adapter\.)?(lgtv\.\d+)$/);return t?t[1]:null}var F={chooseInstance:`Choose an LG TV instance in the settings`,notInstance:`Not an instance of the lgtv adapter`,fullRemote:`Full remote`,red:`Red`,green:`Green`,yellow:`Yellow`,blue:`Blue`,dash:`Dash`,flashback:`Previous channel`},I={en:F,de:{chooseInstance:`LG-TV-Instanz in den Einstellungen wählen`,notInstance:`Keine Instanz des lgtv-Adapters`,fullRemote:`Ganze Fernbedienung`,red:`Rot`,green:`Grün`,yellow:`Gelb`,blue:`Blau`,dash:`Strich`,flashback:`Vorheriger Kanal`},ru:{chooseInstance:`Выберите экземпляр LG TV в настройках`,notInstance:`Это не экземпляр адаптера lgtv`,fullRemote:`Полный пульт`,red:`Красная`,green:`Зелёная`,yellow:`Жёлтая`,blue:`Синяя`,dash:`Тире`,flashback:`Предыдущий канал`},pt:{chooseInstance:`Escolha uma instância de LG TV nas configurações`,notInstance:`Não é uma instância do adaptador lgtv`,fullRemote:`Comando completo`,red:`Vermelho`,green:`Verde`,yellow:`Amarelo`,blue:`Azul`,dash:`Traço`,flashback:`Canal anterior`},nl:{chooseInstance:`Kies een LG TV-instantie in de instellingen`,notInstance:`Geen instantie van de lgtv-adapter`,fullRemote:`Volledige afstandsbediening`,red:`Rood`,green:`Groen`,yellow:`Geel`,blue:`Blauw`,dash:`Streepje`,flashback:`Vorige zender`},fr:{chooseInstance:`Choisissez une instance LG TV dans les paramètres`,notInstance:`Pas une instance de l'adaptateur lgtv`,fullRemote:`Télécommande complète`,red:`Rouge`,green:`Vert`,yellow:`Jaune`,blue:`Bleu`,dash:`Tiret`,flashback:`Chaîne précédente`},it:{chooseInstance:`Scegli un'istanza LG TV nelle impostazioni`,notInstance:`Non è un'istanza dell'adattatore lgtv`,fullRemote:`Telecomando completo`,red:`Rosso`,green:`Verde`,yellow:`Giallo`,blue:`Blu`,dash:`Trattino`,flashback:`Canale precedente`},es:{chooseInstance:`Elija una instancia de LG TV en la configuración`,notInstance:`No es una instancia del adaptador lgtv`,fullRemote:`Mando completo`,red:`Rojo`,green:`Verde`,yellow:`Amarillo`,blue:`Azul`,dash:`Guion`,flashback:`Canal anterior`},pl:{chooseInstance:`Wybierz instancję LG TV w ustawieniach`,notInstance:`To nie jest instancja adaptera lgtv`,fullRemote:`Pełny pilot`,red:`Czerwony`,green:`Zielony`,yellow:`Żółty`,blue:`Niebieski`,dash:`Myślnik`,flashback:`Poprzedni kanał`},uk:{chooseInstance:`Виберіть екземпляр LG TV у налаштуваннях`,notInstance:`Це не екземпляр адаптера lgtv`,fullRemote:`Повний пульт`,red:`Червона`,green:`Зелена`,yellow:`Жовта`,blue:`Синя`,dash:`Тире`,flashback:`Попередній канал`},"zh-cn":{chooseInstance:`请在设置中选择 LG TV 实例`,notInstance:`不是 lgtv 适配器的实例`,fullRemote:`完整遥控器`,red:`红色`,green:`绿色`,yellow:`黄色`,blue:`蓝色`,dash:`短横线`,flashback:`上一个频道`}};function L(e,t){if(t in F){let n=t;return I[e]?.[n]||F[n]}let n=t;return{en:{title:`LG TV`,power:`Power`,up:`Up`,down:`Down`,left:`Left`,right:`Right`,ok:`OK`,back:`Back`,home:`Home`,menu:`Menu`,exit:`Exit`,info:`Info`,volumeUp:`Volume up`,volumeDown:`Volume down`,mute:`Mute`,channelUp:`Channel up`,channelDown:`Channel down`,play:`Play`,pause:`Pause`,stop:`Stop`,rewind:`Rewind`,fastForward:`Fast forward`,list:`Channel list`,qmenu:`Quick menu`,myApps:`My apps`,muted:`muted`,online:`On`,offline:`Off`,unknown:`Unknown`},de:{title:`LG TV`,power:`Ein/Aus`,up:`Hoch`,down:`Runter`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Zurück`,home:`Home`,menu:`Menü`,exit:`Beenden`,info:`Info`,volumeUp:`Lauter`,volumeDown:`Leiser`,mute:`Stumm`,channelUp:`Kanal +`,channelDown:`Kanal −`,play:`Wiedergabe`,pause:`Pause`,stop:`Stopp`,rewind:`Zurückspulen`,fastForward:`Vorspulen`,list:`Kanalliste`,qmenu:`Schnellmenü`,myApps:`Meine Apps`,muted:`stumm`,online:`An`,offline:`Aus`,unknown:`Unbekannt`},ru:{title:`LG TV`,power:`Питание`,up:`Вверх`,down:`Вниз`,left:`Влево`,right:`Вправо`,ok:`OK`,back:`Назад`,home:`Домой`,menu:`Меню`,exit:`Выход`,info:`Инфо`,volumeUp:`Громче`,volumeDown:`Тише`,mute:`Без звука`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Воспроизведение`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотка назад`,fastForward:`Перемотка вперёд`,list:`Список каналов`,qmenu:`Быстрое меню`,myApps:`Мои приложения`,muted:`без звука`,online:`Вкл`,offline:`Выкл`,unknown:`Неизвестно`},pt:{title:`LG TV`,power:`Ligar/Desligar`,up:`Cima`,down:`Baixo`,left:`Esquerda`,right:`Direita`,ok:`OK`,back:`Voltar`,home:`Início`,menu:`Menu`,exit:`Sair`,info:`Info`,volumeUp:`Aumentar volume`,volumeDown:`Diminuir volume`,mute:`Silenciar`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproduzir`,pause:`Pausa`,stop:`Parar`,rewind:`Retroceder`,fastForward:`Avançar`,list:`Lista de canais`,qmenu:`Menu rápido`,myApps:`As minhas apps`,muted:`silenciado`,online:`Ligado`,offline:`Desligado`,unknown:`Desconhecido`},nl:{title:`LG TV`,power:`Aan/uit`,up:`Omhoog`,down:`Omlaag`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Terug`,home:`Home`,menu:`Menu`,exit:`Afsluiten`,info:`Info`,volumeUp:`Volume omhoog`,volumeDown:`Volume omlaag`,mute:`Dempen`,channelUp:`Kanaal +`,channelDown:`Kanaal −`,play:`Afspelen`,pause:`Pauze`,stop:`Stoppen`,rewind:`Terugspoelen`,fastForward:`Vooruitspoelen`,list:`Kanalenlijst`,qmenu:`Snelmenu`,myApps:`Mijn apps`,muted:`gedempt`,online:`Aan`,offline:`Uit`,unknown:`Onbekend`},fr:{title:`LG TV`,power:`Marche/Arrêt`,up:`Haut`,down:`Bas`,left:`Gauche`,right:`Droite`,ok:`OK`,back:`Retour`,home:`Accueil`,menu:`Menu`,exit:`Quitter`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muet`,channelUp:`Chaîne +`,channelDown:`Chaîne −`,play:`Lecture`,pause:`Pause`,stop:`Arrêt`,rewind:`Retour rapide`,fastForward:`Avance rapide`,list:`Liste des chaînes`,qmenu:`Menu rapide`,myApps:`Mes applis`,muted:`muet`,online:`Allumé`,offline:`Éteint`,unknown:`Inconnu`},it:{title:`LG TV`,power:`Accensione`,up:`Su`,down:`Giù`,left:`Sinistra`,right:`Destra`,ok:`OK`,back:`Indietro`,home:`Home`,menu:`Menu`,exit:`Esci`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muto`,channelUp:`Canale +`,channelDown:`Canale −`,play:`Riproduci`,pause:`Pausa`,stop:`Stop`,rewind:`Riavvolgi`,fastForward:`Avanti veloce`,list:`Elenco canali`,qmenu:`Menu rapido`,myApps:`Le mie app`,muted:`muto`,online:`Acceso`,offline:`Spento`,unknown:`Sconosciuto`},es:{title:`LG TV`,power:`Encendido`,up:`Arriba`,down:`Abajo`,left:`Izquierda`,right:`Derecha`,ok:`OK`,back:`Atrás`,home:`Inicio`,menu:`Menú`,exit:`Salir`,info:`Info`,volumeUp:`Subir volumen`,volumeDown:`Bajar volumen`,mute:`Silencio`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproducir`,pause:`Pausa`,stop:`Detener`,rewind:`Rebobinar`,fastForward:`Avance rápido`,list:`Lista de canales`,qmenu:`Menú rápido`,myApps:`Mis aplicaciones`,muted:`silenciado`,online:`Encendido`,offline:`Apagado`,unknown:`Desconocido`},pl:{title:`LG TV`,power:`Zasilanie`,up:`Góra`,down:`Dół`,left:`Lewo`,right:`Prawo`,ok:`OK`,back:`Wstecz`,home:`Ekran główny`,menu:`Menu`,exit:`Wyjście`,info:`Info`,volumeUp:`Głośniej`,volumeDown:`Ciszej`,mute:`Wyciszenie`,channelUp:`Kanał +`,channelDown:`Kanał −`,play:`Odtwarzaj`,pause:`Pauza`,stop:`Stop`,rewind:`Przewiń do tyłu`,fastForward:`Przewiń do przodu`,list:`Lista kanałów`,qmenu:`Szybkie menu`,myApps:`Moje aplikacje`,muted:`wyciszony`,online:`Wł`,offline:`Wył`,unknown:`Nieznany`},uk:{title:`LG TV`,power:`Живлення`,up:`Вгору`,down:`Вниз`,left:`Ліворуч`,right:`Праворуч`,ok:`OK`,back:`Назад`,home:`Головна`,menu:`Меню`,exit:`Вихід`,info:`Інфо`,volumeUp:`Гучніше`,volumeDown:`Тихіше`,mute:`Без звуку`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Відтворити`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотати назад`,fastForward:`Перемотати вперед`,list:`Список каналів`,qmenu:`Швидке меню`,myApps:`Мої додатки`,muted:`без звуку`,online:`Увімк`,offline:`Вимк`,unknown:`Невідомо`},"zh-cn":{title:`LG 电视`,power:`电源`,up:`上`,down:`下`,left:`左`,right:`右`,ok:`确定`,back:`返回`,home:`主页`,menu:`菜单`,exit:`退出`,info:`信息`,volumeUp:`音量+`,volumeDown:`音量−`,mute:`静音`,channelUp:`频道+`,channelDown:`频道−`,play:`播放`,pause:`暂停`,stop:`停止`,rewind:`快退`,fastForward:`快进`,list:`频道列表`,qmenu:`快捷菜单`,myApps:`我的应用`,muted:`已静音`,online:`开`,offline:`关`,unknown:`未知`}}[e]?.[n]||{en:{title:`LG TV`,power:`Power`,up:`Up`,down:`Down`,left:`Left`,right:`Right`,ok:`OK`,back:`Back`,home:`Home`,menu:`Menu`,exit:`Exit`,info:`Info`,volumeUp:`Volume up`,volumeDown:`Volume down`,mute:`Mute`,channelUp:`Channel up`,channelDown:`Channel down`,play:`Play`,pause:`Pause`,stop:`Stop`,rewind:`Rewind`,fastForward:`Fast forward`,list:`Channel list`,qmenu:`Quick menu`,myApps:`My apps`,muted:`muted`,online:`On`,offline:`Off`,unknown:`Unknown`},de:{title:`LG TV`,power:`Ein/Aus`,up:`Hoch`,down:`Runter`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Zurück`,home:`Home`,menu:`Menü`,exit:`Beenden`,info:`Info`,volumeUp:`Lauter`,volumeDown:`Leiser`,mute:`Stumm`,channelUp:`Kanal +`,channelDown:`Kanal −`,play:`Wiedergabe`,pause:`Pause`,stop:`Stopp`,rewind:`Zurückspulen`,fastForward:`Vorspulen`,list:`Kanalliste`,qmenu:`Schnellmenü`,myApps:`Meine Apps`,muted:`stumm`,online:`An`,offline:`Aus`,unknown:`Unbekannt`},ru:{title:`LG TV`,power:`Питание`,up:`Вверх`,down:`Вниз`,left:`Влево`,right:`Вправо`,ok:`OK`,back:`Назад`,home:`Домой`,menu:`Меню`,exit:`Выход`,info:`Инфо`,volumeUp:`Громче`,volumeDown:`Тише`,mute:`Без звука`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Воспроизведение`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотка назад`,fastForward:`Перемотка вперёд`,list:`Список каналов`,qmenu:`Быстрое меню`,myApps:`Мои приложения`,muted:`без звука`,online:`Вкл`,offline:`Выкл`,unknown:`Неизвестно`},pt:{title:`LG TV`,power:`Ligar/Desligar`,up:`Cima`,down:`Baixo`,left:`Esquerda`,right:`Direita`,ok:`OK`,back:`Voltar`,home:`Início`,menu:`Menu`,exit:`Sair`,info:`Info`,volumeUp:`Aumentar volume`,volumeDown:`Diminuir volume`,mute:`Silenciar`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproduzir`,pause:`Pausa`,stop:`Parar`,rewind:`Retroceder`,fastForward:`Avançar`,list:`Lista de canais`,qmenu:`Menu rápido`,myApps:`As minhas apps`,muted:`silenciado`,online:`Ligado`,offline:`Desligado`,unknown:`Desconhecido`},nl:{title:`LG TV`,power:`Aan/uit`,up:`Omhoog`,down:`Omlaag`,left:`Links`,right:`Rechts`,ok:`OK`,back:`Terug`,home:`Home`,menu:`Menu`,exit:`Afsluiten`,info:`Info`,volumeUp:`Volume omhoog`,volumeDown:`Volume omlaag`,mute:`Dempen`,channelUp:`Kanaal +`,channelDown:`Kanaal −`,play:`Afspelen`,pause:`Pauze`,stop:`Stoppen`,rewind:`Terugspoelen`,fastForward:`Vooruitspoelen`,list:`Kanalenlijst`,qmenu:`Snelmenu`,myApps:`Mijn apps`,muted:`gedempt`,online:`Aan`,offline:`Uit`,unknown:`Onbekend`},fr:{title:`LG TV`,power:`Marche/Arrêt`,up:`Haut`,down:`Bas`,left:`Gauche`,right:`Droite`,ok:`OK`,back:`Retour`,home:`Accueil`,menu:`Menu`,exit:`Quitter`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muet`,channelUp:`Chaîne +`,channelDown:`Chaîne −`,play:`Lecture`,pause:`Pause`,stop:`Arrêt`,rewind:`Retour rapide`,fastForward:`Avance rapide`,list:`Liste des chaînes`,qmenu:`Menu rapide`,myApps:`Mes applis`,muted:`muet`,online:`Allumé`,offline:`Éteint`,unknown:`Inconnu`},it:{title:`LG TV`,power:`Accensione`,up:`Su`,down:`Giù`,left:`Sinistra`,right:`Destra`,ok:`OK`,back:`Indietro`,home:`Home`,menu:`Menu`,exit:`Esci`,info:`Info`,volumeUp:`Volume +`,volumeDown:`Volume −`,mute:`Muto`,channelUp:`Canale +`,channelDown:`Canale −`,play:`Riproduci`,pause:`Pausa`,stop:`Stop`,rewind:`Riavvolgi`,fastForward:`Avanti veloce`,list:`Elenco canali`,qmenu:`Menu rapido`,myApps:`Le mie app`,muted:`muto`,online:`Acceso`,offline:`Spento`,unknown:`Sconosciuto`},es:{title:`LG TV`,power:`Encendido`,up:`Arriba`,down:`Abajo`,left:`Izquierda`,right:`Derecha`,ok:`OK`,back:`Atrás`,home:`Inicio`,menu:`Menú`,exit:`Salir`,info:`Info`,volumeUp:`Subir volumen`,volumeDown:`Bajar volumen`,mute:`Silencio`,channelUp:`Canal +`,channelDown:`Canal −`,play:`Reproducir`,pause:`Pausa`,stop:`Detener`,rewind:`Rebobinar`,fastForward:`Avance rápido`,list:`Lista de canales`,qmenu:`Menú rápido`,myApps:`Mis aplicaciones`,muted:`silenciado`,online:`Encendido`,offline:`Apagado`,unknown:`Desconocido`},pl:{title:`LG TV`,power:`Zasilanie`,up:`Góra`,down:`Dół`,left:`Lewo`,right:`Prawo`,ok:`OK`,back:`Wstecz`,home:`Ekran główny`,menu:`Menu`,exit:`Wyjście`,info:`Info`,volumeUp:`Głośniej`,volumeDown:`Ciszej`,mute:`Wyciszenie`,channelUp:`Kanał +`,channelDown:`Kanał −`,play:`Odtwarzaj`,pause:`Pauza`,stop:`Stop`,rewind:`Przewiń do tyłu`,fastForward:`Przewiń do przodu`,list:`Lista kanałów`,qmenu:`Szybkie menu`,myApps:`Moje aplikacje`,muted:`wyciszony`,online:`Wł`,offline:`Wył`,unknown:`Nieznany`},uk:{title:`LG TV`,power:`Живлення`,up:`Вгору`,down:`Вниз`,left:`Ліворуч`,right:`Праворуч`,ok:`OK`,back:`Назад`,home:`Головна`,menu:`Меню`,exit:`Вихід`,info:`Інфо`,volumeUp:`Гучніше`,volumeDown:`Тихіше`,mute:`Без звуку`,channelUp:`Канал +`,channelDown:`Канал −`,play:`Відтворити`,pause:`Пауза`,stop:`Стоп`,rewind:`Перемотати назад`,fastForward:`Перемотати вперед`,list:`Список каналів`,qmenu:`Швидке меню`,myApps:`Мої додатки`,muted:`без звуку`,online:`Увімк`,offline:`Вимк`,unknown:`Невідомо`},"zh-cn":{title:`LG 电视`,power:`电源`,up:`上`,down:`下`,left:`左`,right:`右`,ok:`确定`,back:`返回`,home:`主页`,menu:`菜单`,exit:`退出`,info:`信息`,volumeUp:`音量+`,volumeDown:`音量−`,mute:`静音`,channelUp:`频道+`,channelDown:`频道−`,play:`播放`,pause:`暂停`,stop:`停止`,rewind:`快退`,fastForward:`快进`,list:`频道列表`,qmenu:`快捷菜单`,myApps:`我的应用`,muted:`已静音`,online:`开`,offline:`关`,unknown:`未知`}}.en[n]}var R=[{key:`red`,color:`#d5342d`},{key:`green`,color:`#2e9b4f`},{key:`yellow`,color:`#e0b42c`},{key:`blue`,color:`#2f6fd0`}],z=[`1`,`2`,`3`,`4`,`5`,`6`,`7`,`8`,`9`,`dash`,`0`,`flashback`],B={dash:`–`,flashback:`↺`};function V({id:e,label:n,title:r,pressed:i,onPress:a,className:o,style:s}){let c=[`key`];return o&&c.push(o),i===e&&c.push(`pressed`),/* @__PURE__ */ t(`button`,{type:`button`,className:c.join(` `),title:r,"aria-label":r,style:s,onClick:()=>a(e),children:/* @__PURE__ */ t(`span`,{"aria-hidden":`true`,children:n})})}function H({cols:e,children:n}){return/* @__PURE__ */ t(`div`,{className:`row`,style:{"--cols":e},children:n})}function U(e,t){let n=[],{volume:r,muted:i,app:a}=e;return r!==null&&Number.isFinite(r)?n.push(i?`${r} (${t(`muted`)})`:String(r)):i&&n.push(t(`muted`)),a&&n.push(a),n.join(` · `)}function W({values:e,options:r,word:i,onMore:a}){let o=r.showStatus?U(e,i):``,{on:s}=e;return/* @__PURE__ */ n(`div`,{className:`head`,children:[/* @__PURE__ */ n(`div`,{className:`titles`,children:[/* @__PURE__ */ t(`div`,{className:`name`,children:e.name}),o?/* @__PURE__ */ t(`div`,{className:`status`,children:o}):null]}),/* @__PURE__ */ t(`span`,{className:`dot${s===null?``:s?` on`:` off`}`,title:i(s===null?`unknown`:s?`online`:`offline`)}),a?/* @__PURE__ */ t(`button`,{type:`button`,className:`more`,title:i(`fullRemote`),"aria-label":i(`fullRemote`),onClick:a,children:`⋯`}):null]})}function G({values:e,pressed:n,word:r,onPress:i}){return/* @__PURE__ */ t(V,{id:`power`,label:`⏻`,title:r(`power`),className:e.on?`power on`:`power`,pressed:n,onPress:i})}function K(e){let t=6;return e.showMedia&&t++,e.showColorKeys&&t++,e.showNumpad&&(t+=4),t}function q(e){let{options:r,pressed:i,word:a,onPress:o,rowHeight:s}=e,c=K(r),l=(e,n,r,s)=>/* @__PURE__ */ t(V,{id:e,label:n,title:a(r),className:s,pressed:i,onPress:o},e),u=s?`${s}px`:`minmax(24px, 56px)`;return/* @__PURE__ */ n(`div`,{className:`view full`,style:{gridTemplateRows:`auto repeat(${c}, ${u})`},children:[/* @__PURE__ */ t(W,{...e}),/* @__PURE__ */ n(H,{cols:4,children:[/* @__PURE__ */ t(G,{...e}),l(`list`,`≡`,`list`),l(`qmenu`,`Q`,`qmenu`),l(`myApps`,`⊞`,`myApps`)]}),/* @__PURE__ */ n(`div`,{className:`dpad`,children:[/* @__PURE__ */ t(`span`,{}),l(`up`,`▲`,`up`),/* @__PURE__ */ t(`span`,{}),l(`left`,`◀`,`left`),l(`enter`,`OK`,`ok`,`text`),l(`right`,`▶`,`right`),/* @__PURE__ */ t(`span`,{}),l(`down`,`▼`,`down`),/* @__PURE__ */ t(`span`,{})]}),/* @__PURE__ */ n(H,{cols:4,children:[l(`back`,`↩`,`back`),l(`home`,`⌂`,`home`),l(`menu`,`☰`,`menu`),l(`exit`,`✕`,`exit`)]}),/* @__PURE__ */ n(H,{cols:r.showChannel?6:3,children:[l(`volumeUp`,`+`,`volumeUp`),l(`mute`,`Ø`,`mute`),l(`volumeDown`,`−`,`volumeDown`),r.showChannel?[l(`channelUp`,`CH+`,`channelUp`,`text`),l(`info`,`ℹ`,`info`),l(`channelDown`,`CH−`,`channelDown`,`text`)]:null]}),r.showMedia?/* @__PURE__ */ n(H,{cols:5,children:[l(`rewind`,`«`,`rewind`),l(`play`,`▶`,`play`),l(`pause`,`⏸`,`pause`),l(`stop`,`■`,`stop`),l(`fastForward`,`»`,`fastForward`)]}):null,r.showColorKeys?/* @__PURE__ */ t(H,{cols:4,children:R.map(({key:e,color:n})=>/* @__PURE__ */ t(V,{id:e,label:``,title:a(e),className:`color`,style:{"--key-color":n},pressed:i,onPress:o},e))}):null,r.showNumpad?/* @__PURE__ */ t(`div`,{className:`numpad`,children:z.map(e=>/* @__PURE__ */ t(V,{id:e,label:B[e]??e,title:e===`dash`||e===`flashback`?a(e):e,pressed:i,onPress:o},e))}):null]})}function J(e){let{pressed:r,word:i,onPress:a}=e;return/* @__PURE__ */ n(`div`,{className:`view compact`,children:[/* @__PURE__ */ t(W,{...e}),/* @__PURE__ */ n(`div`,{className:`keys`,children:[/* @__PURE__ */ t(G,{...e}),/* @__PURE__ */ t(V,{id:`volumeUp`,label:`+`,title:i(`volumeUp`),pressed:r,onPress:a}),/* @__PURE__ */ t(V,{id:`volumeDown`,label:`−`,title:i(`volumeDown`),pressed:r,onPress:a}),/* @__PURE__ */ t(V,{id:`home`,label:`⌂`,title:i(`home`),pressed:r,onPress:a}),/* @__PURE__ */ t(V,{id:`enter`,label:`OK`,title:i(`ok`),className:`text`,pressed:r,onPress:a}),/* @__PURE__ */ t(V,{id:`mute`,label:`Ø`,title:i(`mute`),pressed:r,onPress:a})]})]})}function Y(e){let{pressed:r,word:i,onPress:a}=e;return/* @__PURE__ */ n(`div`,{className:`view strip`,children:[/* @__PURE__ */ t(W,{...e}),/* @__PURE__ */ n(`div`,{className:`keys`,children:[/* @__PURE__ */ t(G,{...e}),/* @__PURE__ */ t(V,{id:`volumeDown`,label:`−`,title:i(`volumeDown`),pressed:r,onPress:a}),/* @__PURE__ */ t(V,{id:`mute`,label:`Ø`,title:i(`mute`),pressed:r,onPress:a}),/* @__PURE__ */ t(V,{id:`volumeUp`,label:`+`,title:i(`volumeUp`),pressed:r,onPress:a}),/* @__PURE__ */ t(V,{id:`home`,label:`⌂`,title:i(`home`),pressed:r,onPress:a})]})]})}function X(e){let{editMode:r,onMore:i,...a}=e;return/* @__PURE__ */ n(`div`,{className:`remote auto${r?` edit`:``}`,children:[/* @__PURE__ */ t(q,{...a}),/* @__PURE__ */ t(J,{...a,onMore:i}),/* @__PURE__ */ t(Y,{...a,onMore:i})]})}var Z=`M15 9H9c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V10c0-.55-.45-1-1-1m-3 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2M7.05 6.05l1.41 1.41C9.37 6.56 10.62 6 12 6s2.63.56 3.54 1.46l1.41-1.41C15.68 4.78 13.93 4 12 4s-3.68.78-4.95 2.05M12 0C8.96 0 6.21 1.23 4.22 3.22l1.41 1.41C7.26 3.01 9.51 2 12 2s4.74 1.01 6.36 2.64l1.41-1.41C17.79 1.23 15.04 0 12 0`;function Q({text:e,editMode:r}){return/* @__PURE__ */ n(`div`,{className:`hint${r?` edit`:``}`,children:[/* @__PURE__ */ t(`svg`,{viewBox:`0 0 24 24`,"aria-hidden":`true`,children:/* @__PURE__ */ t(`path`,{d:Z})}),/* @__PURE__ */ t(`span`,{children:e})]})}var $=`
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
`,ee=`
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
`,te=`
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
`,ne=180,re=46;j(M,class extends A{#e;#t=null;#n=null;#r=null;constructor(){super();let t=this.attachShadow({mode:`open`}),n=document.createElement(`style`);n.textContent=ee;let r=document.createElement(`div`);r.className=`mount`,t.append(n,r),this.#e=e(r)}disconnectedCallback(){super.disconnectedCallback(),this.#n&&=(clearTimeout(this.#n),null),this.#t=null}getStateIds(e){let t=P(e.instance);return t?N.map(e=>`${t}.states.${e}`):[]}#i=e=>{let t=P(this.settings.instance);!this.editMode&&t&&(this.setState(`${t}.remote.${e}`,!0),this.#t=e,this.#n&&clearTimeout(this.#n),this.#n=setTimeout(()=>{this.#n=null,this.#t=null,this.render()},ne),this.render())};#a(){let e=this.settings;return{showStatus:e.showStatus!==!1,showChannel:e.showChannel!==!1,showMedia:e.showMedia!==!1,showColorKeys:e.showColorKeys!==!1,showNumpad:e.showNumpad===!0}}#o(e,t){let n=t=>this.states[`${e}.states.${t}`]?.val,r=n(`on`),i=n(`volume`),a=n(`mute`),o=n(`currentApp`);return{name:this.settings.name||t(`title`),on:r==null?null:!!r,volume:i==null||i===``?null:Number(i),muted:a==null?null:!!a,app:o&&String(o).split(`.`).pop()||``}}#s=()=>{!this.editMode&&!this.#r&&this.#c()};async#c(){let n=e=>L(this.systemLang,e),r=document.createElement(`div`);for(let[e,t]of Object.entries(b(this.theme)))r.style.setProperty(e,t);let i=r.attachShadow({mode:`open`}),a=document.createElement(`style`);a.textContent=te;let o=document.createElement(`div`);o.className=`dialog`,i.append(a,o);let s=e(o);this.#r=()=>{let e=P(this.settings.instance);e&&s.render(/* @__PURE__ */ t(`div`,{className:`remote single`,children:/* @__PURE__ */ t(q,{values:this.#o(e,n),options:this.#a(),pressed:this.#t,word:n,onPress:this.#i,rowHeight:re})}))},this.#r();try{await this.openDialog({title:n(`fullRemote`),element:r,width:360})}finally{this.#r=null,s.unmount()}}render(){let e=this.settings,n=e=>L(this.systemLang,e),r=P(e.instance);r?this.objects[`${r}.states.on`]===null?this.#e.render(/* @__PURE__ */ t(Q,{text:`${n(`notInstance`)}: ${r}`,editMode:this.editMode})):this.#e.render(/* @__PURE__ */ t(X,{values:this.#o(r,n),options:this.#a(),pressed:this.#t,editMode:this.editMode,word:n,onPress:this.#i,onMore:this.#s})):this.#e.render(/* @__PURE__ */ t(Q,{text:n(e.instance?`notInstance`:`chooseInstance`),editMode:this.editMode})),this.#r?.()}});