'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BettingLimits {
    maxGames: number;
    isPro: boolean;
    isLoading: boolean;
}

export function useBettingLimits(): BettingLimits {
    const { user } = useAuth();
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            if (!user) {
                setIsPro(false);
                setIsLoading(false);
                return;
            }

            try {
                if (!db) {
                    setIsPro(false);
                    setIsLoading(false);
                    return;
                }

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const isProUser = userData?.isPro === true || userData?.subscriptionStatus === 'active';
                    setIsPro(isProUser);
                } else {
                    setIsPro(false);
                }
            } catch (error) {
                setIsPro(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkSubscription();
    }, [user]);

    return {
        maxGames: isPro ? 20 : 2,
        isPro,
        isLoading
    };
}
