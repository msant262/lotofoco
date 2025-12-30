import { LOTTERIES } from "@/lib/config/lotteries";

// Keys reais do seu LOTTERIES:
// mega-sena, lotofacil, quina, lotomania, timemania,
// dupla-sena, dia-de-sorte, super-sete, mais-milionaria,
// federal, loteca

const ALIASES: Record<string, string> = {
    // variações sem hífen
    megasena: "mega-sena",
    duplasena: "dupla-sena",
    diadesorte: "dia-de-sorte",
    supersete: "super-sete",
    maismilionaria: "mais-milionaria",

    // variações com hífen “errado” que aparecem muito
    "loto-facil": "lotofacil",
    "loto-fácil": "lotofacil",
    "mais-milionária": "mais-milionaria",
    "super7": "super-sete",
};

function normalize(input: string) {
    return decodeURIComponent(input)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/_/g, "-")
        .trim();
}

export function resolveLotterySlug(input?: string) {
    if (!input) return null;

    const raw = normalize(input);

    const candidates = [
        raw,
        ALIASES[raw],
        raw.replace(/-/g, ""),               // sem hífen
        ALIASES[raw.replace(/-/g, "")],      // alias sem hífen
    ].filter(Boolean) as string[];

    for (const c of candidates) {
        if (c in LOTTERIES) return c;
    }

    return null;
}