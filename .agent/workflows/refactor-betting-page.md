---
description: Redesign completo da página de apostas com HeroUI, Nivo e animejs
---

# 🎰 Redesign da Página de Apostas

## 📋 Requisitos

### 1. Limite de Bilhetes
- **Free/Anônimo**: Máximo 2 bilhetes por vez
- **Pro**: Até 20 bilhetes por vez

### 2. Grid do Volante
- **6 números por linha** (atualmente variável)
- **Tamanho maior** dos números
- **Paginação**: Limite de 120 números no grid
- **Barra de pesquisa** para encontrar números

### 3. Características por Loteria
| Loteria | Extra | Tipo |
|---------|-------|------|
| Timemania | Time do Coração | 80 times (select) |
| Dia de Sorte | Mês da Sorte | 12 meses (grid) |
| +Milionária | Trevos | 6 trevos (grid) |
| Dupla Sena | 2 jogos | Mesmo bilhete |
| Super Sete | 7 colunas | Layout especial |
| Loteca | 14 jogos | Futebol |

### 4. Prompt Dinâmico por Loteria
Baseado em estatísticas:
- Pares que mais saem juntos
- Números com maior atraso
- Média da soma dos sorteios
- Frequência de números
- Análise de paridade (par/ímpar)
- Análise de décadas

## 🔧 Implementação

### Fase 1: Estrutura Base
1. [ ] Criar hook `useBettingLimits` para controle de limites
2. [ ] Atualizar `VolanteGrid` com 6 colunas e tamanho maior
3. [ ] Adicionar paginação e busca ao grid

### Fase 2: Componentes por Loteria
4. [ ] Criar `TimeSelector` para Timemania (seletor de time)
5. [ ] Criar `MonthSelector` para Dia de Sorte (grid de meses)
6. [ ] Criar `TrevoSelector` para +Milionária (grid de trevos)
7. [ ] Criar `DuplaSenaLayout` para Dupla Sena (2 jogos)
8. [ ] Melhorar `SuperSeteLayout` (7 colunas independentes)

### Fase 3: Prompt Inteligente
9. [ ] Criar API `/api/stats/[gameSlug]` para estatísticas
10. [ ] Promp dinâmico baseado em estatísticas reais
11. [ ] Exibir dicas de estatísticas na UI

### Fase 4: UI/UX
12. [ ] Redesign com HeroUI (Cards, Chips, Progress, etc)
13. [ ] Animações com animejs (entrada, seleção, geração)
14. [ ] Gráficos com Nivo (estatísticas visuais)

## 📁 Arquivos a Modificar

```
src/
├── app/apostas/[gameSlug]/
│   └── GamePageClient.tsx          # Página principal
├── components/lottery/
│   ├── volante-grid.tsx            # Grid principal
│   ├── lottery-extras/
│   │   ├── time-selector.tsx       # Timemania
│   │   ├── month-selector.tsx      # Dia de Sorte
│   │   ├── trevo-selector.tsx      # +Milionária
│   │   └── column-selector.tsx     # Super Sete
│   └── betting-controls.tsx        # Controles unificados
├── hooks/
│   └── use-betting-limits.ts       # Hook de limites
└── lib/
    └── prompts/
        └── lottery-prompts.ts       # Prompts por loteria
```

## 🎨 Design System

### Cores por Loteria
- Mega-Sena: #209869 (Verde)
- Lotofácil: #930089 (Roxo)
- Quina: #260085 (Índigo)
- Lotomania: #F78100 (Laranja)
- Timemania: #FFF100 (Amarelo)
- Dupla Sena: #A61317 (Vermelho)
- Dia de Sorte: #CB8322 (Âmbar)
- Super Sete: #BEDC00 (Lima)
- +Milionária: #003758 (Azul)

### Animações
- Entrada de números: stagger fade-in
- Seleção: scale bounce + pulse
- Geração: reveal sequencial
- Sucesso: confetti + celebration

// turbo-all
