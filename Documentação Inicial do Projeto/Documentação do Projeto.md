# LinkHub - Gestor de Links Moderno

O **LinkHub** é uma aplicação web moderna para organizar e acessar links favoritos de forma visual, utilizando cards interativos e persistência de dados em tempo real.

## 🚀 Funcionalidades Atuais

- **Autenticação Segura:** Login via E-mail ou Visitante (Firebase Auth).
- **CRUD Completo:** Criação, leitura, edição e exclusão de links.
- **Interface Moderna:** Design baseado em cards com Tailwind CSS e Lucide Icons.
- **Persistência de Dados:** Integração com Firestore para salvar links e sua ordem.
- **Drag & Drop Visual:** Reordenação intuitiva de cards utilizando a biblioteca `dnd-kit`.
- **Favicons Automáticos:** Identificação visual automática dos sites através da URL.

## 🛠️ Tecnologias Utilizadas

- [React](https://reactjs.org/ "null")
- [Tailwind CSS](https://tailwindcss.com/ "null")
- [Firebase](https://firebase.google.com/ "null") (Auth & Firestore)
- [Lucide React](https://lucide.dev/ "null") (Ícones)
- [dnd-kit](https://dndkit.com/ "null") (Drag & Drop)

## 📦 Como Rodar o Projeto

1. **Clone o repositório:**

```
git clone [https://github.com/seu-usuario/nome-do-repositorio.git](https://github.com/seu-usuario/nome-do-repositorio.git)
```

2. **Instale as dependências:**

```
npm install
```

3. **Configure o Firebase:**

- Crie um projeto no [Console do Firebase](https://console.firebase.google.com/ "null").
- Ative o **Authentication** e o **Cloud Firestore**.

4. **Inicie o servidor de desenvolvimento:**

```
npm run dev
```

## 📄 Licença

Este projeto está sob a licença MIT.
