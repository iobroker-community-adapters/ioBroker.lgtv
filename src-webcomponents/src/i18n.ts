/**
 * The words the element shows, in the languages of ioBroker.
 *
 * Most of them are the words of the devices widget (`DEVICE_WORDS`): the build picks them out of
 * `src-devices/src/i18n/` and puts them in as `__LGTV_WORDS__` (`vite.config.ts`). Only the words the devices widget
 * does not show live here.
 */
import type { DeviceWordKey } from './constants';

/** The words of the devices widget, by language - filled in by the build */
declare const __LGTV_WORDS__: Record<string, Record<DeviceWordKey, string>>;

const EN = {
    chooseInstance: 'Choose an LG TV instance in the settings',
    notInstance: 'Not an instance of the lgtv adapter',
    fullRemote: 'Full remote',
    red: 'Red',
    green: 'Green',
    yellow: 'Yellow',
    blue: 'Blue',
    dash: 'Dash',
    flashback: 'Previous channel',
};

type OwnWordKey = keyof typeof EN;

export type WordKey = OwnWordKey | DeviceWordKey;

const WORDS: Record<string, Record<OwnWordKey, string>> = {
    en: EN,
    de: {
        chooseInstance: 'LG-TV-Instanz in den Einstellungen wählen',
        notInstance: 'Keine Instanz des lgtv-Adapters',
        fullRemote: 'Ganze Fernbedienung',
        red: 'Rot',
        green: 'Grün',
        yellow: 'Gelb',
        blue: 'Blau',
        dash: 'Strich',
        flashback: 'Vorheriger Kanal',
    },
    ru: {
        chooseInstance: 'Выберите экземпляр LG TV в настройках',
        notInstance: 'Это не экземпляр адаптера lgtv',
        fullRemote: 'Полный пульт',
        red: 'Красная',
        green: 'Зелёная',
        yellow: 'Жёлтая',
        blue: 'Синяя',
        dash: 'Тире',
        flashback: 'Предыдущий канал',
    },
    pt: {
        chooseInstance: 'Escolha uma instância de LG TV nas configurações',
        notInstance: 'Não é uma instância do adaptador lgtv',
        fullRemote: 'Comando completo',
        red: 'Vermelho',
        green: 'Verde',
        yellow: 'Amarelo',
        blue: 'Azul',
        dash: 'Traço',
        flashback: 'Canal anterior',
    },
    nl: {
        chooseInstance: 'Kies een LG TV-instantie in de instellingen',
        notInstance: 'Geen instantie van de lgtv-adapter',
        fullRemote: 'Volledige afstandsbediening',
        red: 'Rood',
        green: 'Groen',
        yellow: 'Geel',
        blue: 'Blauw',
        dash: 'Streepje',
        flashback: 'Vorige zender',
    },
    fr: {
        chooseInstance: 'Choisissez une instance LG TV dans les paramètres',
        notInstance: "Pas une instance de l'adaptateur lgtv",
        fullRemote: 'Télécommande complète',
        red: 'Rouge',
        green: 'Vert',
        yellow: 'Jaune',
        blue: 'Bleu',
        dash: 'Tiret',
        flashback: 'Chaîne précédente',
    },
    it: {
        chooseInstance: "Scegli un'istanza LG TV nelle impostazioni",
        notInstance: "Non è un'istanza dell'adattatore lgtv",
        fullRemote: 'Telecomando completo',
        red: 'Rosso',
        green: 'Verde',
        yellow: 'Giallo',
        blue: 'Blu',
        dash: 'Trattino',
        flashback: 'Canale precedente',
    },
    es: {
        chooseInstance: 'Elija una instancia de LG TV en la configuración',
        notInstance: 'No es una instancia del adaptador lgtv',
        fullRemote: 'Mando completo',
        red: 'Rojo',
        green: 'Verde',
        yellow: 'Amarillo',
        blue: 'Azul',
        dash: 'Guion',
        flashback: 'Canal anterior',
    },
    pl: {
        chooseInstance: 'Wybierz instancję LG TV w ustawieniach',
        notInstance: 'To nie jest instancja adaptera lgtv',
        fullRemote: 'Pełny pilot',
        red: 'Czerwony',
        green: 'Zielony',
        yellow: 'Żółty',
        blue: 'Niebieski',
        dash: 'Myślnik',
        flashback: 'Poprzedni kanał',
    },
    uk: {
        chooseInstance: 'Виберіть екземпляр LG TV у налаштуваннях',
        notInstance: 'Це не екземпляр адаптера lgtv',
        fullRemote: 'Повний пульт',
        red: 'Червона',
        green: 'Зелена',
        yellow: 'Жовта',
        blue: 'Синя',
        dash: 'Тире',
        flashback: 'Попередній канал',
    },
    'zh-cn': {
        chooseInstance: '请在设置中选择 LG TV 实例',
        notInstance: '不是 lgtv 适配器的实例',
        fullRemote: '完整遥控器',
        red: '红色',
        green: '绿色',
        yellow: '黄色',
        blue: '蓝色',
        dash: '短横线',
        flashback: '上一个频道',
    },
};

/**
 * A word in the language of the system, English if there is none in it
 *
 * @param lang the language of the ioBroker system
 * @param key the word
 */
export function getWord(lang: string, key: WordKey): string {
    if (key in EN) {
        const own = key as OwnWordKey;
        return WORDS[lang]?.[own] || EN[own];
    }
    const device = key as DeviceWordKey;
    return __LGTV_WORDS__[lang]?.[device] || __LGTV_WORDS__.en[device];
}
