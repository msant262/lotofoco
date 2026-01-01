import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";

export interface GameItem {
    main: string[];
    extras?: string[]; // Para +Milionaria
    explanation?: string; // AI Justification
}

export interface SavedBet {
    id?: string;
    userId: string;
    gameSlug: string;
    gameName: string;
    // Legacy support
    numbers?: string[];
    // New Structure
    games?: GameItem[];

    concurso?: number;
    createdAt: any; // Timestamp do Firestore
    status: 'pending' | 'won' | 'lost';
}

export async function saveBet(userId: string, gameSlug: string, gameName: string, games: GameItem[], concurso?: number) {
    if (!db || !userId) return null;

    try {
        const betsRef = collection(db, "users", userId, "bets");
        const docRef = await addDoc(betsRef, {
            userId,
            gameSlug,
            gameName,
            games, // Save the batch
            itemCount: games.length, // Helper for querying size
            concurso: concurso || null,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error saving bet:", e);
        return null; // Let caller handle error
    }
}

// Função para buscar o próximo concurso
export async function getNextConcurso(gameSlug: string): Promise<number | null> {
    try {
        const res = await fetch(`/api/proxy-caixa?slug=${gameSlug}`);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data || !data.concurso) return null;

        const lastConcurso = data.concurso;
        const lastDrawDate = data.data || data.dataApuracao;

        if (!lastDrawDate) {
            // Sem data, assume próximo concurso
            return lastConcurso + 1;
        }

        // Parsear data do sorteio (formato dd/mm/yyyy)
        const parts = lastDrawDate.split('/');
        if (parts.length !== 3) return lastConcurso + 1;

        const drawDate = new Date(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0])
        );

        // Data de hoje (sem hora)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        drawDate.setHours(0, 0, 0, 0);

        // Se o sorteio foi hoje ou antes, o próximo é +1
        // Se o sorteio é de uma data futura (não deveria acontecer), usa o mesmo
        if (drawDate <= today) {
            return lastConcurso + 1;
        }

        // O último sorteio ainda não aconteceu (data futura - improvável)
        return lastConcurso;
    } catch (e) {
        console.error("Error fetching next concurso:", e);
        return null;
    }
}

export async function getUserBets(userId: string) {
    if (!db || !userId) return [];

    try {
        const betsRef = collection(db, "users", userId, "bets");
        // Order by creation date desc
        const q = query(betsRef, orderBy("createdAt", "desc"));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SavedBet[];
    } catch (e) {
        console.error("Error fetching bets:", e);
        return [];
    }
}

export async function updateBetStatus(userId: string, betId: string, status: 'pending' | 'won' | 'lost') {
    if (!db || !userId || !betId) return false;

    try {
        const betRef = doc(db, "users", userId, "bets", betId);
        await updateDoc(betRef, { status });
        return true;
    } catch (e) {
        console.error("Error updating bet status:", e);
        return false;
    }
}
