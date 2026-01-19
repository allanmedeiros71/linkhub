# Wireframes: Gestor de Links Moderno (Baixa Fidelidade)

Este documento descreve a estrutura visual básica de cada tela, focando na disposição dos elementos e na experiência do usuário (UX).

## 1. Tela de Login / Boas-vindas

Foco em simplicidade e clareza para converter o acesso em login.

```
+-----------------------------------------------------------+
|                                                           |
|                     [ LOGO DO APP ]                       |
|                 "Gerencie seus links com                  |
|                   estilo e rapidez"                       |
|                                                           |
|        +-----------------------------------------+        |
|        |          ENTRAR COM O GOOGLE            | (Botão SSO)
|        +-----------------------------------------+        |
|        +-----------------------------------------+        |
|        |          ENTRAR COM O GITHUB            | (Botão SSO)
|        +-----------------------------------------+        |
|                                                           |
|                      -- OU --                             |
|                                                           |
|        [ Campo: E-mail ]                                  |
|        [ Campo: Senha  ]                                  |
|                                                           |
|        +-----------------------------------------+        |
|        |            ACESSAR CONTA                |        |
|        +-----------------------------------------+        |
|                                                           |
|        Ainda não tem conta? [ Criar agora ]               |
|                                                           |
+-----------------------------------------------------------+
```

## 2. Dashboard Principal (Grade de Cards)

Visual moderno com foco nos links.

```
+-----------------------------------------------------------+
| [LOGO]                      [ Pesquisar links... ]  [Perfil]|
+-----------------------------------------------------------+
|                                                           |
|  Seus Links                   [ + Adicionar Novo Link ]    |
|                                                           |
|  +--------------+  +--------------+  +--------------+     |
|  | [Icon] Título|  | [Icon] Título|  | [Icon] Título|     |
|  | URL resumida |  | URL resumida |  | URL resumida |     |
|  |              |  |              |  |              |     |
|  | [Ed] [Ex] [=]|  | [Ed] [Ex] [=]|  | [Ed] [Ex] [=]|     |
|  +--------------+  +--------------+  +--------------+     |
|                                                           |
|  +--------------+  +--------------+                       |
|  | [Icon] Título|  | [Icon] Título|                       |
|  | URL resumida |  | URL resumida |                       |
|  |              |  |              |                       |
|  | [Ed] [Ex] [=]|  | [Ed] [Ex] [=]|                       |
|  +--------------+  +--------------+                       |
|                                                           |
+-----------------------------------------------------------+
* [Ed] = Editar | [Ex] = Excluir | [=] = Alça para Drag & Drop
```

## 3. Modal de Edição / Criação

Sobreposto ao dashboard para manter o contexto.

```
       +---------------------------------------------+
       |             Editar Link                     |
       +---------------------------------------------+
       |                                             |
       |  Título do Link:                            |
       |  [ Digite o nome (ex: Portfólio)         ]  |
       |                                             |
       |  URL Completa:                              |
       |  [ [https://www.meusite.com](https://www.meusite.com)               ]  |
       |                                             |
       |  +-----------------------+  +-----------+   |
       |  |       SALVAR          |  | CANCELAR  |   |
       |  +-----------------------+  +-----------+   |
       |                                             |
       +---------------------------------------------+
```
