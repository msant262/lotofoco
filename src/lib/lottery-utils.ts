export const getNextDrawDate = (slug: string): Date => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

    // Logic to find next valid day
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // Schedules (Simplified)
    // Mega: Tue(2), Thu(4), Sat(6)
    // Lotofacil/Quina: Mon(1)-Sat(6)
    // Lotomania: Mon(1), Wed(3), Fri(5)
    // Timemania: Tue(2), Thu(4), Sat(6)
    // Dupla Sena: Mon(1), Wed(3), Fri(5)
    // Dia de Sorte: Tue(2), Thu(4), Sat(6)
    // Super Sete: Mon(1), Wed(3), Fri(5)
    // +Milionaria: Wed(3), Sat(6)
    // Federal: Wed(3), Sat(6)


    const schedules: Record<string, number[]> = {
        'mega-sena': [2, 4, 6],
        'lotofacil': [1, 2, 3, 4, 5, 6],
        'quina': [1, 2, 3, 4, 5, 6],
        'lotomania': [1, 3, 5],
        'timemania': [2, 4, 6],
        'dupla-sena': [1, 3, 5],
        'dia-de-sorte': [2, 4, 6],
        'super-sete': [1, 3, 5],
        'mais-milionaria': [3, 6],
        'federal': [3, 6],

    };

    const allowedDays = schedules[slug] || [3, 6]; // default Wed, Sat

    // Find next day in allowedDays that is >= today
    // If today is allowed, check if it's past draw time (e.g. 20:00). 
    // For simplicity, if it's today, we say it's today (Draw Day!). 

    let nextDate = today;
    let daysToAdd = 0;

    // Simple lookahead 7 days
    for (let i = 0; i < 7; i++) {
        const checkDate = addDays(today, i);
        const checkDay = checkDate.getDay();
        if (allowedDays.includes(checkDay)) {
            nextDate = checkDate;
            break;
        }
    }

    return nextDate;
}

export const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}
