// Firebase Firestore REST API Helper
// Não depende do SDK Client/Admin e funciona em qualquer ambiente

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lotofoco-001';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB3vY9H9jFJZd1IrR3_6HoZo5VHUXmdlXs';

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

interface FirestoreValue {
    stringValue?: string;
    integerValue?: string;
    doubleValue?: number;
    booleanValue?: boolean;
    nullValue?: null;
    arrayValue?: { values: FirestoreValue[] };
    mapValue?: { fields: Record<string, FirestoreValue> };
    timestampValue?: string;
}

// Converte valor JS para formato Firestore
function toFirestoreValue(value: any): FirestoreValue {
    if (value === null || value === undefined) {
        return { nullValue: null };
    }
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return { integerValue: String(value) };
        }
        return { doubleValue: value };
    }
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(v => toFirestoreValue(v))
            }
        };
    }
    if (typeof value === 'object') {
        const fields: Record<string, FirestoreValue> = {};
        for (const [k, v] of Object.entries(value)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

// Converte documento para formato Firestore
function toFirestoreDocument(data: Record<string, any>): { fields: Record<string, FirestoreValue> } {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, value] of Object.entries(data)) {
        fields[key] = toFirestoreValue(value);
    }
    // Adicionar timestamp de atualização
    fields['updatedAt'] = { timestampValue: new Date().toISOString() };
    return { fields };
}

export class FirestoreRest {
    // Criar ou atualizar documento
    static async setDocument(
        collection: string,
        docId: string,
        data: Record<string, any>,
        subcollection?: string,
        subDocId?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            let path = `${FIRESTORE_BASE_URL}/${collection}/${docId}`;
            if (subcollection && subDocId) {
                path += `/${subcollection}/${subDocId}`;
            }

            const url = `${path}?key=${FIREBASE_API_KEY}`;
            const document = toFirestoreDocument(data);

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(document)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[FirestoreRest] Error ${response.status}: ${errorText}`);
                return { success: false, error: `HTTP ${response.status}: ${errorText}` };
            }

            return { success: true };
        } catch (e: any) {
            console.error(`[FirestoreRest] Exception: ${e.message}`);
            return { success: false, error: e.message };
        }
    }

    // Ler documento
    static async getDocument(
        collection: string,
        docId: string,
        subcollection?: string,
        subDocId?: string
    ): Promise<any | null> {
        try {
            let path = `${FIRESTORE_BASE_URL}/${collection}/${docId}`;
            if (subcollection && subDocId) {
                path += `/${subcollection}/${subDocId}`;
            }

            const url = `${path}?key=${FIREBASE_API_KEY}`;

            const response = await fetch(url);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data;
        } catch (e) {
            return null;
        }
    }
}
