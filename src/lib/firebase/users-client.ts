import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";

// Cache para evitar sync desnecessário
const syncedUsers = new Set<string>();
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutos
const lastSyncTime = new Map<string, number>();

export async function syncUserToFirestore(user: User) {
    if (!user || !db) return;

    const now = Date.now();
    const lastSync = lastSyncTime.get(user.uid) || 0;

    // Se já sincronizou nos últimos 5 minutos, pula
    if (now - lastSync < SYNC_COOLDOWN) {
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);

        const userData = {
            uid: user.uid,
            email: user.email || null,
            phoneNumber: user.phoneNumber || null,
            name: user.displayName || 'Usuário',
            photoURL: user.photoURL || null,
        };

        // Se nunca sincronizou este usuário nesta sessão, verifica se existe
        if (!syncedUsers.has(user.uid)) {
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // Novo usuário - cria documento completo
                await setDoc(userRef, {
                    ...userData,
                    plan: 'free',
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                });
            } else {
                // Usuário existente - atualiza apenas lastLogin
                await setDoc(userRef, {
                    lastLogin: serverTimestamp()
                }, { merge: true });
            }

            syncedUsers.add(user.uid);
        }

        // Atualiza o timestamp do último sync
        lastSyncTime.set(user.uid, now);

    } catch (error) {
        console.error("Error syncing user to Firestore:", error);
    }
}
