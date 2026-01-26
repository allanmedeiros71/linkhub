# LinkHub - Gestor de Links Moderno

O **LinkHub** é uma aplicação web full-stack para organizar, acessar e compartilhar links favoritos. O projeto evoluiu para uma arquitetura robusta com backend próprio, banco de dados relacional e uma interface polida.

Agora conta com uma **Landing Page** dedicada para apresentar o status do projeto e as tecnologias empregadas.

## 🚀 Funcionalidades

- **Landing Page Informativa**: Página inicial (`/`) apresentando o projeto e seu status de desenvolvimento.
- **Autenticação Robusta**:
  - Login Social: **Google** e **GitHub** (via OAuth/Passport).
  - Login Local: E-mail e Senha com criptografia (**bcrypt**).
  - Sessões persistentes com `express-session`.
- **Gerenciador de Links (`/app`)**:
  - **CRUD Completo**: Adicione, edite e remova links.
  - **Drag & Drop**: Reordene seus cards arrastando e soltando (powered by `dnd-kit`).
  - **Favicons**: Recuperação automática de ícones dos sites.
- **Personalização**:
  - **Tema Dark/Light**: Alternância de tema com persistência nas preferências do usuário no banco de dados.
- **Backend API**:
  - API RESTful construída com Express.
  - Banco de dados **PostgreSQL** para usuários e links.

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React** (Vite)
- **React Router Dom** (Roteamento)
- **Tailwind CSS** (Estilização)
- **Lucide React** (Ícones)
- **@dnd-kit** (Drag & Drop acessível)

### Backend

- **Node.js** & **Express**
- **PostgreSQL** (Banco de dados)
- **Passport.js** (Estratégias Google, GitHub e Local)
- **Bcryptjs** (Hashing de senhas)
- **Pg** (Cliente PostgreSQL)

### DevOps

- **Docker** & **Docker Compose** (Containerização do Banco de Dados)

## 📦 Como Rodar o Projeto

### Pré-requisitos

- Node.js (v18+)
- Docker e Docker Compose (para o banco de dados)

### Passo a Passo

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/linkhub.git
   cd linkhub
   ```

2. **Configure o Banco de Dados:**
   Inicie o container do PostgreSQL:

   ```bash
   docker-compose up -d
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz baseado no `.env.sample` (se houver) ou use as configurações abaixo:

   ```env
   DB_USER=user
   DB_HOST=localhost
   DB_NAME=linkhub
   DB_PASSWORD=password
   DB_PORT=5432
   SESSION_SECRET=seu_segredo_super_secreto

   # Opcional: Configuração OAuth (necessário para login social)
   GOOGLE_CLIENT_ID=seu_client_id
   GOOGLE_CLIENT_SECRET=seu_client_secret
   GITHUB_CLIENT_ID=seu_client_id
   GITHUB_CLIENT_SECRET=seu_client_secret
   ```

4. **Instale as dependências:**

   ```bash
   npm install
   ```

5. **Inicie a Aplicação:**
   Para rodar tanto o servidor backend quanto o frontend (via `concurrently`):

   ```bash
   npm start
   ```

   Acesse:
   - **Landing Page:** `http://localhost:5173`
   - **App:** `http://localhost:5173/app`
   - **API:** `http://localhost:5000`

## 📄 Licença

Este projeto está sob a licença MIT.

## ✅ Status das Tarefas (TODO)

- [x] **Autenticação Real**: Implementado login com Google, GitHub e Local (bcrypt).
- [x] **Banco de Dados**: Migração de Firebase para PostgreSQL concluída.
- [x] **Temas Dinâmicos**: Seletor de tema com persistência no banco de dados.
- [x] **Landing Page**: Página de apresentação criada.
- [x] **Deploy em Containers**: Configuração final do Docker para a aplicação (Dockerfile da app) - _O banco já está containerizado._
- [x] **Notificações (Toasts)**: Melhorar feedback visual de erros/sucesso.
- [x] **Inserir ícones.** Se houver ícone no banco, usá-lo, caso contrário, usar o da web fornecido pelo próprio app.
- [x] **Inserir abas.**

## 🚀 Sugestões Estratégicas para o Projeto

Com base no estado atual do projeto (que já possui autenticação, abas, categorias, drag & drop e temas), aqui estão algumas sugestões divididas por complexidade e impacto:

### 1. Funcionalidades de Automação (Alta Prioridade)

**Coleta Automática de Metadados (Web Scraping):**

- **Como é hoje:** O usuário precisa digitar o título e colar a URL da imagem.
- **Melhoria:** Ao colar um link (ex: `https://youtube.com`), o backend acessa a página, extrai o `<title>`, a `meta description` e a imagem `og:image` automaticamente. Isso melhora drasticamente a experiência de adicionar links.

### 2. Expansão para "Social" / Compartilhamento

- **Perfis Públicos (Estilo Linktree):**
  - Permitir que o usuário torne uma **Aba** específica (ou o perfil todo) pública.
  - Gerar uma URL amigável (ex: `linkhub.app/allan`) para usar em bios de redes sociais.
- **Compartilhamento de Categorias:**
  - Opção de compartilhar apenas uma categoria específica com um amigo ou colega de trabalho via link secreto.

### 3. Integração e Acessibilidade

- **Importação/Exportação:**
  - Permitir importar favoritos do navegador (arquivo HTML) para facilitar a migração de novos usuários.
  - Permitir exportar os dados (JSON/CSV) para garantir que o usuário é dono dos dados (**Data Ownership**).
- **Extensão para Navegador:**
  - Criar uma extensão simples para Chrome/Firefox que adiciona o site atual ao LinkHub com um clique.

### 4. Melhorias Técnicas e de UX

- **PWA (Progressive Web App):**
  - Configurar o `manifest.json` e Service Workers para que o site possa ser instalado como um aplicativo no celular e funcionar (parcialmente) offline.
- **Menu de Contexto (Botão Direito):**
  - Ao clicar com o botão direito em um card, abrir um menu personalizado com opções rápidas: _"Mover para aba..."_, _"Editar"_, _"Duplicar"_, _"Copiar URL"_.
- **Busca Global (Cmd+K):**
  - Implementar uma **Command Palette** para navegar entre abas ou buscar links rapidamente sem usar o mouse.
