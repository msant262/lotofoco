'use client';

import { ResponsiveHeatMap } from '@nivo/heatmap';

const theme = {
    background: "transparent",
    text: { fontSize: 11, fill: "#94a3b8" },
    axis: {
        ticks: { text: { fill: "#94a3b8" } },
        legend: { text: { fill: "#cbd5e1" } }
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

interface HeatmapChartProps {
    data: any[]; // Nivo Heatmap data structure
}

export function HeatmapChart({ data }: HeatmapChartProps) {
    return (
        <div className="h-[400px] w-full bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Correlação (Heatmap)</h3>
            <ResponsiveHeatMap
                data={data}
                margin={{ top: 20, right: 60, bottom: 60, left: 60 }}
                valueFormat=">-.2s"
                axisTop={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -90,
                    legend: '',
                    legendOffset: 36
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Dezena',
                    legendPosition: 'middle',
                    legendOffset: -40
                }}
                colors={{
                    type: 'sequential',
                    scheme: 'greens'
                }}
                emptyColor="#1e293b"
                borderColor={{
                    from: 'color',
                    modifiers: [['darker', 0.8]]
                }}
                labelTextColor={{
                    from: 'color',
                    modifiers: [['darker', 2]]
                }}
                theme={theme}
            />
        </div>
    );
}
