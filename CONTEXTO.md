# ObraTech — Contexto do Projeto

## Visão Geral
SaaS de gestão de obras para construtoras brasileiras.
Arquivo único: `index.html` (~10.400 linhas)
Deploy: Vercel (GitHub auto-deploy)
URL: https://obratech.eng.br

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + Vanilla JS (arquivo único) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Deploy | Vercel + GitHub (chrystiansf/obratech) |
| PDF | jsPDF + jsPDF-AutoTable |
| Gráficos | Chart.js |
| Ícones | Emojis nativos |

---

## Supabase

**URL:** `https://vwpyhdriektadkpssyro.supabase.co`
**Chave pública:** `sb_publishable_PQM35tyLIUZ-Lx9uGGyF2Q_Hd8KVLRs`
**Storage bucket:** `drive-obras` (público, policy: `bucket_id = 'drive-obras' AND auth.uid() IS NOT NULL`)

### Tabelas existentes
```
empresas, perfis, obras, etapas, colaboradores, pontos,
lancamentos, rdos, estoque, movimentacoes, contratos, pagamentos,
nao_conformidades, drive_arquivos, categorias, centros_custo,
fornecedores_cadastro, demandas, cliente_obras, medicoes,
checklists, terceirizados, pontos_terceirizados
```

### Colunas importantes não óbvias
- `perfis`: `permissoes TEXT` (JSON array de módulos), `obras_ids TEXT` (JSON array de UUIDs), `email TEXT`, `cargo TEXT`
- `etapas`: `orcamento NUMERIC`, `pct_esperado INTEGER`
- `medicoes`: `exec TEXT`, `fotos TEXT` (JSON), `valor_medido`, `valor_acumulado`, `aprovado_por`, `aprovado_em`
- `checklists`: `fotos TEXT` (JSON array `[{src: "data:..."}]`)
- `drive_arquivos`: `storage_path TEXT`, `dados TEXT` (URL pública do Storage)
- `terceirizados`: `empresa TEXT`, `funcao TEXT`, `cpf TEXT`, `celular TEXT`, `obra_id UUID`
- `pontos_terceirizados`: `terceirizado_id UUID`, `presente BOOLEAN`

---

## Estrutura do DB (objeto global)

```javascript
let DB = {
  user: { nome, cargo, ini, foto },
  obras: [],        // mapObra()
  etapas: [],       // mapEtapa() — inclui orc, pctEsp
  rdos: [],         // mapRdo()
  colabs: [],       // mapColab()
  pontos: [],       // mapPonto()
  pontosTercs: [],  // mapPontoTerc()
  lancs: [],        // mapLanc()
  estoque: [],      // mapEstoque()
  movs: [],         // mapMov()
  ncs: [],          // mapNc() — inclui numero
  contratos: [],    // mapContrato()
  pgtos: [],        // mapPgto()
  medicoes: [],     // mapMedicao() — inclui exec, fotos
  checklists: [],   // mapChecklist() — inclui fotos
  terceirizados: [],// mapTerceirizado()
  demandas: [],
  fornecedores: [],
  centros: [],
  categorias: [],
  drive: {},
  sel: null,        // obra selecionada (id)
  nid: 1
}
```

---

## Variáveis Globais Críticas

```javascript
let supa            // cliente Supabase
let _empresaId      // UUID da empresa logada
let _usuarioAtual   // objeto session.user do Supabase Auth
let _papelAtual     // 'admin' | 'gestor' | 'operacional' | 'financeiro' | 'visualizador' | 'cliente'
let _driveArqs      // arquivos do drive (separado do DB)
let _drvObraId      // obra selecionada no drive

window._permsAtivas    // array de módulos permitidos (null = admin = sem restrição)
window._obrasPermitidas // array de obra IDs permitidos (null = todas)
window._paginaAtual    // id da página atual ('dashboard', 'obras', etc.)
```

---

## Padrões de Código Obrigatórios

### CRUD Supabase
```javascript
// Sempre usar estas funções — nunca chamar supa diretamente para CRUD
supaInsert('tabela', { id: uuidv4(), empresa_id: _empresaId, ...dados })
supaUpdate('tabela', id, { campo: valor })
supaDelete('tabela', id)
```

### IDs
```javascript
// Sempre UUID v4
const novoId = uuidv4()
// Comparações sempre com String()
String(a.id) === String(b.id)
```

