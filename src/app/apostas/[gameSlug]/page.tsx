import { LOTTERIES } from '@/lib/config/lotteries';
import GameClientPage from '@/components/game-client-page';

export function generateStaticParams() {
    return Object.keys(LOTTERIES).map((slug) => ({
        gameSlug: slug,
    }));
}

export default function Page() {
    return <GameClientPage />;
}
