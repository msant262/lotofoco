'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { LotteryConfig, SOCCER_TEAMS } from "@/lib/config/lotteries";
import { Input, Pagination, Card, CardBody, CardHeader, Chip, Button, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Search, ChevronLeft, ChevronRight, Clover, Calendar, Heart } from "lucide-react";
import anime from 'animejs';

interface VolanteGridProps {
    config: LotteryConfig;
    selectedNumbers: string[];
    onToggle: (num: string) => void;
    maxSelection: number;
    selectedExtras: string[];
    onToggleExtra: (num: string) => void;
    maxExtra: number;
}

const NUMBERS_PER_PAGE = 120;
const COLUMNS = 6;

const MONTHS = [
    { value: "1", label: "Janeiro", short: "JAN" },
    { value: "2", label: "Fevereiro", short: "FEV" },
    { value: "3", label: "Março", short: "MAR" },
    { value: "4", label: "Abril", short: "ABR" },
    { value: "5", label: "Maio", short: "MAI" },
    { value: "6", label: "Junho", short: "JUN" },
    { value: "7", label: "Julho", short: "JUL" },
    { value: "8", label: "Agosto", short: "AGO" },
    { value: "9", label: "Setembro", short: "SET" },
    { value: "10", label: "Outubro", short: "OUT" },
    { value: "11", label: "Novembro", short: "NOV" },
    { value: "12", label: "Dezembro", short: "DEZ" },
];

