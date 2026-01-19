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

// Importações otimizadas para o Drag and Drop
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
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
    scale: isDragging ? "1.02" : "1",
  };

  const cardClass = `group bg-white rounded-3xl border ${
    isOverlay
      ? "border-blue-400 shadow-2xl scale-105 cursor-grabbing"
      : "border-slate-200 shadow-sm"
  } p-5 hover:shadow-xl transition-all duration-200 relative overflow-hidden`;

  return (
    <div ref={setNodeRef} style={style} className={cardClass}>
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
        {!isOverlay && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(link)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(link.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <h3 className="font-bold text-slate-800 mb-1 truncate">{link.title}</h3>
      <p className="text-xs text-slate-400 truncate mb-5">{link.url}</p>

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-slate-300 hover:text-blue-600 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical size={20} />
        </button>

        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 text-sm font-bold flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
        >
          Acessar <ExternalLink size={14} />
        </a>
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

  // Sensores otimizados: distância de ativação evita que o arrasto comece num simples clique
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) fetchLinks();
  }, [user]);

  const fetchLinks = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/links/${user.id}`);
      if (!response.ok) throw new Error("Erro ao carregar links.");
      const data = await response.json();
      setLinks(data.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      setError("Erro ao ligar ao servidor.");
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
      setError("O servidor backend não responde na porta 5000.");
    } finally {
      setLoading(false);
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
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });
      if (!response.ok) throw new Error("Erro ao guardar.");
      setIsModalOpen(false);
      setEditingLink(null);
      fetchLinks();
    } catch (err) {
      setError("Falha ao guardar alterações.");
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);

      const newOrder = arrayMove(links, oldIndex, newIndex);
      // Atualização otimista da interface
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
        console.error("Erro ao guardar nova ordem:", err);
        fetchLinks(); // Reverte se falhar
      }
    }
  };

  if (!user)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <LinkIcon className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">LinkHub</h1>
          <p className="text-slate-500 mb-8 text-sm">
            Organize os seus links favoritos com drag & drop fluido.
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
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "A carregar..." : "Entrar como Visitante"}
          </button>
        </div>
      </div>
    );

  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeLink = links.find((l) => l.id === activeId);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black text-xl text-blue-600">
            <LinkIcon /> <span className="text-slate-900">LinkHub</span>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Pesquisar links..."
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Os Meus Links
          </h2>
          <button
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} /> Novo
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredLinks.map((l) => l.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLinks.map((link) => (
                <SortableCard
                  key={link.id}
                  link={link}
                  onEdit={setEditingLink}
                  onDelete={async (id) => {
                    if (!window.confirm("Eliminar este link?")) return;
                    await fetch(`${API_URL}/links/${id}`, { method: "DELETE" });
                    fetchLinks();
                  }}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay
            adjustScale={true}
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: "0.5" } },
              }),
            }}
          >
            {activeId ? <SortableCard link={activeLink} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {isModalOpen || editingLink ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveLink}
            className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300"
          >
            <h2 className="font-black text-xl mb-6">
              {editingLink ? "Editar Link" : "Novo Link"}
            </h2>
            <div className="space-y-4">
              <input
                name="title"
                defaultValue={editingLink?.title}
                placeholder="Título"
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                name="url"
                defaultValue={editingLink?.url}
                placeholder="URL (https://...)"
                type="url"
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingLink(null);
                }}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
