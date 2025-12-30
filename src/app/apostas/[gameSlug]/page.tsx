import GamePageClient from './GamePageClient';

export const runtime = 'edge';

interface PageProps {
    params: {
        gameSlug: string;
    };
}

export default function GamePage({ params }: PageProps) {
    return <GamePageClient gameSlug={params.gameSlug} />;
}