### Tabelas sem `atualizado_em`
```javascript
// Estas tabelas NÃO têm a coluna atualizado_em:
const semAtualizado = ['drive_arquivos', 'pontos', 'rdo_fotos', 'checklists',
                       'medicoes', 'cliente_obras', 'terceirizados', 'pontos_terceirizados']
// O supaUpdate() já cuida disso automaticamente
```

### Modais
```javascript
// Modal padrão via openModal() — suporta _postModalRender para callbacks
openModal('tipo', editId, editId2)

// Após root.innerHTML= direto (não via openModal), usar setTimeout
setTimeout(() => { /* popular elementos dinâmicos */ }, 50)

// Callback pós-render para grids de fotos etc.
window._postModalRender = () => { /* executa 30ms após modal abrir */ }
```

### PDF
```javascript
// Sempre usar as funções helper existentes:
let y = pHdr(doc, 'Titulo', 'Subtitulo')  // cabeçalho padrão, retorna y inicial
y = pSec(doc, y, 'Seção')                  // seção com título
pKpi(doc, x, y, w, h, 'Label', 'Valor', 'sub')  // card KPI
pFtr(doc)                                   // rodapé em todas as páginas
// Cores: PX.navy, PX.blue, PX.ink, PX.gray, PX.lgray, PX.silver, PX.bg, PX.green, PX.red, PX.amber
// Estilos: hStyle(), bStyle(), altRow(), totRow()
// NUNCA usar emojis em doc.text() — jsPDF não suporta
// NUNCA usar doc.GState() — não disponível nesta versão
```

### Verificação de Sintaxe
```bash
# Rodar antes de todo commit
node -e "
const acorn=require('./node_modules/acorn');
const fs=require('fs');
const c=fs.readFileSync('index.html','utf8');
const ss=c.match(/<script[^>]*>([\s\S]*?)<\/script>/g)||[];
let ok=true;
ss.forEach((s,i)=>{const j=s.replace(/<\/?script[^>]*>/g,'');if(!j.trim())return;
  try{acorn.parse(j,{ecmaVersion:2020,sourceType:'script'});}
  catch(e){ok=false;const l=(e.loc?.line||1)-1;const ls=j.split('\n');
    console.log('ERRO script',i,'linha',e.loc?.line,':',e.message);
    for(let li=Math.max(0,l-2);li<=Math.min(ls.length-1,l+2);li++)console.log(li+1,':',ls[li].substring(0,120));
  }});
if(ok)console.log('TODOS OK');
"
```

---

## Módulos do Sistema (MODULOS_SISTEMA)

```javascript
dashboard, obras, cronograma, rdo, equipe, estoque,
financeiro, contratos, drive, qualidade, demandas,
fornecedores, clientes, relatorios
```

## Papéis e Presets (PAPEIS_PRESET)

```javascript
admin:       todos os módulos (window._permsAtivas = null)
gestor:      tudo exceto clientes
financeiro:  dashboard, obras, financeiro, contratos, relatorios
operacional: dashboard, obras, cronograma, rdo, equipe, estoque, drive, qualidade, demandas
visualizador: dashboard, obras, cronograma, rdo, drive
cliente:     portal separado (p-portal-cliente)
```

---

## Páginas / Abas

| ID | Título | Renderização |
|----|--------|-------------|
| dashboard | Dashboard | renderDash() |
| obras | Obras | renderObras() |
| cronograma | Cronograma | renderCron() |
| rdo | RDO Diário | renderRDO() |
| equipe | Equipe & Ponto | renderEquipe() |
| estoque | Estoque | renderEstoque() |
| financeiro | Financeiro | renderFin() |
| contratos | Contratos | renderContratos() |
| drive | Drive / GED | renderDrive() |
| qualidade | Qualidade | renderQual() |
| demandas | Demandas | renderDemandas() |
| fornecedores | Fornecedores | renderFornecedores() |
| clientes | Portal Clientes / Equipe | renderClientes() |
| relatorios | Relatórios | — |

### Sub-abas da Equipe
- `t-colab` — Colaboradores (próprios)
- `t-ponto` — Presença semanal
- `t-folha` — Folha semanal
- `t-tercs` — Terceirizados → renderTerceirizados()

### Sub-abas da Qualidade
- `qual-panel-nc` — Não Conformidades
- `qual-panel-chk` — Checklists de Inspeção

