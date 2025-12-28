
# 💰 Finanza AI - Gestão Financeira Inteligente

Sistema de controle financeiro pessoal com dashboard visual e análise de gastos por Inteligência Artificial.

## 🚀 Como colocar o site no ar

### Opção A: Via GitHub (Recomendado)
1. Crie um repositório no GitHub.
2. Suba os arquivos (descompactados) para lá.
3. Na **Vercel**, conecte seu repositório.
4. Adicione a `VITE_API_KEY` nas **Environment Variables**.

### Opção B: Direto na Vercel (Mais Rápido)
1. Entre no dashboard da [Vercel](https://vercel.com).
2. Clique em **Add New** > **Project**.
3. Clique no link pequeno que diz **"upload a local directory"**.
4. Selecione a pasta do projeto no seu computador.
5. Antes de clicar em Deploy, vá em **Environment Variables** e adicione:
   - **Name:** `VITE_API_KEY`
   - **Value:** (Sua chave do Gemini)
6. Clique em **Deploy**.

---

## 🔑 Como conseguir a Chave de API?
1. Acesse o [Google AI Studio](https://aistudio.google.com/).
2. Clique em "Get API Key".
3. Copie a chave e cole na configuração da Vercel (`VITE_API_KEY`).

## 🛡️ Segurança e Privacidade
- Seus dados financeiros são salvos apenas no **seu navegador** (`localStorage`).
- A chave de API fica protegida no servidor da Vercel e não é exposta publicamente no código fonte se configurada como variável de ambiente.

## 🛠️ Tecnologias
- React 19 + TypeScript
- Tailwind CSS (Estilização)
- Recharts (Gráficos)
- Google Gemini API (IA)
