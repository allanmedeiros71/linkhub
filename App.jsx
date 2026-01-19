import React, { useState, useEffect } from "react";
import {
  Plus,
  LogOut,
  Pencil,
  Trash2,
  GripVertical,
  Link as LinkIcon,
  Search,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";

// Importações para o Drag and Drop
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_URL = "http://localhost:5000/api";

// --- COMPONENTE DE CARD ORDENÁVEL ---
function SortableCard({ link, onEdit, onDelete, isOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const handleCardClick = (e) => {
    if (e.target.closest("button")) return;
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const cardClass = `group relative flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 ${
    isOverlay
      ? "border-blue-400 shadow-2xl scale-105"
      : "border-slate-200 dark:border-slate-700 shadow-sm"
  } p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden select-none`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClass}
      onClick={handleCardClick}
    >
      <div className="shrink-0">
        <img
          src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=128`}
          className="w-14 h-14 object-contain rounded-xl border border-transparent dark:border-slate-600 bg-white"
          alt="favicon"
          onError={(e) => {
            e.target.src =
              "https://cdn-icons-png.flaticon.com/512/1006/1006771.png";
          }}
        />
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm mb-0.5">
          {link.title}
        </h3>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate font-medium lowercase tracking-tight">
          {link.url.replace(/^https?:\/\//, "")}
        </p>
      </div>

      <div
        className={`absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-0.5 ${
          isOverlay ? "hidden" : ""
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(link);
          }}
          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={12} />
        </button>
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      setTheme(user.theme || "light");
      fetchLinks();
    }
  }, [user]);

  const fetchLinks = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/links/${user.id}`);
      if (!response.ok) throw new Error("Erro ao carregar links.");
      const data = await response.json();
      setLinks(data.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      setError("Erro ao conectar ao servidor.");
    }
  };

  const handleLogin = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Falha no login.");
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError("O servidor não responde.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (user) {
      try {
        await fetch(`${API_URL}/users/${user.id}/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (err) {
        console.error("Erro ao salvar tema no banco.");
      }
    }
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
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
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });
      setIsModalOpen(false);
      setEditingLink(null);
      fetchLinks();
    } catch (err) {
      setError("Falha ao salvar.");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (active.id !== over?.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      const newOrder = arrayMove(links, oldIndex, newIndex);
      setLinks(newOrder.map((link, i) => ({ ...link, order_index: i })));

      try {
        const promises = newOrder.map((link, i) =>
          fetch(`${API_URL}/links/${link.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...link, order_index: i }),
          })
        );
        await Promise.all(promises);
      } catch (err) {
        fetchLinks();
      }
    }
  };

  if (!user)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center transition-colors">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 dark:shadow-none">
            <LinkIcon className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">
            LinkHub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm font-medium">
            Sua central de links minimalista.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left flex gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={() => handleLogin("visitante@teste.com")}
            disabled={loading}
            className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all"
          >
            {loading ? "Carregando..." : "Entrar como Visitante"}
          </button>
        </div>
      </div>
    );

  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeLink = links.find((l) => l.id === activeId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-20 font-sans">
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black text-xl text-blue-600">
            <LinkIcon />{" "}
            <span className="text-slate-900 dark:text-white hidden sm:inline tracking-tight">
              LinkHub
            </span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent dark:border-slate-700"
              placeholder="Pesquisar links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => setUser(null)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Meus Links
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.1em]">
              Total: {links.length}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} /> Novo Link
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(event) => setActiveId(event.active.id)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredLinks.map((l) => l.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLinks.map((link) => (
                <SortableCard
                  key={link.id}
                  link={link}
                  onEdit={setEditingLink}
                  onDelete={async (id) => {
                    if (!window.confirm("Excluir link?")) return;
                    await fetch(`${API_URL}/links/${id}`, { method: "DELETE" });
                    fetchLinks();
                  }}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? <SortableCard link={activeLink} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {(isModalOpen || editingLink) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveLink}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300"
          >
            <h2 className="font-black text-xl mb-6 dark:text-white">
              {editingLink ? "Editar Link" : "Novo Link"}
            </h2>
            <div className="space-y-4">
              <input
                name="title"
                defaultValue={editingLink?.title}
                placeholder="Título"
                required
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                name="url"
                defaultValue={editingLink?.url}
                placeholder="URL"
                type="url"
                required
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingLink(null);
                }}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
