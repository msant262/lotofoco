import GamePageClient from './GamePageClient';

export const runtime = 'edge';

interface PageProps {
    params: any;
}

export default async function GamePage({ params }: PageProps) {
    const { gameSlug } = await params;
    return <GamePageClient gameSlug={gameSlug} />;
}
