import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// Importações para o Drag and Drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  Github,
  Chrome,
} from "lucide-react";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId =
  typeof __app_id !== "undefined" ? __app_id : "link-manager-default";

// --- COMPONENTE DE CARD ORDENÁVEL ---
function SortableCard({ link, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors border border-slate-100">
          <img
            src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`}
            alt="favicon"
            className="w-7 h-7"
            onError={(e) => {
              e.target.src =
                "https://cdn-icons-png.flaticon.com/512/1006/1006771.png";
            }}
          />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(link)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">
        {link.title}
      </h3>
      <p className="text-xs text-slate-400 truncate mb-6">{link.url}</p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        {/* Alça de Arrastar (Drag Handle) */}
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing"
          title="Arrastar para reordenar"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          Acessar <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// --- APLICAÇÃO PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Configuração de Sensores para Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const linksCol = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "links"
    );
    return onSnapshot(linksCol, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLinks(data.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
    });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      title: f.get("title"),
      url: f.get("url"),
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingLink) {
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "users",
            user.uid,
            "links",
            editingLink.id
          ),
          payload
        );
      } else {
        await addDoc(
          collection(db, "artifacts", appId, "users", user.uid, "links"),
          {
            ...payload,
            orderIndex: links.length,
            createdAt: serverTimestamp(),
          }
        );
      }
      setIsModalOpen(false);
      setEditingLink(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      const newOrder = arrayMove(links, oldIndex, newIndex);

      setLinks(newOrder); // Update local imediato

      // Persistir no Firestore
      try {
        const promises = newOrder.map((link, i) =>
          updateDoc(
            doc(db, "artifacts", appId, "users", user.uid, "links", link.id),
            { orderIndex: i }
          )
        );
        await Promise.all(promises);
      } catch (err) {
        console.error("Erro ao salvar ordem:", err);
      }
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  if (!user) return <AuthPage onGuestLogin={() => signInAnonymously(auth)} />;

  const filtered = links.filter((l) =>
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black text-xl">
            <LinkIcon className="text-blue-600" /> LinkHub
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => signOut(auth)}
            className="p-2 text-slate-400 hover:text-red-600"
          >
            <LogOut />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Meus Links</h2>
          <button
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <Plus size={20} /> Novo Link
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((l) => l.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((link) => (
                <SortableCard
                  key={link.id}
                  link={link}
                  onEdit={(l) => {
                    setEditingLink(l);
                    setIsModalOpen(true);
                  }}
                  onDelete={(id) =>
                    deleteDoc(
                      doc(
                        db,
                        "artifacts",
                        appId,
                        "users",
                        user.uid,
                        "links",
                        id
                      )
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl"
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
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="url"
                defaultValue={editingLink?.url}
                placeholder="URL (https://...)"
                type="url"
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold"
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
      )}
    </div>
  );
}

function AuthPage({ onGuestLogin }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl">
        <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-100">
          <LinkIcon className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black mb-4">LinkHub</h1>
        <p className="text-slate-500 mb-10">
          Organize seus links favoritos com estilo.
        </p>
        <button
          onClick={onGuestLogin}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all mb-4"
        >
          Entrar como Visitante
        </button>
        <div className="flex gap-4">
          <button className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
            <Chrome size={18} className="text-red-500" /> Google
          </button>
          <button className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
            <Github size={18} /> GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
