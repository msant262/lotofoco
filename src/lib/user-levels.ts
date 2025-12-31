/**
 * User Level System based on total bets
 */

export interface UserLevel {
    name: string;
    minBets: number;
    maxBets: number;
    color: string;
    icon: string;
    description: string;
}

export const USER_LEVELS: UserLevel[] = [
    {
        name: 'Iniciante',
        minBets: 0,
        maxBets: 10,
        color: '#64748b', // slate
        icon: '🌱',
        description: 'Começando a jornada'
    },
    {
        name: 'Experiente',
        minBets: 11,
        maxBets: 50,
        color: '#06b6d4', // cyan
        icon: '⭐',
        description: 'Ganhando experiência'
    },
    {
        name: 'Jogador Nato',
        minBets: 51,
        maxBets: 100,
        color: '#8b5cf6', // purple
        icon: '🎯',
        description: 'Conhece o jogo'
    },
    {
        name: 'Estrategista',
        minBets: 101,
        maxBets: 200,
        color: '#f59e0b', // amber
        icon: '🧠',
        description: 'Joga com inteligência'
    },
    {
        name: 'Mestre',
        minBets: 201,
        maxBets: 400,
        color: '#ec4899', // pink
        icon: '👑',
        description: 'Domina as estratégias'
    },
    {
        name: 'Especialista',
        minBets: 401,
        maxBets: Infinity,
        color: '#10b981', // emerald
        icon: '💎',
        description: 'Elite dos jogadores'
    }
];

/**
 * Get user level based on total bets
 */
export function getUserLevel(totalBets: number): UserLevel {
    return USER_LEVELS.find(
        level => totalBets >= level.minBets && totalBets <= level.maxBets
    ) || USER_LEVELS[0];
}

/**
 * Calculate progress to next level
 */
export function getLevelProgress(totalBets: number): {
    currentLevel: UserLevel;
    nextLevel: UserLevel | null;
    progress: number;
    betsToNext: number;
} {
    const currentLevel = getUserLevel(totalBets);
    const currentIndex = USER_LEVELS.indexOf(currentLevel);
    const nextLevel = currentIndex < USER_LEVELS.length - 1
        ? USER_LEVELS[currentIndex + 1]
        : null;

    if (!nextLevel) {
        return {
            currentLevel,
            nextLevel: null,
            progress: 100,
            betsToNext: 0
        };
    }

    const betsInCurrentLevel = totalBets - currentLevel.minBets;
    const betsNeededForLevel = nextLevel.minBets - currentLevel.minBets;
    const progress = Math.min(100, Math.round((betsInCurrentLevel / betsNeededForLevel) * 100));
    const betsToNext = nextLevel.minBets - totalBets;

    return {
        currentLevel,
        nextLevel,
        progress,
        betsToNext
    };
}

/**
 * Get subscription badge info
 */
export function getSubscriptionBadge(plan: string): {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    variant: 'solid' | 'bordered' | 'flat';
} {
    switch (plan?.toLowerCase()) {
        case 'pro':
        case 'premium':
        case 'monthly':
        case 'annual':
            return {
                label: 'PRO',
                color: 'success',
                variant: 'flat'
            };
        case 'free':
        default:
            return {
                label: 'FREE',
                color: 'default',
                variant: 'bordered'
            };
    }
}
