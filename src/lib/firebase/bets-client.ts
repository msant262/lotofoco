import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore";

export interface GameItem {
    main: string[];
    extras?: string[];
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
    createdAt: any;
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
