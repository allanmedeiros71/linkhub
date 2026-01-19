# Modelo de Dados (Firestore) - Gestor de Links

Para garantir a segurança e a escalabilidade, utilizaremos uma estrutura hierárquica baseada nos IDs dos usuários autenticados.

## 1. Estrutura de Coleções

Seguindo as regras de segurança e isolamento de dados, a estrutura será:

`artifacts/{appId}/users/{userId}/links/{linkId}`

### 1.1. Coleção: `links`

Esta coleção armazenará todos os cards de links criados por um usuário específico.

| **Campo**    | **Tipo**  | **Descrição**                                                 |
| ------------ | --------- | ------------------------------------------------------------- |
| `id`         | string    | ID único do documento gerado pelo Firestore.                  |
| `title`      | string    | Nome de exibição do link (ex: "Meu Portfólio").               |
| `url`        | string    | Endereço completo do link.                                    |
| `orderIndex` | number    | Valor numérico usado para persistir a posição no Drag & Drop. |
| `category`   | string    | (Opcional) Para filtros futuros (ex: "Trabalho", "Social").   |
| `createdAt`  | timestamp | Data de criação do link.                                      |
| `updatedAt`  | timestamp | Data da última alteração.                                     |

### 1.2. Coleção: `profile` (Opcional/Metadados)

Para armazenar configurações específicas da conta do usuário.

`artifacts/{appId}/users/{userId}/settings/config`

| **Campo**  | **Tipo** | **Descrição**                              |
| ---------- | -------- | ------------------------------------------ |
| `theme`    | string   | Preferência de tema ("light" ou "dark").   |
| `viewMode` | string   | Estilo de visualização ("grid" ou "list"). |

## 2. Lógica de Ordenação (Drag & Drop)

Para persistir a posição dos cards com o `dnd-kit`, utilizaremos o campo `orderIndex`:

1. **Criação:** Ao adicionar um novo link, ele recebe um `orderIndex` igual ao `total_de_links + 1`.

2. **Reordenação:** Quando o usuário solta um card em uma nova posição, a aplicação recalcula os índices dos cards afetados e executa um `updateDoc` no Firestore.

3. **Leitura:** A busca no Firestore será ordenada por este campo para garantir que o layout carregue exatamente como o usuário deixou.

## 3. Regras de Segurança (Exemplo Lógico)

As regras do Firestore devem garantir que:

- O usuário `X` só pode ler/escrever na pasta `/users/X/`.
- O acesso seja permitido apenas para usuários autenticados via Firebase Auth.