export function VolanteGrid({
    config,
    selectedNumbers,
    onToggle,
    maxSelection,
    selectedExtras,
    onToggleExtra,
    maxExtra
}: VolanteGridProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Main Numbers - supports startFrom (default 1, Super Sete uses 0)
    const startFrom = config.startFrom ?? 1;
    const allNumbers = useMemo(() =>
        Array.from({ length: config.range }, (_, i) =>
            String(i + startFrom).padStart(2, '0')
        ), [config.range, startFrom]);

    // Filter by search
    const filteredNumbers = useMemo(() => {
        if (!searchQuery) return allNumbers;
        return allNumbers.filter(num => num.includes(searchQuery));
    }, [allNumbers, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredNumbers.length / NUMBERS_PER_PAGE);
    const needsPagination = config.range > NUMBERS_PER_PAGE;

    const paginatedNumbers = useMemo(() => {
        const start = (currentPage - 1) * NUMBERS_PER_PAGE;
        return filteredNumbers.slice(start, start + NUMBERS_PER_PAGE);
    }, [filteredNumbers, currentPage]);

    // Extra Numbers
    const hasExtras = config.extraType !== 'none';
    const extras = useMemo(() => {
        if (config.extraType === 'trevos') {
            return Array.from({ length: config.extraRange || 6 }, (_, i) => String(i + 1));
        } else if (config.extraType === 'months') {
            return MONTHS.map(m => m.value);
        } else if (config.extraType === 'teams') {
            return Array.from({ length: config.extraRange || 80 }, (_, i) => String(i + 1));
        }
        return [];
    }, [config.extraType, config.extraRange]);

    // Animation on mount
    useEffect(() => {
        anime({
            targets: '.volante-number',
            scale: [0.8, 1],
            opacity: [0, 1],
            delay: anime.stagger(5, { start: 100 }),
            duration: 300,
            easing: 'easeOutBack'
        });
    }, [currentPage, searchQuery]);

    // Jump to page when searching for a specific number
    useEffect(() => {
        if (searchQuery && searchQuery.length >= 1) {
            const num = searchQuery.padStart(2, '0');
            const idx = allNumbers.indexOf(num);
            if (idx !== -1) {
                const page = Math.floor(idx / NUMBERS_PER_PAGE) + 1;
                setCurrentPage(page);
            }
        }
    }, [searchQuery, allNumbers]);

    return (
        <div className="space-y-6">
            {/* ========== MAIN GRID ========== */}
            <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-2 border-white/10 shadow-2xl backdrop-blur-xl">
                <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full shadow-lg"
                            style={{ background: config.hexColor, boxShadow: `0 0 20px ${config.hexColor}50` }}
                        />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">
                            Volante Principal
                        </span>
                        <Chip
                            size="sm"
                            variant="flat"
                            className={cn(
                                "font-bold",
                                selectedNumbers.length === maxSelection
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-slate-700/50 text-slate-400"
                            )}
                        >
                            {selectedNumbers.length} / {maxSelection}
                        </Chip>
                    </div>

                    {/* Search Bar (only for large grids) */}
                    {config.range > 50 && (
                        <Input
                            size="sm"
                            placeholder="Buscar número..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            startContent={<Search className="w-4 h-4 text-slate-500" />}
                            classNames={{
                                base: "max-w-[200px]",
                                inputWrapper: "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
                            }}
                        />
                    )}
                </CardHeader>

                <CardBody className="px-4 sm:px-6 pb-6">
                    {/* Numbers Grid - 6 columns */}
                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                        {paginatedNumbers.map((num) => {
                            const isSelected = selectedNumbers.includes(num);
                            const isLimitReached = selectedNumbers.length >= maxSelection && !isSelected;

                            return (
                                <button
                                    key={num}
                                    onClick={() => onToggle(num)}
                                    disabled={isLimitReached}
                                    className={cn(
                                        "volante-number aspect-square rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black transition-all duration-300 border-2",
                                        isSelected
                                            ? "text-white scale-105 shadow-xl ring-2 ring-offset-2 ring-offset-slate-900"
                                            : "bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 hover:scale-105",
                                        isLimitReached && "opacity-30 grayscale cursor-not-allowed hover:scale-100"
                                    )}
                                    style={{
                                        backgroundColor: isSelected ? config.hexColor : undefined,
                                        borderColor: isSelected ? config.hexColor : undefined,
                                        color: isSelected && config.lightText ? '#000' : undefined,
                                        boxShadow: isSelected ? `0 0 30px -5px ${config.hexColor}80` : undefined
                                    }}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {needsPagination && totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                className="bg-slate-800/50"
                                isDisabled={currentPage === 1}
                                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <Pagination
                                total={totalPages}
                                page={currentPage}
                                onChange={setCurrentPage}
                                color="success"
                                size="sm"
                                showControls={false}
                                classNames={{
                                    item: "bg-slate-800/50 text-slate-400",
                                    cursor: "font-bold"
                                }}
                            />

                            <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                className="bg-slate-800/50"
                                isDisabled={currentPage === totalPages}
                                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Selected Numbers Summary */}
                    {selectedNumbers.length > 0 && (
                        <div className="mt-6 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
                                Números Selecionados
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedNumbers.sort((a, b) => parseInt(a) - parseInt(b)).map(num => (
                                    <Chip
                                        key={num}
                                        size="sm"
                                        variant="flat"
                                        className="font-bold cursor-pointer hover:scale-105 transition-transform"
                                        style={{
                                            backgroundColor: `${config.hexColor}30`,
                                            color: config.hexColor
                                        }}
                                        onClose={() => onToggle(num)}
                                    >
                                        {num}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* ========== EXTRAS SECTION ========== */}
            {hasExtras && (
                <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-2 border-yellow-500/20 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="flex justify-between items-center px-6 pt-6 pb-4">
                        <div className="flex items-center gap-3">
                            {config.extraType === 'trevos' && <Clover className="w-5 h-5 text-yellow-400" />}
                            {config.extraType === 'months' && <Calendar className="w-5 h-5 text-amber-400" />}
                            {config.extraType === 'teams' && <Heart className="w-5 h-5 text-red-400" />}
                            <span className="text-sm font-bold text-white uppercase tracking-wider">
                                {config.extraName || 'Extras'}
                            </span>
                            <Chip
                                size="sm"
                                variant="flat"
                                className={cn(
                                    "font-bold",
                                    selectedExtras.length === maxExtra
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-slate-700/50 text-slate-400"
                                )}
                            >
                                {selectedExtras.length} / {maxExtra}
                            </Chip>
                        </div>
                    </CardHeader>

                    <CardBody className="px-6 pb-6">
                        {/* Trevos Grid */}
                        {config.extraType === 'trevos' && (
                            <div className="grid grid-cols-6 gap-3">
                                {extras.map((num) => {
                                    const isSelected = selectedExtras.includes(num);
                                    const isLimitReached = selectedExtras.length >= maxExtra && !isSelected;

                                    return (
                                        <button
                                            key={num}
                                            onClick={() => onToggleExtra(num)}
                                            disabled={isLimitReached}
                                            className={cn(
                                                "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 font-black transition-all duration-300 border-2",
                                                isSelected
                                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-400 text-black scale-105 shadow-xl shadow-yellow-500/30"
                                                    : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white hover:scale-105",
                                                isLimitReached && "opacity-30 cursor-not-allowed"
                                            )}
                                        >
                                            <Clover className={cn("w-6 h-6", isSelected ? "text-black" : "text-yellow-500/50")} />
                                            <span className="text-lg">{num}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Months Grid */}
                        {config.extraType === 'months' && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                {MONTHS.map((month) => {
                                    const isSelected = selectedExtras.includes(month.value);
                                    const isLimitReached = selectedExtras.length >= maxExtra && !isSelected;

                                    return (
                                        <button
                                            key={month.value}
                                            onClick={() => onToggleExtra(month.value)}
                                            disabled={isLimitReached}
                                            className={cn(
                                                "py-4 px-2 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all duration-300 border-2",
                                                isSelected
                                                    ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-400 text-black scale-105 shadow-xl shadow-amber-500/30"
                                                    : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white hover:scale-105",
                                                isLimitReached && "opacity-30 cursor-not-allowed"
                                            )}
                                        >
                                            <Calendar className={cn("w-5 h-5", isSelected ? "text-black" : "text-amber-500/50")} />
                                            <span className="text-sm">{month.short}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Teams Select (Timemania) */}
                        {config.extraType === 'teams' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-400" />
                                        Selecione seu Time do Coração
                                    </label>
                                    <Autocomplete
                                        aria-label="Time do Coração"
                                        placeholder="Digite para buscar..."
                                        defaultItems={extras.map((num, idx) => ({
                                            value: num,
                                            label: SOCCER_TEAMS[idx] || `Time ${num}`
                                        }))}
                                        selectedKey={selectedExtras[0] || null}
                                        onSelectionChange={(key) => {
                                            if (key) {
                                                // Clear previous selection
                                                selectedExtras.forEach(e => onToggleExtra(e));
                                                // Add new selection
                                                onToggleExtra(String(key));
                                            }
                                        }}
                                        classNames={{
                                            base: "w-full",
                                            listboxWrapper: "max-h-[300px]"
                                        }}
                                        inputProps={{
                                            classNames: {
                                                input: "text-white placeholder:text-slate-500",
                                                inputWrapper: "bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/50 data-[focus=true]:bg-slate-700/50 h-12"
                                            }
                                        }}
                                        listboxProps={{
                                            itemClasses: {
                                                base: "data-[hover=true]:bg-slate-700/50 data-[selected=true]:bg-red-500/20"
                                            }
                                        }}
                                        popoverProps={{
                                            classNames: {
                                                content: "bg-slate-900 border border-slate-700"
                                            }
                                        }}
                                        startContent={<Heart className="w-5 h-5 text-red-400" />}
                                    >
                                        {(item) => (
                                            <AutocompleteItem key={item.value} textValue={item.label}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-500 w-8 text-right">{item.value}.</span>
                                                    <span className="font-medium text-white">{item.label}</span>
                                                </div>
                                            </AutocompleteItem>
                                        )}
                                    </Autocomplete>
                                </div>

                                {selectedExtras.length > 0 && (
                                    <div className="p-4 bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                                            <Heart className="w-7 h-7 text-white fill-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-red-300 uppercase tracking-wider font-bold">Seu Time do Coração</p>
                                            <p className="text-xl font-black text-white">
                                                {SOCCER_TEAMS[parseInt(selectedExtras[0]) - 1] || `Time ${selectedExtras[0]}`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
