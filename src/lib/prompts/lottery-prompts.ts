// Prompts dinâmicos por loteria baseados em estatísticas

export interface LotteryPromptConfig {
    gameName: string;
    basePrompt: string;
    statsContext: string;
    numberRules: string;
    winningPatterns: string;
}

export const LOTTERY_PROMPTS: Record<string, LotteryPromptConfig> = {
    'mega-sena': {
        gameName: 'Mega-Sena',
        basePrompt: `Você é um especialista em análise estatística da Mega-Sena.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DA MEGA-SENA:
- 6 números de 01 a 60
- Prêmio mínimo: 4 acertos (Quadra)

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Soma ideal dos 6 números: entre 150 e 220
- Distribuição: 2-3 dezenas pares e 2-3 dezenas ímpares
- Décadas: distribuir entre todas (01-10, 11-20, 21-30, 31-40, 41-50, 51-60)
- Evitar sequências (ex: 01-02-03)
- Evitar múltiplos de 5 ou 10 em excesso`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- Priorize números que estão "atrasados" (não saem há mais de 10 concursos)
- Considere números quentes (alta frequência recente)
- Balance entre números frequentes e atrasados`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- 60% dos jogos ganham com soma entre 150-220
- Raramente todos pares ou todos ímpares
- Geralmente 1-2 números na mesma dezena, máximo 3
- Evite números em linha no volante (horizontal/vertical/diagonal)`
    },

    'lotofacil': {
        gameName: 'Lotofácil',
        basePrompt: `Você é um especialista em análise estatística da Lotofácil.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DA LOTOFÁCIL:
- 15 números de 01 a 25
- Prêmio mínimo: 11 acertos

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Soma ideal dos 15 números: entre 180 e 220
- Distribuição perfeita: 7-8 pares e 7-8 ímpares
- O volante tem 5 linhas x 5 colunas
- Ideal: 3 números por linha, 3 números por coluna`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- Na Lotofácil, 15 de 25 números saem (60%)
- Foque em números que mantêm consistência
- Os 10 números que não saíram no último concurso têm alta chance`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Nunca todos pares ou todos ímpares
- Distribuição equilibrada por quadrantes do volante
- Soma sempre próxima de 195-210
- Números primos aparecem com frequência (02, 03, 05, 07, 11, 13, 17, 19, 23)`
    },

    'quina': {
        gameName: 'Quina',
        basePrompt: `Você é um especialista em análise estatística da Quina.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DA QUINA:
- 5 números de 01 a 80
- Prêmio mínimo: 2 acertos (Duque)

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Soma ideal dos 5 números: entre 150 e 250
- Distribuição: 2-3 pares e 2-3 ímpares
- Range amplo: distribuir números por todo o volante`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- Apenas 5 de 80 números são sorteados (6.25%)
- Números atrasados têm peso maior na Quina
- Considere a frequência histórica dos últimos 100 concursos`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Evite clusters (números muito próximos)
- Distribua por décadas: 01-20, 21-40, 41-60, 61-80
- Soma média histórica: ~200
- Sequências são raríssimas`
    },

    'lotomania': {
        gameName: 'Lotomania',
        basePrompt: `Você é um especialista em análise estatística da Lotomania.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DA LOTOMANIA:
- 50 números fixos de 00 a 99
- Prêmio: 15 a 20 acertos OU 0 acertos!

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Metade dos números do volante são escolhidos
- Soma ideal: entre 2400 e 2600
- Equilíbrio entre dezenas é crucial`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- 50 de 100 números são escolhidos (50%)
- Considere que 0 acertos também paga!
- Números terminados em cada final (0-9) devem ter ~5 representantes`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Distribuição uniforme por dezenas (0-9, 10-19, ... 90-99)
- 25 pares e 25 ímpares é o ideal
- Evite concentrar em uma faixa específica`
    },

    'timemania': {
        gameName: 'Timemania',
        basePrompt: `Você é um especialista em análise estatística da Timemania.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DA TIMEMANIA:
- 10 números fixos de 01 a 80
- Prêmio mínimo: 3 acertos
- Bonus: Time do Coração (1 de 80 times)

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Soma ideal dos 10 números: entre 350 e 450
- Distribuição: 5 pares e 5 ímpares idealmente`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- 10 de 80 números são sorteados (12.5%)
- O Time do Coração é sorteio independente
- Foque na distribuição equilibrada`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Distribuição por quadrantes: 01-20, 21-40, 41-60, 61-80
- 2-3 números por quadrante é ideal
- Evite mais de 3 números sequenciais`
    },

    'dupla-sena': {
        gameName: 'Dupla Sena',
        basePrompt: `Você é um especialista em análise estatística da Dupla Sena.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DA DUPLA SENA:
- 6 números de 01 a 50
- 2 sorteios com os mesmos números!
- Prêmio mínimo: 4 acertos (Quadra)

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Soma ideal: entre 130 e 180
- Mesmo bilhete participa de 2 sorteios
- Distribuição: 3 pares e 3 ímpares`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- 6 de 50 números são sorteados em cada sorteio
- Analise separadamente cada sorteio (podem ter padrões diferentes)
- Números frequentes em ambos os sorteios têm vantagem`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Distribua por décadas: 01-10, 11-20, 21-30, 31-40, 41-50
- Pelo menos 1 número em cada dezena
- Soma entre 130-180 em 70% dos jogos ganhos`
    },

    'dia-de-sorte': {
        gameName: 'Dia de Sorte',
        basePrompt: `Você é um especialista em análise estatística do Dia de Sorte.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DO DIA DE SORTE:
- 7 números de 01 a 31
- Bonus: Mês de Sorte (1 de 12 meses)
- Prêmio mínimo: 4 acertos

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Soma ideal: entre 100 e 140
- Distribuição: 3-4 pares e 3-4 ímpares
- O range é baseado nos dias do mês`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- 7 de 31 números são sorteados (22.5%)
- O Mês de Sorte é sorteio independente
- Considere que 31 dias não existem em todos os meses`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Números entre 01-10 aparecem frequentemente
- Evite concentrar apenas em números altos
- O número 31 sai menos que a média estatística`
    },

    'super-sete': {
        gameName: 'Super Sete',
        basePrompt: `Você é um especialista em análise estatística do Super Sete.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DO SUPER SETE:
- 7 colunas independentes
- Cada coluna: número de 0 a 9
- Pode marcar mais de 1 por coluna (até 3)
- Prêmio mínimo: 3 acertos

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Cada coluna é independente das outras
- Formato: 7 dígitos (ex: 3-5-2-8-1-7-4)`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- Cada coluna tem estatísticas próprias
- Analise a frequência por coluna separadamente
- Números 0-9 têm distribuição relativamente uniforme`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Evite repetir o mesmo número em diferentes colunas
- Distribua entre baixos (0-4) e altos (5-9)
- Considere a frequência histórica de cada coluna`
    },

    'mais-milionaria': {
        gameName: '+Milionária',
        basePrompt: `Você é um especialista em análise estatística da +Milionária.
Gere números usando análise probabilística avançada.`,
        statsContext: `
REGRAS DA +MILIONÁRIA:
- 6 números de 01 a 50
- 2 Trevos de 1 a 6 (obrigatório)
- Prêmio mínimo: 2 acertos + nenhum trevo

PADRÕES ESTATÍSTICOS IMPORTANTES:
- Soma ideal dos 6 números: entre 130 e 180
- Os trevos são sorteio independente
- Combinar números + trevos para prêmio máximo`,
        numberRules: `
ANÁLISE DE FREQUÊNCIA:
- Os 6 números são como a Dupla Sena
- Os 2 trevos de 6 possíveis (cada com ~33% de chance)
- Analise separadamente números e trevos`,
        winningPatterns: `
PADRÕES DE JOGOS VENCEDORES:
- Distribuição equilibrada por dezenas
- Trevos mais sorteados variam por período
- Considere trevos atrasados para equilibrar`
    }
};

