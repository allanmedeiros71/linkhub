import React, { useState, useEffect } from "react";
import {
  Plus,
  LogOut,
  ExternalLink,
  Pencil,
  Trash2,
  GripVertical,
  Link as LinkIcon,
  Search,
  X,
  Chrome,
  Github,
  AlertCircle,
} from "lucide-react";

// Endereço da API backend (Certifique-se de que o servidor Node.js está a correr na porta 5000)
const API_URL = "http://localhost:5000/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar links quando o utilizador faz login
  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  // Função para procurar os links no servidor
  const fetchLinks = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/links/${user.id}`);
      if (!response.ok) throw new Error("Erro ao carregar links do servidor.");
      const data = await response.json();
      setLinks(data);
    } catch (err) {
      console.error("Erro ao procurar links:", err);
      setError(
        "Não foi possível ligar ao servidor. Verifique se o backend está ativo."
      );
    }
  };

  // Função para lidar com o login (com tratamento de erro de rede)
  const handleLogin = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Falha na autenticação.");

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error("Erro no login:", err);
      setError(
        "Erro de ligação: O servidor backend não responde. Execute 'npm run server' no terminal."
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para guardar ou atualizar um link
  const handleSaveLink = async (e) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.target);
    const linkData = {
      user_id: user.id,
      title: formData.get("title"),
      url: formData.get("url"),
      order_index: editingLink ? editingLink.order_index : links.length,
    };

    const method = editingLink ? "PUT" : "POST";
    const url = editingLink
      ? `${API_URL}/links/${editingLink.id}`
      : `${API_URL}/links`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });

      if (!response.ok) throw new Error("Erro ao guardar o link.");

      setIsModalOpen(false);
      setEditingLink(null);
      fetchLinks(); // Recarregar a lista após sucesso
    } catch (err) {
      console.error("Erro ao guardar:", err);
      setError("Falha ao comunicar com o servidor para guardar o link.");
    }
  };

  // Função para apagar um link
  const handleDelete = async (id) => {
    if (!window.confirm("Deseja mesmo eliminar este link?")) return;
    setError(null);
    try {
      const response = await fetch(`${API_URL}/links/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao eliminar link.");
      fetchLinks();
    } catch (err) {
      console.error("Erro ao eliminar:", err);
      setError("Erro ao tentar eliminar o link no servidor.");
    }
  };

  // Ecrã de Login
  if (!user)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <LinkIcon className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">LinkHub</h1>
          <p className="text-slate-500 mb-8">
            Gestão de links com Postgres e Docker.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-left animate-in fade-in zoom-in duration-200">
              <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <button
            onClick={() => handleLogin("visitante@teste.com")}
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "A ligar..." : "Entrar como Visitante"}
          </button>

          <p className="mt-6 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            Certifique-se de que o backend está a correr
          </p>
        </div>
      </div>
    );

  const filteredLinks = links.filter(
    (l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Barra de Navegação */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black text-xl text-blue-600">
            <LinkIcon /> <span className="text-slate-900">LinkHub</span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Pesquisar nos seus links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setUser(null)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between text-red-700 text-sm font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
            <button
              onClick={() => fetchLinks()}
              className="underline hover:text-red-900 text-xs"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Meus Links</h2>
            <p className="text-sm text-slate-500">
              Total: {links.length} links guardados
            </p>
          </div>
          <button
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus size={20} /> Novo Link
          </button>
        </div>

        {/* Grelha de Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <LinkIcon className="mx-auto text-slate-200 w-12 h-12 mb-4" />
              <p className="text-slate-400 font-medium">
                Nenhum link encontrado.
              </p>
            </div>
          ) : (
            filteredLinks.map((link) => (
              <div
                key={link.id}
                className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`}
                      className="w-6 h-6"
                      alt="favicon"
                      onError={(e) => {
                        e.target.src =
                          "https://cdn-icons-png.flaticon.com/512/1006/1006771.png";
                      }}
                    />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingLink(link);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 mb-1 truncate">
                  {link.title}
                </h3>
                <p className="text-xs text-slate-400 truncate mb-5">
                  {link.url}
                </p>

                <div className="pt-4 border-t border-slate-50">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-50 py-2 rounded-xl transition-colors"
                  >
                    Acessar Link <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveLink}
            className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-xl">
                {editingLink ? "Editar Link" : "Novo Link"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-50 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Título
                </label>
                <input
                  name="title"
                  defaultValue={editingLink?.title}
                  placeholder="Ex: Meu Portfólio"
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Endereço URL
                </label>
                <input
                  name="url"
                  defaultValue={editingLink?.url}
                  placeholder="https://exemplo.com"
                  type="url"
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                {editingLink ? "Atualizar" : "Criar Link"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
