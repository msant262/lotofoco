'use client';

import { ResponsiveBar } from '@nivo/bar';

const theme = {
    background: "transparent",
    text: {
        fontSize: 12,
        fill: "#94a3b8", // slate-400
    },
    axis: {
        domain: {
            line: {
                stroke: "#334155", // slate-700
                strokeWidth: 1
            }
        },
        ticks: {
            line: {
                stroke: "#334155",
                strokeWidth: 1
            },
            text: {
                fill: "#94a3b8"
            }
        }
    },
    grid: {
        line: {
            stroke: "#1e293b", // slate-800
            strokeWidth: 1
        }
    },
    tooltip: {
        container: {
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '12px',
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #334155'
        }
    }
};

interface FrequencyChartProps {
    data: { number: string; frequency: number }[];
}

export function FrequencyChart({ data }: FrequencyChartProps) {
    return (
        <div className="h-[400px] w-full bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Dezenas Mais Frequentes</h3>
            <ResponsiveBar
                data={data}
                keys={['frequency']}
                indexBy="number"
                margin={{ top: 10, right: 10, bottom: 50, left: 50 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={['#10b981']} // Emerald-500
                borderColor={{
                    from: 'color',
                    modifiers: [['darker', 1.6]]
                }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Dezena',
                    legendPosition: 'middle',
                    legendOffset: 32
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Frequência',
                    legendPosition: 'middle',
                    legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                    from: 'color',
                    modifiers: [['darker', 1.6]]
                }}
                role="application"
                ariaLabel="Nivo bar chart demo"
                theme={theme}
            />
        </div>
    );
}
