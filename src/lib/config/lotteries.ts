export type LotteryLayout = 'standard' | 'columns' | 'composite' | 'soccer';

export type ExtraType = 'none' | 'trevos' | 'months' | 'teams';

export interface LotteryConfig {
    slug: string;
    name: string;
    range: number;
    startFrom?: number; // Default is 1, Super Sete starts from 0
    minBet: number;
    maxBet: number;
    color: string;
    accentColor: string;
    hexColor: string;
    layoutType: LotteryLayout;
    extraType: ExtraType;
    extraRange?: number;
    extraName?: string;
    columns?: number;
    // UI Helpers
    lightText?: boolean; // If true, use dark text on button because bg is bright
}

export const LOTTERIES: Record<string, LotteryConfig> = {
    'mega-sena': {
        slug: 'mega-sena',
        name: 'Mega-Sena',
        range: 60,
        minBet: 6,
        maxBet: 20,
        color: 'from-emerald-600 to-emerald-800',
        accentColor: 'text-emerald-400',
        hexColor: '#209869',
        layoutType: 'standard',
        extraType: 'none'
    },
    'lotofacil': {
        slug: 'lotofacil',
        name: 'Lotofácil',
        range: 25,
        minBet: 15,
        maxBet: 20,
        color: 'from-fuchsia-600 to-fuchsia-800',
        accentColor: 'text-fuchsia-400',
        hexColor: '#930089',
        layoutType: 'standard',
        extraType: 'none'
    },
    'quina': {
        slug: 'quina',
        name: 'Quina',
        range: 80,
        minBet: 5,
        maxBet: 15,
        color: 'from-indigo-600 to-indigo-800',
        accentColor: 'text-indigo-400',
        hexColor: '#260085',
        layoutType: 'standard',
        extraType: 'none'
    },
    'lotomania': {
        slug: 'lotomania',
        name: 'Lotomania',
        range: 100,
        minBet: 50,
        maxBet: 50,
        color: 'from-orange-500 to-orange-700',
        accentColor: 'text-orange-400',
        hexColor: '#F78100',
        layoutType: 'standard',
        extraType: 'none'
    },
    'timemania': {
        slug: 'timemania',
        name: 'Timemania',
        range: 80,
        minBet: 10,
        maxBet: 10,
        color: 'from-yellow-400 to-yellow-600',
        accentColor: 'text-yellow-400',
        hexColor: '#FFF100', // Yellow
        layoutType: 'standard',
        extraType: 'teams',
        extraRange: 80, // 80 Teams
        extraName: 'Time do Coração',
        lightText: true // Yellow bg needs black text
    },
    'dupla-sena': {
        slug: 'dupla-sena',
        name: 'Dupla Sena',
        range: 50,
        minBet: 6,
        maxBet: 15,
        color: 'from-red-600 to-red-800',
        accentColor: 'text-red-400',
        hexColor: '#A61317',
        layoutType: 'standard',
        extraType: 'none'
    },
    'dia-de-sorte': {
        slug: 'dia-de-sorte',
        name: 'Dia de Sorte',
        range: 31,
        minBet: 7,
        maxBet: 15,
        color: 'from-amber-600 to-amber-800',
        accentColor: 'text-amber-400',
        hexColor: '#CB8322',
        layoutType: 'composite',
        extraType: 'months',
        extraRange: 12,
        extraName: 'Mês de Sorte'
    },
    'super-sete': {
        slug: 'super-sete',
        name: 'Super Sete',
        range: 10, // 0-9 = 10 numbers
        startFrom: 0, // Starts from 0
        minBet: 7,
        maxBet: 21,
        color: 'from-lime-600 to-lime-800',
        accentColor: 'text-lime-400',
        hexColor: '#BEDC00',
        layoutType: 'columns',
        columns: 7,
        extraType: 'none',
        lightText: true
    },
    'mais-milionaria': {
        slug: 'mais-milionaria',
        name: '+Milionária',
        range: 50,
        minBet: 6,
        maxBet: 12,
        color: 'from-cyan-700 to-blue-900',
        accentColor: 'text-cyan-400',
        hexColor: '#003758',
        layoutType: 'composite',
        extraType: 'trevos',
        extraRange: 6,
        extraName: 'Trevos'
    },


};

export const SOCCER_TEAMS = [
    "Corinthians", "Palmeiras", "São Paulo", "Flamengo", "Vasco", "Fluminense", "Botafogo", "Santos",
    "Gremio", "Internacional", "Cruzeiro", "Atlético-MG", "Bahia", "Vitória", "Fortaleza", "Ceará",
    "Sport", "Náutico", "Santa Cruz", "Goiás", "Vila Nova", "Atlético-GO", "Curitiba", "Athletico-PR",
    "Avaí", "Figueirense", "Chapecoense", "Criciúma", "Joinville", "Ponte Preta", "Guarani", "Botafogo-SP",
    "ABC", "América-MG", "América-RN", "CSA", "CRB", "Sampaio Corrêa", "Paysandu", "Remo",
    "Juventude", "Caxias", "Brasil de Pelotas", "Londrina", "Operário", "Paraná", "Bragantino", "Ituano",
    "São Caetano", "Bangu", "Portuguesa", "Juventus", "Nacional", "Rio Branco", "Treze", "Campinense",
    "Botafogo-PB", "Confiança", "Sergipe", "ASA", "River", "Moto Club", "Ferroviário", "Icasa", "Guarany",
    "Ypiranga", "São José", "Luverdense", "Cuiabá", "Mixto", "Operário-MS", "Comercial", "Gama", "Brasiliense",
    "Vila Nova", "Tuna Luso", "São Raimundo", "Nacional-AM", "Rio Negro"
    // Mock list subset, in reality Timemania has strictly 80 specific clubs mapped 1-80.
];
