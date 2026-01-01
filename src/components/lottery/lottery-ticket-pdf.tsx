import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Printer } from 'lucide-react';
import { SavedBet } from "@/lib/firebase/bets-client";
import { DrawDetails } from "@/lib/firebase/games-client";
import { LOTTERIES } from "@/lib/config/lotteries";

interface LotteryTicketPDFProps {
    bet: SavedBet;
    result?: DrawDetails | null;
}

// Estilos para layout 2x2 - Números grandes, células compactas, design HeroUI
const styles = StyleSheet.create({
    page: {
        padding: 8,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        padding: 5,
        marginBottom: 5,
        borderWidth: 2,
        borderColor: '#000000',
        borderRadius: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    headerInfo: {
        fontSize: 6,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    headerSubInfo: {
        fontSize: 5,
        textAlign: 'center',
        color: '#000000',
        marginTop: 3,
        paddingTop: 3,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.2)',
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        padding: 2,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    gameContainer: {
        width: '48%',
        borderWidth: 1.5,
        borderColor: '#000000',
        borderRadius: 4,
        padding: 4,
        marginBottom: 5,
        backgroundColor: '#FFFFFF',
    },
    gameHeader: {
        marginBottom: 2,
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
        padding: 2,
        borderRadius: 2,
        marginHorizontal: -4,
        marginTop: -4,
        paddingHorizontal: 4,
        paddingTop: 4,
    },
    gameTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 0.5,
        color: '#1A1A1A',
    },
    gameInfo: {
        fontSize: 5,
        color: '#666666',
        marginBottom: 0.2,
    },
    numbersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 2,
        marginTop: 2,
    },
    numberCell: {
        width: '15.8%',
        height: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0.15,
        backgroundColor: '#FAFAFA',
        position: 'relative',
    },
    numberCellSelected: {
        borderWidth: 3,
        borderColor: '#000000',
        backgroundColor: '#E0E0E0',
    },
    numberText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    numberTextSelected: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    numberDot: {
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#000000',
        position: 'absolute',
        top: 0.5,
        left: 0.5,
    },
    numberDotHit: {
        backgroundColor: '#00AA00',
    },
    selectedSection: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 2,
        marginTop: 2,
        backgroundColor: '#FAFAFA',
        padding: 2,
        borderRadius: 2,
    },
    sectionLabel: {
        fontSize: 5,
        fontWeight: 'bold',
        marginBottom: 0.5,
        color: '#1A1A1A',
    },
    selectedNumbersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    selectedChip: {
        fontSize: 6,
        fontWeight: 'bold',
        padding: 0.5,
        margin: 0.2,
        color: '#1A1A1A',
    },
    drawnSection: {
        backgroundColor: '#FFF4E6',
        borderWidth: 1.5,
        borderColor: '#FF9800',
        borderRadius: 3,
        padding: 2,
        marginTop: 2,
    },
    drawnLabel: {
        fontSize: 5,
        fontWeight: 'bold',
        color: '#E65100',
        marginBottom: 0.5,
    },
    drawnChip: {
        fontSize: 6,
        fontWeight: 'bold',
        backgroundColor: '#FF9800',
        color: '#FFFFFF',
        padding: 1,
        margin: 0.2,
        borderRadius: 2,
    },
    resultSection: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1.5,
        borderColor: '#4CAF50',
        borderRadius: 3,
        padding: 2,
        marginTop: 2,
    },
    resultLabel: {
        fontSize: 5,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 0.5,
    },
    resultChip: {
        fontSize: 6,
        fontWeight: 'bold',
        backgroundColor: '#4CAF50',
        color: '#FFFFFF',
        padding: 1,
        margin: 0.2,
        borderRadius: 2,
    },
    footer: {
        borderTopWidth: 0.5,
        borderTopColor: '#CCCCCC',
        paddingTop: 2,
        marginTop: 3,
    },
    footerText: {
        fontSize: 4.5,
        marginBottom: 0.3,
        color: '#666666',
    },
    footerInfo: {
        fontSize: 4,
        textAlign: 'center',
        color: '#999999',
        marginTop: 1,
    },
});