// Função para gerar o prompt completo
export function buildLotteryPrompt(
    gameSlug: string,
    quantity: number,
    fixedNumbers: string[] = [],
    stats?: {
        hotNumbers?: number[];
        coldNumbers?: number[];
        avgSum?: number;
        lastDrawn?: number[];
    }
): string {
    const config = LOTTERY_PROMPTS[gameSlug];

    if (!config) {
        return `Gere ${quantity} números aleatórios para uma loteria.`;
    }

    let prompt = `${config.basePrompt}

${config.statsContext}

${config.numberRules}

${config.winningPatterns}

TAREFA:
Gere exatamente ${quantity} números para o jogo ${config.gameName}.
`;

    if (fixedNumbers.length > 0) {
        prompt += `\nNÚMEROS FIXOS (já selecionados pelo usuário): ${fixedNumbers.join(', ')}
Você deve complementar com mais ${quantity - fixedNumbers.length} números.`;
    }

    if (stats) {
        prompt += '\n\nESTATÍSTICAS ATUAIS:';
        if (stats.hotNumbers?.length) {
            prompt += `\n- Números quentes (alta frequência): ${stats.hotNumbers.slice(0, 10).join(', ')}`;
        }
        if (stats.coldNumbers?.length) {
            prompt += `\n- Números frios (baixa frequência/atrasados): ${stats.coldNumbers.slice(0, 10).join(', ')}`;
        }
        if (stats.avgSum) {
            prompt += `\n- Soma média dos sorteios: ${stats.avgSum}`;
        }
        if (stats.lastDrawn?.length) {
            prompt += `\n- Último sorteio: ${stats.lastDrawn.join(', ')}`;
        }
    }

    prompt += `

FORMATO DE RESPOSTA:
Retorne APENAS os números separados por vírgula, em ordem crescente.
Exemplo: 03, 15, 22, 38, 45, 57

Aplique todas as regras estatísticas para maximizar as chances.`;

    return prompt;
}