### Sub-abas de Clientes
- `usr-panel-clientes` — Portal Clientes
- `usr-panel-equipe` — Equipe / Usuários do Sistema

---

## Sistema de Permissões

```javascript
// Ao login, após buscar perfil:
// Admin → _permsAtivas = null, _obrasPermitidas = null
// Outros → aplicarRestricoesPerfil(perms, obrasIds)

// goPage() bloqueia navegação se módulo não permitido
// aplicarFiltroObras() filtra DB.obras para obras permitidas

// Cache no localStorage:
// _ot_empresa_id, _ot_papel, _ot_nome, _ot_cargo
// _ot_user_id, _ot_permissoes, _ot_obras_ids
```

---

## Drive / GED

```javascript
// Upload via Supabase Storage (NÃO base64)
// Bucket: 'drive-obras'
// Path: empresaId/obraId/pasta/filename
// Limite: 50MB por arquivo
// drive_arquivos.dados = URL pública do Storage
// drive_arquivos.storage_path = path no bucket
```

---

## Usuários de Teste

| Email | Papel | Notas |
|-------|-------|-------|
| chrystiansf7@gmail.com | admin | conta principal |
| chr.augusto@outlook.com | admin | conta secundária |
| anarosamartinss11@gmail.com | cliente | Ana Rosa |

**Empresa de teste:** Aura Incorporadora
**Empresa ID:** `4ae33fb9-8bec-4f3c-878d-350a826790f2`

---

## Funcionalidades Implementadas (Fase 1 completa)

- [x] Obras, Etapas, Cronograma Gantt com saúde visual
- [x] Curva S financeira (Orçado × Realizado × Medido)
- [x] RDO Diário com fotos e PDF
- [x] Presença colaboradores + Terceirizados no RDO
- [x] Equipe & Ponto — colaboradores próprios + terceirizados
- [x] Estoque e Movimentações
- [x] Financeiro com filtros avançados
- [x] Contratos + Medições (Boletim de Medição PDF 3 blocos)
- [x] Pagamentos vinculados a medições
- [x] Drive / GED (Supabase Storage, 50MB)
- [x] Qualidade — NCs + Checklist de Inspeção com fotos
- [x] Demandas
- [x] Fornecedores
- [x] Portal do Cliente (acesso restrito por obra)
- [x] Sistema de convite de funcionários (fetch API, não auth.admin)
- [x] Permissões por módulo e por obra por usuário
- [x] Pull-to-refresh mobile (threshold 130px)
- [x] Orçamento por etapa (KPIs Orçado × Gasto Real no cronograma)

## Pendente (Fase 2+)

- [ ] Relatório Fotográfico Mensal
- [ ] EPI por colaborador (NR-6)
- [ ] Assinatura digital do RDO
- [ ] SINAPI — composições de serviço
- [ ] Notificações (email/WhatsApp)
- [ ] Página de vendas / planos
- [ ] Modo offline (PWA completo)

---

## Problemas Conhecidos / Armadilhas

1. **`supa.auth.signUp()` faz login automático** → usar `fetch()` direto na API REST para criar usuários sem deslogar o admin
2. **jsPDF não suporta emojis** → sempre substituir por texto ASCII em `doc.text()`
3. **jsPDF não tem `doc.GState()`** → não usar opacity via GState
4. **Template literals aninhados** → evitar backtick dentro de backtick em strings de HTML
5. **`new Function()` vs `vm.Script()`** → usar Acorn para validar JS
6. **Strings multiline em arrays JS** → `\n` literal dentro de `'string'` causa SyntaxError
7. **`supa.auth.signOut()` pode dar 403** → sempre usar `{scope:'local'}`
8. **Cache de login pode pertencer a outro usuário** → validar `_ot_user_id` contra `session.user.id`
9. **Mobile Safari demora para restaurar sessão** → usar retry com até 3 tentativas no getSession()
10. **`supaInsert` sem `empresa_id`** → dados não aparecem após reload (query filtra por empresa_id)

---

## Comandos Úteis

```bash
# Instalar Acorn (já instalado no projeto)
npm install acorn

# Verificar sintaxe
node verificar.js  # ou o comando acima

# Contar linhas do arquivo
wc -l index.html

# Buscar função específica
grep -n "function nomeDaFuncao" index.html

# Ver contexto em torno de uma linha
sed -n '1234,1250p' index.html
```
