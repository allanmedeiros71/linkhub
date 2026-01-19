import React, { useState, useEffect } from "react";
import {
  Plus,
  Link as LinkIcon,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  User,
  LogOut,
  MoreVertical,
  Github,
  LayoutGrid,
} from "lucide-react";

// --- Mock Data ---
const INITIAL_LINKS = [
  {
    id: "1",
    title: "Google Search",
    url: "https://google.com",
    description: "Motor de busca principal",
    category: "Trabalho",
  },
  {
    id: "2",
    title: "GitHub Profile",
    url: "https://github.com",
    description: "Meus repositórios e projetos",
    category: "Desenvolvimento",
  },
  {
    id: "3",
    title: "Tailwind CSS",
    url: "https://tailwindcss.com",
    description: "Documentação do framework",
    category: "Estudos",
  },
];

const App = () => {
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
  });

  // Filtered links
  const filteredLinks = links.filter(
    (link) =>
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAuth = () => setIsLoggedIn(!isLoggedIn);

  const handleSaveLink = (e) => {
    e.preventDefault();
    if (editingLink) {
      setLinks(
        links.map((l) => (l.id === editingLink.id ? { ...l, ...formData } : l)),
      );
    } else {
      const newLink = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        category: "Geral",
      };
      setLinks([newLink, ...links]);
    }
    closeModal();
  };

  const openModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        title: link.title,
        url: link.url,
        description: link.description,
      });
    } else {
      setEditingLink(null);
      setFormData({ title: "", url: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  const deleteLink = (id) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl w-full max-w-md backdrop-blur-xl shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LinkIcon className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Aceda ao seu gestor de links moderno
          </p>

          <div className="space-y-4">
            <button
              onClick={handleAuth}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Entrar com E-mail
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">
                ou
              </span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>
            <button
              onClick={handleAuth}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <Github className="w-5 h-5" /> GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <LinkIcon className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight hidden sm:block">
              LinkManager
            </span>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Procurar links..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-900 rounded-lg transition-colors md:hidden">
              <Search className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block"></div>
            <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 transition-all">
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                JD
              </div>
              <span className="text-sm font-medium hidden sm:block">João</span>
            </button>
            <button
              onClick={handleAuth}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Meus Links</h2>
            <p className="text-slate-500 text-sm">
              Gerencie sua coleção de acessos rápidos.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Novo Link</span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLinks.map((link) => (
            <div
              key={link.id}
              className="group relative bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                  <img
                    src={`https://www.google.com/s2/favicons?sz=64&domain=${link.url}`}
                    alt="Favicon"
                    className="w-6 h-6 opacity-80 group-hover:opacity-100"
                    onError={(e) =>
                      (e.target.src =
                        "https://lucide.dev/api/icon/link?size=24&stroke=%236366f1")
                    }
                  />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openModal(link)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-white mb-1 line-clamp-1">
                {link.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">
                {link.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md">
                  {link.category}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-800/50 hover:bg-indigo-600 rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredLinks.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <LayoutGrid className="text-slate-700 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Nenhum link encontrado
              </h3>
              <p className="text-slate-500">
                Tente ajustar a sua pesquisa ou adicione um novo link.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <form
            onSubmit={handleSaveLink}
            className="relative bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingLink ? "Editar Link" : "Adicionar Novo Link"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Título
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="Ex: Documentação React"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  URL
                </label>
                <input
                  required
                  type="url"
                  placeholder="https://exemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Para que serve este link?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;
