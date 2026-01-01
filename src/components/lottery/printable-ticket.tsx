import { SavedBet } from "@/lib/firebase/bets-client";
import { DrawDetails } from "@/lib/firebase/games-client";
import { LOTTERIES } from "@/lib/config/lotteries";

interface PrintableTicketProps {
    bet: SavedBet;
    result?: DrawDetails | null;
}

export function PrintableTicket({ bet, result }: PrintableTicketProps) {
    const lottery = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
    const games = bet.games || (bet.numbers ? [{ main: bet.numbers }] : []);

    // Configurações por jogo
    const gridConfig: Record<string, { total: number; cols: number; rows: number }> = {
        'mega-sena': { total: 60, cols: 10, rows: 6 },
        'lotofacil': { total: 25, cols: 5, rows: 5 },
        'quina': { total: 80, cols: 10, rows: 8 },
        'lotomania': { total: 100, cols: 10, rows: 10 },
        'dia-de-sorte': { total: 31, cols: 7, rows: 5 },
        'timemania': { total: 80, cols: 10, rows: 8 },
        'dupla-sena': { total: 50, cols: 10, rows: 5 },
    };

    const config = gridConfig[bet.gameSlug] || { total: 60, cols: 10, rows: 6 };

    return (
        <>
            <style jsx global>{`
                @media print {
                    /* Hide everything */
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    body > * {
                        display: none !important;
                    }
                    
                    /* Show only printable content */
                    .printable-ticket-wrapper {
                        display: block !important;
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        z-index: 99999 !important;
                        background: white !important;
                        overflow: visible !important;
                    }
                    
                    .printable-ticket-wrapper * {
                        visibility: visible !important;
                    }
                    
                    @page {
                        size: A4 portrait;
                        margin: 0.8cm;
                    }
                    
                    .print-header {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        margin-bottom: 8px !important;
                    }
                    
                    .game-container {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 8px !important;
                        max-height: 6cm !important;
                        overflow: hidden !important;
                    }
                    
                    .game-container .grid {
                        font-size: 7px !important;
                    }
                    
                    .print-footer {
                        page-break-before: avoid !important;
                        break-before: avoid !important;
                        margin-top: 8px !important;
                    }
                }
                
                @media screen {
                    .printable-ticket-wrapper {
                        display: none;
                    }
                }
            `}</style>

            <div className="printable-ticket-wrapper">
                <div className="bg-white text-black p-4 font-sans">
                    {/* Header - Compacto */}
                    <div className="border-4 border-black p-2 mb-2 print-header">
                        <div className="flex justify-between items-center mb-1">
                            <div>
                                <h1 className="text-xl font-black uppercase">{bet.gameName}</h1>
                                <p className="text-[9px] mt-0">CAIXA ECONÔMICA FEDERAL</p>
                            </div>
                            <div className="text-right text-[9px]">
                                <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
                                {bet.concurso && (
                                    <p>Concurso: {bet.concurso}</p>
                                )}
                            </div>
                        </div>

                        <div className="border-t-2 border-black pt-1">
                            <p className="text-[8px] font-bold">
                                VOLANTE GERADO POR LOTOFOCO - LEVE À LOTÉRICA PARA REGISTRAR SUA APOSTA
                            </p>
                        </div>
                    </div>

                    {/* Jogos - 4 por página */}
                    {games.map((game, gameIdx) => (
                        <div key={gameIdx} className="game-container mb-2">
                            <div className="border-2 border-black p-1.5">
                                {/* Cabeçalho do Jogo - Compacto */}
                                <div className="flex justify-between items-center mb-1 pb-0.5 border-b border-black">
                                    <h2 className="text-xs font-bold">JOGO {gameIdx + 1}</h2>
                                    <div className="text-right text-[8px]">
                                        <p>Marcados: {game.main.length}</p>
                                        {result && (
                                            <p className="font-bold text-green-700">
                                                Acertos: {game.main.filter(n => result.dezenas.some(d => parseInt(d) === parseInt(n))).length}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Grade de Números - Compacta */}
                                <div className="grid gap-0.5 mb-1.5" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}>
                                    {Array.from({ length: config.total }, (_, i) => {
                                        const num = (i + 1).toString();
                                        const isSelected = game.main.includes(num) || game.main.includes(num.padStart(2, '0'));
                                        const isHit = result?.dezenas.some(d => parseInt(d) === parseInt(num));

                                        return (
                                            <div
                                                key={i}
                                                className={`
                                                aspect-square border border-black flex items-center justify-center text-[8px] font-bold
                                                ${isSelected ? 'bg-black text-white' : 'bg-white text-black'}
                                                ${isHit && isSelected ? 'ring-1 ring-green-600' : ''}
                                            `}
                                            >
                                                {num.padStart(2, '0')}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Números Selecionados - Compacto */}
                                <div className="border-t border-black pt-1">
                                    <p className="text-[8px] font-bold mb-0.5">NÚMEROS MARCADOS:</p>
                                    <div className="flex flex-wrap gap-0.5">
                                        {game.main.map((num, idx) => (
                                            <span key={idx} className="inline-block bg-black text-white px-1 py-0.5 text-[8px] font-bold">
                                                {num.padStart(2, '0')}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Resultado Oficial - Compacto (se disponível) */}
                                {result && (
                                    <div className="mt-1 border-t border-black pt-1 bg-gray-100 p-1">
                                        <p className="text-[8px] font-bold mb-0.5">RESULTADO - CONCURSO {result.concurso}:</p>
                                        <div className="flex flex-wrap gap-0.5">
                                            {result.dezenas.map((num, idx) => (
                                                <span key={idx} className="inline-block bg-green-700 text-white px-1 py-0.5 text-[8px] font-bold">
                                                    {num}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Footer - Compacto */}
                    <div className="mt-2 border-t border-black pt-1.5 text-[8px] print-footer">
                        <p className="font-bold mb-0.5">INSTRUÇÕES:</p>
                        <ul className="list-disc list-inside space-y-0 text-[7px]">
                            <li>Leve este volante a uma Casa Lotérica autorizada</li>
                            <li>Solicite ao atendente para registrar os números marcados acima</li>
                            <li>Este documento NÃO é um comprovante de aposta válido</li>
                        </ul>

                        <div className="mt-1 text-center text-[7px] text-gray-600">
                            <p>Gerado por LotoFoco em {new Date().toLocaleString('pt-BR')} | ID: {bet.id?.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
