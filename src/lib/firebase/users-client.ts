import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export async function syncUserToFirestore(user: User) {
    if (!user || !db) return;

    try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        const userData = {
            uid: user.uid,
            email: user.email || null,
            phoneNumber: user.phoneNumber || null,
            name: user.displayName || 'Usuário',
            photoURL: user.photoURL || null,
        };

        if (!userDoc.exists()) {
            // New User
            await setDoc(userRef, {
                ...userData,
                plan: 'free',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
        } else {
            // Update existing user (merge info)
            await setDoc(userRef, {
                ...userData,
                lastLogin: serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error syncing user to Firestore:", error);
    }
}