// Configurações de grade por jogo
const gridConfig: Record<string, { total: number; cols: number }> = {
    'mega-sena': { total: 60, cols: 10 },
    'lotofacil': { total: 25, cols: 5 },
    'quina': { total: 80, cols: 10 },
    'lotomania': { total: 100, cols: 10 },
    'dia-de-sorte': { total: 31, cols: 7 },
    'timemania': { total: 80, cols: 10 },
    'dupla-sena': { total: 50, cols: 10 },
};

// Helper para formatar data (lida com Firebase Timestamp)
const formatDate = (date: unknown): string => {
    if (!date) return '';

    try {
        let d: Date;

        // Firebase Timestamp tem seconds
        if (typeof date === 'object' && date !== null && 'seconds' in date) {
            d = new Date((date as { seconds: number }).seconds * 1000);
        } else if (typeof date === 'string' || typeof date === 'number') {
            d = new Date(date);
        } else {
            return '';
        }

        if (isNaN(d.getTime())) return '';

        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
        return '';
    }
};

// Componente do documento PDF
const LotteryTicketDocument = ({ bet, result }: LotteryTicketPDFProps) => {
    const lottery = Object.values(LOTTERIES).find(l => l.slug === bet.gameSlug);
    const games = bet.games || (bet.numbers ? [{ main: bet.numbers }] : []);
    const config = gridConfig[bet.gameSlug] || { total: 60, cols: 10 };
    const drawnNumbers = result?.dezenas || [];
    const headerColor = lottery?.hexColor || '#209869';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Simplificado */}
                <View style={[styles.header, { backgroundColor: headerColor }]}>
                    <Text style={styles.headerTitle}>{bet.gameName.toUpperCase()}</Text>

                    {bet.concurso && (
                        <Text style={[styles.headerInfo, { marginTop: 2 }]}>
                            Concurso {bet.concurso}
                        </Text>
                    )}

                    <Text style={[styles.headerInfo, { marginTop: 1 }]}>
                        Data: {new Date().toLocaleDateString('pt-BR')}
                    </Text>

                    <Text style={[styles.headerInfo, { marginTop: 1 }]}>
                        Total: {games.length} jogo{games.length > 1 ? 's' : ''}
                    </Text>

                    <View style={styles.headerSubInfo}>
                        <Text style={{ fontSize: 5, textAlign: 'center', color: '#000000' }}>
                            VOLANTE GERADO POR LOTOFOCO - LEVE A LOTERICA
                        </Text>
                    </View>
                </View>

                {/* Jogos em Grid 2x2 */}
                <View style={styles.gamesGrid}>
                    {games.map((game, gameIdx) => {
                        const hits = game.main.filter(n =>
                            drawnNumbers.some(d => parseInt(d) === parseInt(n))
                        ).length;

                        return (
                            <View key={gameIdx} style={styles.gameContainer}>
                                {/* Cabeçalho do Jogo */}
                                <View style={styles.gameHeader}>
                                    <Text style={styles.gameTitle}>JOGO {gameIdx + 1}</Text>
                                    <Text style={styles.gameInfo}>
                                        Marcados: {game.main.length} números
                                    </Text>
                                    {bet.createdAt && formatDate(bet.createdAt) && (
                                        <Text style={styles.gameInfo}>
                                            Criado: {formatDate(bet.createdAt)}
                                        </Text>
                                    )}
                                </View>

                                {/* Grade de Números */}
                                <View style={styles.numbersGrid}>
                                    {Array.from({ length: config.total }, (_, i) => {
                                        const num = (i + 1).toString();
                                        const isSelected = game.main.includes(num) || game.main.includes(num.padStart(2, '0'));
                                        const isHit = result && drawnNumbers.some(d => parseInt(d) === parseInt(num));

                                        return (
                                            <View
                                                key={i}
                                                style={{
                                                    width: '15.8%',
                                                    padding: 3,
                                                    borderWidth: isSelected ? 2 : 0.5,
                                                    borderColor: '#000000',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    margin: 0.15,
                                                    backgroundColor: isSelected ? '#CCCCCC' : '#FFFFFF',
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 8,
                                                    fontWeight: 'bold',
                                                    color: '#000000',
                                                    textAlign: 'center',
                                                }}>
                                                    {num.padStart(2, '0')}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Números Marcados */}
                                <View style={styles.selectedSection}>
                                    <Text style={styles.sectionLabel}>MARCADOS:</Text>
                                    <View style={styles.selectedNumbersRow}>
                                        {game.main.map((num, idx) => (
                                            <Text key={idx} style={styles.selectedChip}>
                                                {num.padStart(2, '0')}
                                                {idx < game.main.length - 1 ? ' -' : ''}
                                            </Text>
                                        ))}
                                    </View>
                                </View>

                                {/* Números Sorteados */}
                                {result && (
                                    <View style={styles.drawnSection}>
                                        <Text style={styles.drawnLabel}>
                                            SORTEADOS - CONCURSO {result.concurso}
                                        </Text>
                                        <View style={styles.selectedNumbersRow}>
                                            {result.dezenas.map((num, idx) => (
                                                <Text key={idx} style={styles.drawnChip}>
                                                    {num}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Resultado (Acertos) */}
                                {result && hits > 0 && (
                                    <View style={styles.resultSection}>
                                        <Text style={styles.resultLabel}>
                                            ✓ VOCÊ ACERTOU {hits} NÚMERO{hits > 1 ? 'S' : ''}!
                                        </Text>
                                        <View style={styles.selectedNumbersRow}>
                                            {game.main
                                                .filter(n => drawnNumbers.some(d => parseInt(d) === parseInt(n)))
                                                .map((num, idx) => (
                                                    <Text key={idx} style={styles.resultChip}>
                                                        {num.padStart(2, '0')}
                                                    </Text>
                                                ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>• Leve à lotérica para registrar</Text>
                    <Text style={styles.footerText}>• Este NÃO é comprovante válido</Text>
                    <Text style={styles.footerInfo}>
                        LotoFoco {new Date().toLocaleDateString('pt-BR')} | ID: {bet.id?.slice(0, 8).toUpperCase()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// Componente de botão para download
export function DownloadLotteryTicket({ bet, result }: LotteryTicketPDFProps) {
    const fileName = `volante-${bet.gameName.toLowerCase().replace(/\s+/g, '-')}-${bet.concurso || 'pendente'}.pdf`;

    return (
        <PDFDownloadLink
            document={<LotteryTicketDocument bet={bet} result={result} />}
            fileName={fileName}
            className="flex items-center justify-center gap-2 w-full h-full px-4 py-3 text-blue-400 font-bold text-sm hover:opacity-80 transition-opacity"
        >
            {({ loading }) => (
                <>
                    <Download className="w-5 h-5" />
                    <span>{loading ? 'Gerando...' : 'Baixar PDF'}</span>
                </>
            )}
        </PDFDownloadLink>
    );
}

// Componente de botão para impressão
export function PrintLotteryTicket({ bet, result }: LotteryTicketPDFProps) {
    const [isPrinting, setIsPrinting] = React.useState(false);

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            const blob = await import('@react-pdf/renderer').then(({ pdf }) =>
                pdf(<LotteryTicketDocument bet={bet} result={result} />).toBlob()
            );
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } catch (error) {
            console.error('Erro ao imprimir:', error);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center justify-center gap-2 w-full h-full px-4 py-3 text-purple-400 font-bold text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
            <Printer className="w-5 h-5" />
            <span>{isPrinting ? 'Gerando...' : 'Imprimir'}</span>
        </button>
    );
}

export { LotteryTicketDocument };
