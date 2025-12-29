import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Brain, Ticket, Lock, Check, Sparkles, TrendingUp, ChevronRight, Zap, Target, ShieldCheck } from "lucide-react";
import { HeroAnimation } from "@/components/home/hero-animation";
import { FrequencyChart } from "@/components/dashboard/frequency-chart";
import { Navbar } from "@/components/layout/navbar";

// Mock data for the teaser chart
const TEASER_DATA = [
  { number: '10', frequency: 12 },
  { number: '53', frequency: 11 },
  { number: '05', frequency: 10 },
  { number: '23', frequency: 9 },
  { number: '42', frequency: 8 },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden pt-16 font-sans">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950">
        <HeroAnimation />

        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-slate-900/50 border border-slate-700/50 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">IA Gemini 1.5 Ativa</span>
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

          <div className="pt-12 flex items-center justify-center gap-8 text-slate-600 text-sm font-medium uppercase tracking-widest opacity-60">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Mega-Sena</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Lotofácil</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Quina</span>
          </div>
        </div>
      </section>

      {/* 2. Spotlight Section (Dashboard Preview) - "O que a estatística diz?" */}
      <section className="py-32 px-6 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-contain bg-center opacity-5" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">

          {/* Texto */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-block p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              A matemática não mente.
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed">
              Nossa plataforma processa gigabytes de dados históricos para identificar padrões invisíveis ao olho humano.
              Enquanto outros jogam datas de aniversário, você joga baseado em <span className="text-emerald-400 font-medium">tendências reais</span>.
            </p>

            <div className="space-y-4 pt-4">
              {['Frequência de Dezenas', 'Análise de Atraso (Delay)', 'Mapas de Calor', 'Padrões Pares/Ímpares'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Interativo/Card */}
          <div className="flex-1 w-full max-w-[600px] relative">
            {/* Background Blob */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20"></div>

            <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative">
              {/* Header do Mockup */}
              <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-900/50">
                <span className="text-sm font-mono text-emerald-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live_Analysis_v2.0
                </span>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
              </div>

              {/* Conteudo do Mockup */}
              <div className="p-6 space-y-6">
                {/* Gráfico Visível */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Frequência (Últimos 100 sorteios)</p>
                  <div className="h-48 w-full bg-slate-950/50 rounded-lg border border-slate-800/50 p-2">
                    <FrequencyChart data={TEASER_DATA} />
                  </div>
                </div>

                {/* Área Bloqueada */}
                <div className="relative rounded-xl overflow-hidden group cursor-pointer border border-slate-800/50">
                  {/* Conteúdo borrado */}
                  <div className="p-4 bg-slate-950 filter blur-sm opacity-50 space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-800 w-1/3 rounded"></div>
                      <div className="h-4 bg-slate-800 w-12 rounded"></div>
                    </div>
                    <div className="h-2 bg-slate-800/50 w-full rounded"></div>
                    <div className="h-2 bg-slate-800/50 w-3/4 rounded"></div>
                    <div className="h-10 bg-slate-800 rounded mt-2"></div>
                  </div>

                  {/* Overlay de Bloqueio */}
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 transition-colors group-hover:bg-slate-900/50">
                    <div className="bg-slate-950 p-3 rounded-full border border-slate-700 shadow-xl mb-3 group-hover:scale-110 transition-transform">
                      <Lock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-bold">Insights Premium</h3>
                    <p className="text-xs text-slate-400 max-w-[200px] mt-1">
                      Acesso aos filtros de Primos, Pares e Sequências.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Como Funciona (Refatorado) */}
      <section id="como-funciona" className="py-32 bg-slate-900 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-400">Workflow</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Como garantimos resultados?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Um processo transparente que transforma dados brutos em palpites estratégicos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Linha conectora (Desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-emerald-900 to-transparent -z-1 border-t border-dashed border-slate-800"></div>

            {[
              { icon: Database, title: "Coleta Oficial", desc: "Sincronização diária com os servidores da Caixa Econômica Federal.", step: "01" },
              { icon: Brain, title: "Análise IA", desc: "O algoritmo Gemini 1.5 processa milhões de combinações em segundos.", step: "02" },
              { icon: Ticket, title: "Palpite Gerado", desc: "Você recebe os números com maior probabilidade matemática de acerto.", step: "03" }
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

      {/* 4. Pricing (Melhorado) */}
      <section id="planos" className="py-32 px-6 bg-slate-950 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Invista na sua Sorte</h2>
            <p className="text-slate-400 text-lg">Escolha o plano que se adapta à sua estratégia de jogo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            {/* Micro */}
            <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-200 text-xl">Micro</CardTitle>
                <CardDescription>Para testar a plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline text-slate-200">
                  <span className="text-3xl font-bold">R$ 1,00</span>
                  <span className="text-sm font-normal text-slate-500 ml-2">/ aposta</span>
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
            <Card className="bg-slate-900 border-slate-700 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
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
                  BEST SELLER • 3 MÊSES GRÁTIS
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
                </ul>

                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold h-14 text-lg shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]">
                  Quero Economizar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/50 py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-emerald-500" />
              <span className="text-xl font-bold text-white">Loto<span className="text-emerald-500">Foco</span></span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Plataforma líder em análise estatística para loterias, ajudando milhares de brasileiros a jogarem com mais inteligência.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Plataforma</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Como Funciona</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Preços</Link></li>
              <li><Link href="#" className="hover:text-emerald-400 transition-colors">Resultados</Link></li>
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
    </div>
  );
}
