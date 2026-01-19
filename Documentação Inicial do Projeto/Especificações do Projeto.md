# Especificações Técnicas: Gestor de Links Moderno

Este documento detalha os requisitos definidos para a aplicação de gestão de links, focando em uma experiência de usuário fluida e visualmente atraente.

## 1. Definição das Funcionalidades (MVP)

### 1.1. Autenticação (Acesso)

- **Login/Registro via E-mail:** Fluxo tradicional de criação de conta.
- **SSO (Single Sign-On):** Integração com Google/GitHub para acesso rápido.
- **Estado de Sessão:** Persistência para que o usuário não precise fazer login repetidamente.

### 1.2. Gestão de Conteúdo (CRUD)

- **Create:** Adicionar novos links com título, URL e, opcionalmente, uma descrição ou ícone.
- **Read:** Visualização dos links em uma grade (grid) de cards organizada.
- **Update:** Editar informações de links existentes.
- **Delete:** Remover links da coleção.

### 1.3. Organização e Persistência

- **Posicionamento de Cards:** O usuário pode definir a ordem ou posição dos cards (arrastar e soltar ou ordenação lógica).
- **Sincronização em Tempo Real:** As alterações de posição e dados devem ser salvas automaticamente no banco de dados.

## 2. Design e Interface (UI/UX)

- **Estética:** Design moderno, minimalista, com uso de sombras suaves (glassmorphism ou clean design).
- **Componente Principal (Card):**
  - Cantos arredondados.
  - Efeitos de hover (elevação do card ao passar o mouse).
  - Favicon automático (extraído da URL do link).

- **Layout:** Grade responsiva que se adapta de desktop para dispositivos móveis.

## 3. Stack Tecnológica Recomendada

| **Camada**         | **Tecnologia**       | **Justificativa**                                                                                |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------ |
| **Frontend**       | React + Tailwind CSS | Rapidez no desenvolvimento de UI e componentes de cards responsivos.                             |
| **Auth**           | Firebase Auth        | Suporta nativamente E-mail/Senha e Google/GitHub SSO.                                            |
| **Banco de Dados** | Firestore            | Banco de dados NoSQL ideal para salvar documentos de links e sincronizar posições em tempo real. |
| **Ícones**         | Lucide React         | Biblioteca leve para ícones modernos de edição, exclusão e links.                                |
| **Drag & Drop**    | **dnd-kit**          | Modular, performático e com ótimo suporte a touch/acessibilidade.                                |

## 4. Fluxo do Usuário (User Flow)

Abaixo, o mapeamento lógico da jornada principal:

1. **Entrada:** Usuário acessa a Landing Page.

2. **Autenticação:**

- Usuário clica em "Entrar".
- **Opção A:** Insere e-mail/senha.
- **Opção B:** Clica em "Entrar com Google" (SSO).

3. **Redirecionamento:** Após sucesso no Firebase Auth, o usuário é enviado para o **Dashboard**.

4. **Visualização:** O Firestore carrega os links do usuário e renderiza a grade de cards.

5. **Edição de Card:**

- Usuário identifica o card desejado.
- Ao passar o mouse (hover), o ícone de "Editar" (lápis) aparece.
- Usuário clica no ícone.

6. **Interação:** Um **Modal** se abre com os campos preenchidos (Título e URL).

7. **Salvamento:**

- Usuário altera os dados e clica em "Salvar".
- A aplicação envia o `updateDoc` para o Firestore.
- O card é atualizado na interface instantaneamente via `onSnapshot`.

## Próximos Passos Imediatos

1. ✅ **Desenho do Fluxo do Usuário (User Flow):** Mapeado na seção 4.

2. ✅ **Escolha de Biblioteca de Drag-and-Drop:** Definido o uso do **dnd-kit** devido à sua modularidade e suporte para dispositivos móveis.

3. **Configuração do Ambiente:** Iniciar o projeto React e conectar ao Firebase.
