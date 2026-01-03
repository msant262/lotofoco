import GamePageClient from './GamePageClient';
import { LOTTERIES } from '@/lib/config/lotteries';

export async function generateStaticParams() {
    return Object.keys(LOTTERIES).map((slug) => ({
        gameSlug: slug,
    }));
}

interface PageProps {
    params: Promise<{ gameSlug: string }>;
}

export default async function GamePage({ params }: PageProps) {
    const { gameSlug } = await params;
    return <GamePageClient gameSlug={gameSlug} />;
}
