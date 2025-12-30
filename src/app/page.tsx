import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database, Brain, Ticket, Lock, Check, Sparkles, TrendingUp, ChevronRight,
  Zap, Target, ShieldCheck, BarChart3, LineChart, PieChart, Lightbulb,
  AlertTriangle, X, ArrowRight, Star, Users, Clock, Trophy, Flame,
  Calculator, Activity, Eye, Filter, Percent
} from "lucide-react";
import { HeroAnimation } from "@/components/home/hero-animation";
import { FrequencyChart } from "@/components/dashboard/frequency-chart";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";

// Mock data for the teaser chart
const TEASER_DATA = [
  { number: '10', frequency: 12 },
  { number: '53', frequency: 11 },
  { number: '05', frequency: 10 },
  { number: '23', frequency: 9 },
  { number: '42', frequency: 8 },
];

const GAMES_SUPPORTED = [
  { name: 'Mega-Sena', color: '#209869', icon: '🍀' },
  { name: 'Lotofácil', color: '#930089', icon: '🎯' },
  { name: 'Quina', color: '#260085', icon: '⭐' },
  { name: 'Lotomania', color: '#F78100', icon: '🎰' },
  { name: 'Timemania', color: '#00ACC1', icon: '⚽' },
  { name: '+Milionária', color: '#003758', icon: '💎' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden pt-16 font-sans antialiased">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO - Capturar atenção imediata
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
        <HeroAnimation />

        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-slate-900/50 border border-slate-700/50 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">IA Avançada • Dados em Tempo Real</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-tight">
            Jogue para <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 animate-gradient-x">
              Vencer.
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Deixe a sorte para amadores. Utilize <span className="text-slate-200 font-medium">estatística avançada</span> e <span className="text-slate-200 font-medium">inteligência artificial</span> para gerar jogos de alta probabilidade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
            <Link href="/estatisticas" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_30px_-5px_theme('colors.emerald.500')] transition-all hover:scale-105">
                <Zap className="mr-2 h-5 w-5 fill-slate-950" />
                Gerar Palpite Grátis
              </Button>
            </Link>
            <Link href="#planos" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full h-14 px-8 text-lg text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700">
                Ver Assinaturas
              </Button>
            </Link>
          </div>

          <div className="pt-20 flex flex-wrap items-center justify-center gap-6 text-slate-600">
            {GAMES_SUPPORTED.slice(0, 4).map((game, i) => (
              <span key={i} className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-lg">{game.icon}</span>
                {game.name}
              </span>
            ))}
            <span className="text-sm text-slate-500">+ mais...</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-slate-500 rounded-full animate-scroll-down" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: O PROBLEMA - Agitar a dor do usuário
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-slate-900 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 border-red-500/30 text-red-400">O Problema</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              98% dos jogadores <span className="text-red-400">perdem dinheiro</span>
            </h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Eles jogam no escuro, escolhendo números por emoção. Você não precisa ser mais um.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: AlertTriangle,
                title: "Joga no chute",
                desc: "Escolher datas de aniversário ou números 'da sorte' não tem base estatística.",
                color: "red"
              },
              {
                icon: X,
                title: "Ignora padrões",
                desc: "Não analisa histórico, frequência ou comportamento dos sorteios anteriores.",
                color: "orange"
              },
              {
                icon: Clock,
                title: "Perde tempo",
                desc: "Horas pesquisando resultados quando poderia ter análise instantânea.",
                color: "yellow"
              }
            ].map((item, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-800 hover:border-red-500/30 transition-all group">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: A SOLUÇÃO - Nossa proposta de valor
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 border-emerald-500/30 text-emerald-400">A Solução</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              LotoFoco: <span className="text-emerald-400">Jogue com Inteligência</span>
            </h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Combinamos o poder da Inteligência Artificial com análise estatística profunda para você jogar com estratégia, não sorte.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur-xl" />
              <Card className="bg-slate-950 border-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white">IA Avançada</div>
                      <div className="text-xs text-slate-500">Processando...</div>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-100" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-200" />
                    </div>
                  </div>

                  {/* Números gerados */}
                  <div className="bg-slate-900 rounded-xl p-6 mb-6">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Palpite Mega-Sena #2835</div>
                    <div className="flex gap-3 justify-center">
                      {['07', '15', '28', '35', '42', '59'].map((num, i) => (
                        <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-emerald-500/20">
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-emerald-400">94%</div>
                      <div className="text-xs text-slate-500">Confiança</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-400">1.2M</div>
                      <div className="text-xs text-slate-500">Combinações</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-400">0.8s</div>
                      <div className="text-xs text-slate-500">Tempo</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              {[
                { icon: TrendingUp, title: "Análise de Frequência", desc: "Identifica números quentes e frios baseado no histórico." },
                { icon: BarChart3, title: "Mapas de Calor", desc: "Visualize padrões invisíveis ao olho humano." },
                { icon: Filter, title: "Filtros Avançados", desc: "Primos, pares, sequências e muito mais." },
                { icon: Brain, title: "IA Preditiva", desc: "Algoritmos que aprendem com cada sorteio." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: FUNCIONALIDADES - Mostrar o produto
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-slate-900 border-t border-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 border-slate-500/30 text-slate-400">Funcionalidades</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Tudo que você precisa em <span className="text-emerald-400">uma plataforma</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: LineChart,
                title: "Dashboard Analítico",
                desc: "Visualize estatísticas completas de todas as loterias em tempo real.",
                badge: "Popular"
              },
              {
                icon: Calculator,
                title: "Gerador Inteligente",
                desc: "IA que gera palpites baseados em padrões estatísticos comprovados.",
                badge: "IA"
              },
              {
                icon: PieChart,
                title: "Mapa de Frequência",
                desc: "Heatmap visual mostrando os números mais e menos sorteados.",
                badge: null
              },
              {
                icon: Activity,
                title: "Análise de Atraso",
                desc: "Identifique números que estão 'atrasados' e podem sair em breve.",
                badge: null
              },
              {
                icon: Eye,
                title: "Histórico Completo",
                desc: "Acesso a todos os sorteios desde o início de cada loteria.",
                badge: "Exclusivo"
              },
              {
                icon: Lightbulb,
                title: "Insights Premium",
                desc: "Dicas e recomendações baseadas em IA para cada sorteio.",
                badge: "Premium"
              },
            ].map((item, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                {item.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                      {item.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 transition-colors">
                    <item.icon className="w-7 h-7 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: COMO FUNCIONA - Processo simples
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="py-32 bg-slate-950 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 border-emerald-500/30 text-emerald-400">3 Passos Simples</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">Como funciona?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-xl leading-relaxed">Um processo transparente e rápido.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Linha conectora (Desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-emerald-900 to-transparent border-t border-dashed border-slate-800" />

            {[
              { icon: Database, title: "Escolha a Loteria", desc: "Mega-Sena, Lotofácil, Quina ou qualquer outra que preferir.", step: "01" },
              { icon: Brain, title: "IA Analisa", desc: "Processamento de milhões de combinações em segundos.", step: "02" },
              { icon: Ticket, title: "Receba seu Palpite", desc: "Números otimizados estatisticamente prontos para jogar.", step: "03" }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 group-hover:-translate-y-1">
                  <div className="absolute top-4 right-6 text-6xl font-black text-slate-800/20 select-none">{item.step}</div>

                  <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center mb-6 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-7 h-7 text-emerald-400" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6: PROVA SOCIAL - Construir confiança
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 border-amber-500/30 text-amber-400">Resultados</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Números que <span className="text-amber-400">falam por si</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50K+", label: "Palpites Gerados", icon: Ticket },
              { value: "11", label: "Loterias Suportadas", icon: Target },
              { value: "10M+", label: "Sorteios Analisados", icon: Database },
              { value: "99.9%", label: "Uptime", icon: Activity },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 transition-colors">
                <stat.icon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7: PRICING - Invista na sua Sorte
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="planos" className="py-32 px-6 bg-slate-950 relative overflow-hidden border-t border-slate-800/50">
        {/* Decoração de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-20 relative z-10">
          <div className="text-center space-y-6">
            <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-400">Planos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Invista na sua Sorte</h2>
            <p className="text-slate-400 text-xl">Escolha o plano que se adapta à sua estratégia de jogo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
            {/* Micro */}
            <Card className="bg-slate-950/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-200 text-xl">Micro</CardTitle>
                <CardDescription>Para testar a plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline text-slate-200">
                  <span className="text-3xl font-bold">R$ 1,00</span>
                  <span className="text-sm font-normal text-slate-500 ml-2">/ palpite</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-slate-600" /> 1 Palpite IA</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-slate-600" /> Histórico Básico</li>
                </ul>
                <Button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold h-12">
                  Comprar Créditos
                </Button>
              </CardContent>
            </Card>

            {/* Mensal */}
            <Card className="bg-slate-950 border-slate-700 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-2xl flex items-center gap-2">
                  Mensal
                </CardTitle>
                <CardDescription>Para jogadores recorrentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline text-emerald-400">
                  <span className="text-5xl font-bold tracking-tight">R$ 9,90</span>
                  <span className="text-sm font-normal text-slate-500 ml-2">/ mês</span>
                </div>
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="text-sm font-medium text-white">Tudo Incluído:</div>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-emerald-500" /> Gerações <strong>Ilimitadas</strong></li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-emerald-500" /> Dashboard Completo</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-emerald-500" /> Análise de Padrões</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-emerald-500" /> Mapas de Calor</li>
                  </ul>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 shadow-lg shadow-emerald-900/20">
                  Assinar Mensal
                </Button>
              </CardContent>
            </Card>

            {/* Anual (Hero) */}
            <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl shadow-amber-900/10 relative scale-105 z-10">
              <div className="absolute -top-5 inset-x-0 flex justify-center">
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold border-none px-4 py-1.5 shadow-lg animate-pulse">
                  🔥 MELHOR VALOR • 3 MESES GRÁTIS
                </Badge>
              </div>
              <CardHeader className="pt-10 pb-4">
                <CardTitle className="text-amber-400 text-2xl">Anual</CardTitle>
                <CardDescription className="text-slate-400">Máxima inteligência e economia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline text-white">
                    <span className="text-5xl font-bold tracking-tight">R$ 89,90</span>
                    <span className="text-sm font-normal text-slate-500 ml-2">/ ano</span>
                  </div>
                  <p className="text-xs text-amber-500/80 font-medium mt-2">Equivalente a R$ 7,49 / mês</p>
                </div>

                <ul className="space-y-3 text-sm text-slate-300 border-t border-slate-800 pt-6">
                  <li className="flex items-center"><ShieldCheck className="w-5 h-5 mr-3 text-amber-400" /> <strong>Acesso VIP Ilimitado</strong></li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-amber-500" /> Suporte Prioritário</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-amber-500" /> Economia de 25%</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-3 text-amber-500" /> Insights Exclusivos</li>
                </ul>

                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold h-14 text-lg shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]">
                  Quero Economizar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8: CTA FINAL - Última chamada para ação
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-10">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Comece agora mesmo</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            Pronto para jogar <span className="text-emerald-400">diferente</span>?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Milhares de brasileiros já descobriram o poder da análise estatística. Não fique para trás.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/estatisticas">
              <Button size="lg" className="h-14 px-10 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_30px_-5px_theme('colors.emerald.500')] transition-all hover:scale-105">
                <Zap className="mr-2 h-5 w-5 fill-slate-950" />
                Gerar Palpite Grátis
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500 mt-6">
            ✓ Sem cartão de crédito &nbsp;&nbsp; ✓ Acesso instantâneo &nbsp;&nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9: FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-950 border-t border-slate-900/50 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="space-y-6 col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-emerald-500" />
              <span className="text-xl font-bold text-white">Loto<span className="text-emerald-500">Foco</span></span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Plataforma líder em análise estatística para loterias, ajudando milhares de brasileiros a jogarem com mais inteligência.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-white mb-6">Plataforma</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="#como-funciona" className="hover:text-emerald-400 transition-colors">Como Funciona</Link></li>
              <li><Link href="#planos" className="hover:text-emerald-400 transition-colors">Preços</Link></li>
              <li><Link href="/estatisticas" className="hover:text-emerald-400 transition-colors">Estatísticas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Privacidade</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Jogo Responsável</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Aviso Importante</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Este serviço é apenas uma ferramenta de análise estatística. Não prometemos ganhos financeiros. Jogos de loteria envolvem risco. Jogue com moderação. +18.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-12 mt-12 border-t border-slate-900 text-center text-slate-600 text-xs">
          © {new Date().getFullYear()} LotoFoco Tecnologia. Desenvolvido com IA.
        </div>
      </footer>
      <ScrollToTopButton />
    </div >
  );
}
