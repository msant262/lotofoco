'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ArrowRight, CheckCircle } from "lucide-react";
import anime from 'animejs';
import { useEffect, useRef } from "react";

interface SuccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPrint: () => void;
    onClose: () => void;
}

export function SuccessModal({ open, onOpenChange, onPrint, onClose }: SuccessModalProps) {
    const iconRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            // Animate Icon
            if (iconRef.current) {
                anime.timeline()
                    .add({
                        targets: iconRef.current,
                        scale: [0, 1],
                        rotate: [-180, 0],
                        duration: 800,
                        easing: 'spring(1, 80, 10, 0)'
                    });
            }

            // Animate Content
            if (contentRef.current) {
                anime({
                    targets: contentRef.current.children,
                    translateY: [20, 0],
                    opacity: [0, 1],
                    delay: anime.stagger(100, { start: 200 }),
                    duration: 800,
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm flex flex-col items-center justify-center p-8 gap-6 shadow-2xl">

                {/* Icon Animation Container */}
                <div ref={iconRef} className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>

                {/* Content */}
                <div ref={contentRef} className="text-center space-y-4">
                    <div>
                        <DialogTitle className="text-2xl font-bold text-white mb-2 text-center">Sucesso!</DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm text-center">
                            Seus palpites foram salvos corretamente em sua conta. Boa sorte!
                        </DialogDescription>
                    </div>

                    <div className="flex flex-col gap-3 w-full pt-4">
                        <Button
                            onClick={onPrint}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12 shadow-lg shadow-yellow-900/20"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            IMPRIMIR AGORA
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-12"
                        >
                            Continuar Gerando
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
