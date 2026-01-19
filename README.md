# LinkHub - Gestor de Links Moderno

O **LinkHub** é uma aplicação web moderna para organizar e acessar links favoritos de forma visual, utilizando cards interativos e persistência de dados em tempo real.

## 🚀 Funcionalidades Atuais

- **Autenticação Segura**: Login via E-mail ou Visitante (Firebase Auth).
- **CRUD Completo**: Criação, leitura, edição e exclusão de links.
- **Interface Moderna**: Design baseado em cards com Tailwind CSS e Lucide Icons.
- **Persistência de Dados**: Integração com Firestore para salvar links e sua ordem.
- **Reordenação Simples**: Sistema de ordenação manual para organizar seus links favoritos.
- **Favicons Automáticos**: Identificação visual automática dos sites através da URL.

## 🛠️ Tecnologias Utilizadas

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/) (Auth & Firestore)
- [Lucide React](https://lucide.dev/) (Ícones)
- [dnd-kit](https://dndkit.com/) (Drag & Drop)

## 📦 Como Rodar o Projeto

1. **Clone o repositório:**

```shell
    git clone https://github.com/seu-usuario/nome-do-repositorio.git
```

2. **Instale as dependências**:

```shell
    npm install
```

3. **Configure o Firebase**:
   - Crie um projeto no Console do Firebase.
   - Ative o Authentication e o Cloud Firestore.

4. **Inicie o servidor de desenvolvimento**:

```shell
    npm run dev
```

## 📄 Licença

Este projeto está sob a licença MIT.

## TODO

- Adicionar um botão de alternância de tema na tela de início de sessão para que o usuário possa ajustar o visual antes de entrar.
- Autenticação com JWT: Substituir o login simulado por um sistema real de usuários (google e git) com encriptação de passwords (usando bcrypt no backend).
- Temas Dinâmicos: Implementar um seletor de temas para que seja guardado nas preferências do usuário no PostgreSQL.
- Deploy em Containers: Preparar a configuração final do Docker para colocar o projeto online.
-
