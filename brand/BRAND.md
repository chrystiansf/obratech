# OBRATECH — Guia de identidade visual para o sistema

Identidade escolhida: **01 · O Bloco**.
Este guia é a fonte da verdade para repaginar a interface. Tokens prontos em `tokens/`, logos em `logo/`, componente React em `components/Logo.tsx` e uma página de referência visual em `preview.html`.

---

## 1. Conceito

Um "o" desenhado com um traço único, quase fechado, que se completa com um **bloco** laranja: a obra fechando cada etapa.
Personalidade: **moderna, leve, confiável e precisa**. Menos "canteiro barulhento", mais "gestão sob controle".

Princípios para a interface:
- **Calma e clara:** muito branco/areia, grafite para texto, laranja só onde importa.
- **O laranja é o bloco:** ele marca o que está ativo, selecionado, em andamento ou é a ação principal da tela. Se tudo for laranja, nada é.
- **Números em destaque:** valores, percentuais, datas e códigos em IBM Plex Mono, com algarismos tabulares.

---

## 2. Logo

| Arquivo | Uso |
|---|---|
| `logo/obratech-logo-horizontal.svg` | Padrão: cabeçalho, login, relatórios, e-mails |
| `logo/obratech-logo-horizontal-negativo.svg` | Fundos escuros (grafite) |
| `logo/obratech-logo-horizontal-mono.svg` | Impressão em uma cor |
| `logo/obratech-logo-vertical(-negativo).svg` | Telas de splash, capas, espaços quadrados |
| `logo/obratech-wordmark.svg` | Só o nome |
| `logo/obratech-simbolo(-negativo, -mono).svg` | Símbolo isolado (menu recolhido, avatar, loading) |
| `logo/obratech-simbolo-32px.svg` | Versão reforçada para 24–36 px |
| `logo/favicon.svg` | Favicon (16 px), traço mais grosso |
| `logo/app-icon-escuro.svg` / `app-icon-claro.svg` | Ícone do app / PWA (512×512) |

Os SVGs de logo têm o texto convertido em curvas: não dependem de fonte.

**Construção do símbolo** (viewBox 64×64):
- Arco: `M54 32 A22 22 0 1 1 32 10`, traço grafite, `stroke-linecap: round`, espessura 6,5.
- Bloco: quadrado 10×10 em (42, 12), `rx 2`, cor `#EE5A24`.
- Em tamanhos pequenos o traço engrossa (32 px: traço 8, bloco 12 em (41,11); 16 px: traço 10, bloco 14 em (40,10)). O componente `Simbolo` já faz isso.

**Nome:** `obra` em Sora SemiBold (600) + `tech` em Sora Light (300), sempre minúsculo, tracking −0,03em.
O produto se chama **OBRATECH** em textos corridos e títulos de página; o logo é sempre em minúsculas.

**Regras:**
- Área de proteção: no mínimo a altura do bloco (1/6 do símbolo) livre em volta.
- Tamanho mínimo: logo horizontal com 20 px de altura; símbolo sozinho 16 px.
- O bloco é sempre laranja (ou da mesma cor do traço na versão mono). Nunca troque a cor do bloco por outra cor de estado.
- Não girar, não distorcer, não aplicar sombra, gradiente ou contorno; não trocar a fonte do nome.
- Sobre laranja, use a versão grafite com bloco branco (ou evite: prefira grafite, branco ou areia como fundo).

---

## 3. Cores

### Paleta
| Token | Hex | Uso |
|---|---|---|
| `grafite-900` | `#1C1F24` | Texto principal, botão primário, menu escuro, símbolo |
| `grafite-700` | `#4A4F57` | Texto secundário |
| `grafite-500` | `#6B7079` | Legendas, placeholders, ícones inativos |
| `grafite-300` | `#A8ADB5` | Desabilitado; texto suave sobre escuro |
| `areia-200` | `#E4E2DC` | Bordas, divisórias |
| `areia-100` | `#F6F5F2` | Fundo do app |
| `branco` | `#FFFFFF` | Cards, modais, tabelas |
| **`bloco-500`** | **`#EE5A24`** | **Cor da marca**: preenchimentos, indicador ativo, progresso, foco, CTA |
| `bloco-600` | `#D94E1C` | Hover de elementos laranja |
| `bloco-700` | `#B83F14` | Texto e links laranja sobre fundo claro |
| `bloco-300` | `#F07A4A` | Texto/links laranja sobre fundo escuro |
| `bloco-100` | `#FDE9DF` | Fundo suave: item selecionado, badge de marca |

Estados: sucesso `#1F7A50` / `#E3F3EA` · alerta `#8A5A00` (texto), `#E0A100` (ícone) / `#FCF1D6` · erro `#B42828` / `#FBE4E4` · info `#2B5C8A` / `#E2ECF6`.

### Proporção
~70% branco/areia · ~22% grafite · ~6% laranja · ~2% cores de estado.

