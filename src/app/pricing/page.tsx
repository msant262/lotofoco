import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Gradients/Effects for Premium feel */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10" />

            <div className="max-w-6xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Planos & Preços
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                        Maximize suas chances com a inteligência artificial do LotoFoco.
                        Escolha o plano ideal para sua estratégia.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Plan: Avulso */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm relative overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl text-slate-200">Avulso</CardTitle>
                            <CardDescription>Para jogadas esporádicas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-bold text-white">R$ 1,00</span>
                                <span className="text-slate-500">/ geração</span>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Acesso à IA de Ponta</li>
                                <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Histórico básico (10 últimos)</li>
                                <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Sem expiração de créditos</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">Comprar Créditos</Button>
                        </CardFooter>
                    </Card>

                    {/* Plan: Pro Mensal */}
                    <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-md scale-105 border-2 shadow-2xl shadow-emerald-500/10 z-10 relative">
                        <div className="absolute top-0 right-0 p-3">
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Mais Popular</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl text-emerald-400">Pro Mensal</CardTitle>
                            <CardDescription>Para jogadores frequentes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-5xl font-bold text-white">R$ 9,90</span>
                                <span className="text-slate-500">/ mês</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-200">
                                <li className="flex items-center"><Check className="w-5 h-5 mr-2 text-emerald-400" /> <strong>Gerações Ilimitadas</strong></li>
                                <li className="flex items-center"><Check className="w-5 h-5 mr-2 text-emerald-400" /> Análise Estatística Avançada</li>
                                <li className="flex items-center"><Check className="w-5 h-5 mr-2 text-emerald-400" /> Prompt Pro (100 últimos resultados)</li>
                                <li className="flex items-center"><Check className="w-5 h-5 mr-2 text-emerald-400" /> Painel de Dashboard Completo</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg h-12">Assinar Agora</Button>
                        </CardFooter>
                    </Card>

                    {/* Plan: Pro Anual */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm relative overflow-visible">
                        <div className="absolute -top-4 inset-x-0 flex justify-center">
                            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 border-none px-4 py-1 animate-bounce shadow-lg">
                                Assine o anual e ganhe 3 meses GRÁTIS
                            </Badge>
                        </div>
                        <CardHeader className="mt-4">
                            <CardTitle className="text-xl text-slate-200">Pro Anual</CardTitle>
                            <CardDescription>Melhor custo-benefício</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-bold text-white">R$ 89,90</span>
                                <span className="text-slate-500">/ ano</span>
                            </div>
                            <p className="text-xs text-slate-400">Equivalente a R$ 7,49/mês</p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Todos os benefícios Pro</li>
                                <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Economia de 25%</li>
                                <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Suporte Prioritário</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300">Assinar Anual</Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="text-center pt-8">
                    <p className="text-slate-500">
                        Novos usuários ganham <span className="text-white font-bold">2 créditos grátis</span> ao se cadastrar.
                    </p>
                </div>
            </div>
        </div>
    )
}