### Acessibilidade (verificado)
- Texto **branco sobre laranja `#EE5A24` não passa** em AA (3,4:1). Sobre laranja, texto sempre **grafite** (4,8:1).
- Laranja como **texto** sobre fundo claro: use `bloco-700 #B83F14` (5,6:1).
- `grafite-500` passa AA sobre branco (5,0:1) e areia (4,6:1). Não use cinzas mais claros para texto.
- Cor nunca é a única pista de estado: acompanhe com ícone ou rótulo.

### Tema escuro
Já definido em `tokens.css` via `[data-theme="dark"]`: fundo `#121417`, superfícies `#1C1F24`, texto `#F6F5F2`, texto laranja `#F07A4A`. O laranja de preenchimento continua `#EE5A24`.

---

## 4. Tipografia

- **Sora**: toda a interface (títulos, textos, botões, menus).
- **IBM Plex Mono**: números, valores em R$, percentuais, datas em tabelas, códigos de serviço/obra. Classe `.ot-num` ou `font-mono tabular-nums`.

| Estilo | Tamanho / altura | Peso | Uso |
|---|---|---|---|
| Display | 36 / 44 | 600, tracking −0,02em | Números-chave do dashboard |
| H1 | 28 / 36 | 600, −0,02em | Título da página |
| H2 | 22 / 30 | 600 | Seções, título de card grande |
| H3 | 18 / 26 | 600 | Título de card |
| Corpo | 15 / 24 | 400 | Texto padrão |
| Pequeno | 14 / 20 | 400 | Tabelas, formulários |
| Legenda | 12 / 16 | 500 | Metadados, ajuda |
| Rótulo | 12 / 16 | 500, CAIXA ALTA, tracking 0,08em, mono | Cabeçalhos de seção, eyebrow |

Pesos permitidos: 300 (só no "tech" do logo e números grandes), 400, 500, 600.

---

## 5. Forma, espaço e profundidade

- **Grid de 4 px.** Espaçamentos: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- **Raios:** 6 (tags), 10 (botões, inputs), 16 (cards), 20 (modais), 999 (pills, avatares).
- **Bordas** finas `1px areia-200` antes de sombras. Sombras só em elementos flutuantes (dropdown, modal, toast).
- Ícones: traço 1,5–2 px, cantos arredondados, combinam com o arco do símbolo (ex.: Lucide). Cor `grafite-500`, ativa `grafite-900` ou `bloco-500`.
- Sem gradientes, sem emojis na interface.

---

## 6. Componentes (como aplicar)

**Botões** (altura 40 px; 44 px em mobile; raio 10; Sora 500, 14 px)
- Primário: fundo `grafite-900`, texto branco; hover `grafite-800`.
- Destaque (CTA principal da tela, no máx. 1 por tela): fundo `bloco-500`, texto **grafite-900**; hover `bloco-600`.
- Secundário: fundo branco, borda `areia-200`, texto `grafite-900`; hover fundo `areia-100`.
- Fantasma: sem fundo, texto `grafite-700`; hover `areia-100`.
- Perigo: fundo `erro-600`, texto branco.
- Foco: anel `0 0 0 3px rgba(238,90,36,.35)`.

**Navegação lateral**
- Fundo `grafite-900`; logo negativo no topo (símbolo sozinho quando recolhida).
- Itens: texto `grafite-300`, ícone 20 px; hover texto branco; **ativo**: texto branco + **barra/bloco laranja de 3 px à esquerda** ou um quadradinho laranja 6×6 antes do rótulo (eco do bloco do logo).

**Cabeçalho / topbar**: fundo branco, borda inferior `areia-200`, título da página H1/H2, ações à direita.

**Cards**: fundo branco, borda `areia-200`, raio 16, padding 20–24. Título H3; rótulo em mono caixa alta acima, quando útil.

**KPIs do dashboard**: rótulo (12, mono, caixa alta, `grafite-500`) + número grande (Display, IBM Plex Mono ou Sora 600) + variação com ícone e cor de estado.

**Progresso da obra**: trilho `areia-200`, preenchimento `bloco-500`, altura 6–8 px, raio total; percentual em mono ao lado.

**Tabelas**: cabeçalho `areia-100`, texto 12 mono caixa alta `grafite-500`; linhas 48 px, divisória `areia-200`; números alinhados à direita em mono; linha selecionada `bloco-100`.

**Inputs**: altura 40, borda `areia-200`, raio 10, fundo branco; foco borda `bloco-500` + anel; erro borda `erro-600` + mensagem 12 px.

**Badges de status**: pill, 12 px 500, fundo da cor `-100` e texto da cor `-600` (ex.: Em execução = `bloco-100`/`bloco-700`; Concluída = sucesso; Atrasada = erro; Planejamento = info).

**Estados vazios e loading**: símbolo em `grafite-300` grande; o loading pode girar **apenas o arco** com o bloco parado, ou animar o bloco "encaixando".

---

## 7. Tom de voz (microtexto)

Direto, profissional e calmo. Verbos de ação nos botões ("Nova obra", "Lançar medição", "Aprovar pedido"). Português do Brasil, sem jargão técnico desnecessário, sem exclamações.
