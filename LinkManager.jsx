import React, { useState, useEffect, useRef } from "react";
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
  Github,
  Mail,
  Lock,
  User,
  Settings,
  Tag,
  ChevronDown,
  ChevronRight,
  X,
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_URL = `${BACKEND_URL}/api`;
const AUTH_URL = `${BACKEND_URL}/auth`;

// --- COMPONENTE DE CARD ORDENÁVEL ---
function SortableCard({ id, link, onEdit, onDelete, isOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id }); // Use passed ID

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
          src={link.icon_url || `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`}
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
        className={`absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-sm rounded-lg p-0.5 ${
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

function SortableTagSection({ tag, count, children, collapsedCategories, setCollapsedCategories }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `category-${tag.id}` });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative'
  };

  const isCollapsed = collapsedCategories.has(tag.id);

  return (
    <div ref={setNodeRef} style={style} className="bg-white/80 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button 
            {...attributes} 
            {...listeners}
            onClick={() => {
                const newSet = new Set(collapsedCategories);
                if (isCollapsed) newSet.delete(tag.id);
                else newSet.add(tag.id);
                setCollapsedCategories(newSet);
            }}
            className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing"
        >
             <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
                <span className="text-xs font-normal text-slate-400 ml-2">({count})</span>
            </h3>
            {isCollapsed ? <ChevronRight size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        {!isCollapsed && children}
    </div>
  );
}

export default function LinkManager() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [activeId, setActiveId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  const themeChangedRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const THEMES = [
    { id: 'light', name: 'Light', color: '#f8fafc', type: 'light' },
    { id: 'dark', name: 'Dark', color: '#0f172a', type: 'dark' },
    { id: 'dracula', name: 'Dracula', color: '#282a36', type: 'dark' },
    { id: 'apple', name: 'Apple', color: '#f5f5f7', type: 'light' },
    { id: 'caffeine', name: 'Caffeine', color: '#201612', type: 'dark' },
    { id: 'catppuccin-latte', name: 'Latte', color: '#eff1f5', type: 'light' },
    { id: 'catppuccin-frappe', name: 'Frappé', color: '#303446', type: 'dark' },
    { id: 'catppuccin-macchiato', name: 'Macchiato', color: '#24273a', type: 'dark' },
    { id: 'catppuccin-mocha', name: 'Mocha', color: '#1e1e2e', type: 'dark' },
    { id: 'pink', name: 'Pink', color: '#1f1118', type: 'dark' },
    { id: 'nord', name: 'Nord', color: '#2e3440', type: 'dark' },
    { id: 'cyberpunk', name: 'Cyberpunk', color: '#050505', type: 'dark', border: '#00f0ff' },
    { id: 'forest', name: 'Forest', color: '#052e16', type: 'dark' },
    { id: 'ocean', name: 'Ocean', color: '#0c4a6e', type: 'dark' },
  ];

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Reset
    root.classList.remove("dark");
    root.removeAttribute('data-theme');
    
    // Determine type
    const selectedTheme = THEMES.find(t => t.id === theme);
    const isDark = selectedTheme ? selectedTheme.type === 'dark' : theme === 'dark'; // fallback
    
    if (isDark) {
      root.classList.add("dark");
    }

    if (theme !== 'light' && theme !== 'dark') {
      root.setAttribute('data-theme', theme);
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Check current user session on mount
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      if (themeChangedRef.current) {
        // Theme sync is handled in handleThemeChange now to avoid race conditions or dependency loops
        // But we keep this check if needed for other syncs
      } else {
        // Initial load: prefer user theme from DB over local storage if available?
        // Actually, usually user preference from DB wins on login.
        if (user.theme) setTheme(user.theme);
      }
      fetchLinks();
      fetchTags();
    }
  }, [user]);

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_URL}/me`, { credentials: "include" });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      // Not authenticated
    } finally {
      setCheckingSession(false);
    }
  };

  const fetchTags = async () => {
    try {
        const response = await fetch(`${API_URL}/tags/${user.id}`, { credentials: "include" });
        if (response.ok) {
            const data = await response.json();
            setTags(data);
        }
    } catch (err) {
        console.error("Failed to fetch tags");
    }
  };

  const fetchLinks = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/links/${user.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Erro ao carregar links.");
      const data = await response.json();
      setLinks(data.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      setError("Erro ao conectar ao servidor.");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updateData = {};
    
    const name = formData.get("name");
    const avatar_url = formData.get("avatar_url");
    const email = formData.get("email");
    const password = formData.get("password");
    const view_mode = formData.get("view_mode");

    if (name) updateData.name = name;
    if (avatar_url) updateData.avatar_url = avatar_url;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (view_mode) updateData.view_mode = view_mode;

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar perfil");
      }

      const updatedUser = await response.json();
      setUser({ ...user, ...updatedUser });
      setIsSettingsOpen(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha no login.");
      }
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
      setUser(null);
      setLinks([]);
      toast.success("Logout realizado com sucesso!");
    } catch (err) {
      console.error("Logout failed");
      toast.error("Erro ao sair.");
    }
  };

  const handleThemeChange = async (newTheme) => {
    themeChangedRef.current = true;
    setTheme(newTheme);
    if (user) {
      try {
        await fetch(`${API_URL}/users/${user.id}/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (err) {
        console.error("Erro ao salvar tema no banco.");
      }
    }
  };

  const toggleTheme = () => {
      // Toggle logic now mainly for the navbar quick switch (Light <-> Dark)
      // If a custom theme is active, we default to switching to the 'opposite' base type
      const currentType = THEMES.find(t => t.id === theme)?.type || 'light';
      const newTheme = currentType === 'light' ? 'dark' : 'light';
      handleThemeChange(newTheme);
  };

  const handleCreateTag = async (name) => {
    try {
        const response = await fetch(`${API_URL}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name }),
        });
        if (response.ok) {
            fetchTags();
            toast.success("Tag criada!");
        }
    } catch (err) {
        console.error("Error creating tag");
        toast.error("Erro ao criar tag.");
    }
  };

  const handleEditLink = (link) => {
    setEditingLink(link);
    setSelectedTagIds(new Set(link.tags ? link.tags.map(t => t.id) : []));
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Collect selected tags
    const selectedTags = [];
    formData.forEach((value, key) => {
        if (key === 'tags') {
            selectedTags.push(parseInt(value));
        }
    });

    const linkData = {
      user_id: user.id,
      title: formData.get("title"),
      url: formData.get("url"),
      icon_url: formData.get("icon_url"),
      order_index: editingLink ? editingLink.order_index : links.length,
      tags: selectedTags
    };

    const method = editingLink ? "PUT" : "POST";
    const url = editingLink
      ? `${API_URL}/links/${editingLink.id}`
      : `${API_URL}/links`;

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(linkData),
      });
      setIsModalOpen(false);
      setEditingLink(null);
      fetchLinks();
      toast.success(editingLink ? "Link atualizado!" : "Link criado!");
    } catch (err) {
      toast.error("Falha ao salvar.");
      setError("Falha ao salvar.");
    }
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm("Excluir link?")) return;
    try {
        await fetch(`${API_URL}/links/${id}`, { method: "DELETE", credentials: "include" });
        toast.success("Link removido!");
        fetchLinks();
    } catch (err) {
        toast.error("Erro ao excluir link.");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    // Handle Category Reordering
    if (active.id.toString().startsWith('category-')) {
        const activeTagId = parseInt(active.id.toString().split('-')[1]);
        const overTagId = parseInt(over.id.toString().split('-')[1]);
        
        if (activeTagId !== overTagId) {
            const oldIndex = tags.findIndex(t => t.id === activeTagId);
            const newIndex = tags.findIndex(t => t.id === overTagId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newTags = arrayMove(tags, oldIndex, newIndex);
                setTags(newTags);
                
                try {
                    const promises = newTags.map((tag, i) => 
                        fetch(`${API_URL}/tags/${tag.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ order_index: i })
                        })
                    );
                    await Promise.all(promises);
                } catch (e) {
                    fetchTags();
                }
            }
        }
        return;
    }

    // Handle Link Reordering
    if (active.id !== over.id) {
        const activeStr = active.id.toString();
        const overStr = over.id.toString();

        // Check if we are in a categorized context
        if (activeStr.startsWith('tag-') && overStr.startsWith('tag-')) {
            const [, activeTagIdStr, activeLinkIdStr] = activeStr.split('-');
            const [, overTagIdStr, overLinkIdStr] = overStr.split('-');
            
            const activeTagId = parseInt(activeTagIdStr);
            const overTagId = parseInt(overTagIdStr);
            const activeLinkId = parseInt(activeLinkIdStr);
            const overLinkId = parseInt(overLinkIdStr);

            // Only allow reordering within the SAME tag
            if (activeTagId === overTagId) {
                // Get links for this tag, sorted by their current tag order
                const tagLinks = links
                    .filter(l => l.tags && l.tags.some(t => t.id === activeTagId))
                    .sort((a, b) => {
                        const tagA = a.tags.find(t => t.id === activeTagId);
                        const tagB = b.tags.find(t => t.id === activeTagId);
                        return (tagA?.order_index || 0) - (tagB?.order_index || 0);
                    });

                const oldIndex = tagLinks.findIndex(l => l.id === activeLinkId);
                const newIndex = tagLinks.findIndex(l => l.id === overLinkId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    // Reorder the subset
                    const newTagLinks = arrayMove(tagLinks, oldIndex, newIndex);
                    
                    // Update local state: Update order_index inside the tags array for these links
                    setLinks(prevLinks => {
                        return prevLinks.map(link => {
                            const inSubsetIndex = newTagLinks.findIndex(l => l.id === link.id);
                            if (inSubsetIndex !== -1) {
                                // This link is part of the reordered set. Update its tag order_index.
                                const newTags = link.tags.map(t => {
                                    if (t.id === activeTagId) {
                                        return { ...t, order_index: inSubsetIndex };
                                    }
                                    return t;
                                });
                                return { ...link, tags: newTags };
                            }
                            return link;
                        });
                    });

                    // Send to Backend
                    const linkIds = newTagLinks.map(l => l.id);
                    try {
                        await fetch(`${API_URL}/tags/${activeTagId}/reorder`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ linkIds })
                        });
                    } catch (err) {
                        console.error("Failed to reorder tag links", err);
                        fetchLinks();
                    }
                }
            }
            return;
        }

        // Global / Uncategorized Reordering (Fallback to old behavior or simple list)
        // Parse IDs to get real Link IDs
        const getLinkId = (id) => {
            const parts = id.toString().split('-');
            // IDs are 'uncat-{id}' or 'tag-{tagId}-{id}' (though tag logic handled above) or just '{id}'
            return parseInt(parts[parts.length - 1]);
        }

        const activeLinkId = getLinkId(active.id);
        const overLinkId = getLinkId(over.id);

        const oldIndex = links.findIndex((l) => l.id === activeLinkId);
        const newIndex = links.findIndex((l) => l.id === overLinkId);
      
        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(links, oldIndex, newIndex);
            setLinks(newOrder.map((link, i) => ({ ...link, order_index: i })));

            try {
                const promises = newOrder.map((link, i) => {
                // Prepare payload: Extract tag IDs if tags exist
                const payload = { 
                    ...link, 
                    order_index: i,
                    tags: link.tags ? link.tags.map(t => t.id) : [] 
                };
              
                return fetch(`${API_URL}/links/${link.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });
                });
                await Promise.all(promises);
            } catch (err) {
                fetchLinks();
            }
        }
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!user)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center transition-colors relative">
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
          </button>
        </div>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800">
          <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 dark:shadow-none">
            <LinkIcon className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">
            Bem-vindo ao LinkHub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm font-medium">
            Entre ou registre-se para continuar.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left flex gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-8">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="Seu email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Sua senha" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              {loading ? "Processando..." : "Entrar / Registrar"}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase">Ou entre com</span>
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
          </div>

          <div className="flex flex-col gap-3">
             <button
              onClick={() => window.location.href = `${AUTH_URL}/google`}
              className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm flex items-center justify-center gap-2"
            >
               <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
               Google
            </button>
             <button
              onClick={() => window.location.href = `${AUTH_URL}/github`}
              className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all text-sm flex items-center justify-center gap-2"
            >
               <Github size={20} />
               GitHub
            </button>
          </div>
        </div>
      </div>
    );

  // --- DASHBOARD SCREEN ---
  // (Main layout code same as before, just ensured handlers use credentials)
  
  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeLink = links.find((l) => l.id === activeId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-20 font-sans">
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
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
            {user && (
              <div 
                onClick={() => setIsSettingsOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 mr-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile" 
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-600" 
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                
                <div 
                  className={`w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 ${user.avatar_url ? 'hidden' : 'flex'}`}
                >
                  <User size={14} />
                </div>
                
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-[150px] truncate">
                  {user.name || user.email || "Usuário"}
                </span>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={handleLogout}
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
              setSelectedTagIds(new Set());
              setIsModalOpen(true);
            }}
            className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 dark:shadow-none transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-sm"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Novo Link</span>
          </button>
        </div>

                <DndContext

                  sensors={sensors}

                  collisionDetection={closestCorners}

                  onDragStart={(event) => setActiveId(event.active.id)}

                  onDragEnd={handleDragEnd}

                >

                        {user?.view_mode === 'simple' ? (

                             /* Simple View */

                             <SortableContext

                                items={filteredLinks.map((l) => l.id)}

                                strategy={rectSortingStrategy}

                              >

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                  {filteredLinks.map((link) => (

                                    <SortableCard

                                      key={link.id}

                                      id={link.id}

                                      link={link}

                                      onEdit={handleEditLink}

                                      onDelete={handleDeleteLink}

                                    />

                                  ))}

                                </div>

                              </SortableContext>

                        ) : (

                            /* Categorized View */

                            <div className="space-y-6">

                                {/* Uncategorized Links */}

                                {(() => {

                                    const uncategorized = filteredLinks.filter(l => !l.tags || l.tags.length === 0);

                                    if (uncategorized.length === 0) return null;

                                    const isCollapsed = collapsedCategories.has('uncategorized');

                                    const sortableIds = uncategorized.map(l => `uncat-${l.id}`);

                                    

                                    return (

                                        <div className="bg-white/80 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                                            <button 

                                                onClick={() => {

                                                    const newSet = new Set(collapsedCategories);

                                                    if (isCollapsed) newSet.delete('uncategorized');

                                                    else newSet.add('uncategorized');

                                                    setCollapsedCategories(newSet);

                                                }}

                                                className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"

                                            >

                                                <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">

                                                    <Tag size={16} /> Sem Categoria

                                                    <span className="text-xs font-normal text-slate-400 ml-2">({uncategorized.length})</span>

                                                </h3>

                                                {isCollapsed ? <ChevronRight size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}

                                            </button>

                                            

                                            {!isCollapsed && (

                                                <SortableContext items={sortableIds} strategy={rectSortingStrategy}>

                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                                        {uncategorized.map(link => (

                                                            <SortableCard 

                                                                key={link.id} 

                                                                id={`uncat-${link.id}`}

                                                                link={link} 

                                                                onEdit={handleEditLink} 

                                                                onDelete={handleDeleteLink}

                                                            />

                                                        ))}

                                                    </div>

                                                </SortableContext>

                                            )}

                                        </div>

                                    );

                                })()}

                

                                                {/* Tagged Links */}

                

                                                <SortableContext 

                

                                                    items={tags.map(t => `category-${t.id}`)} 

                

                                                    strategy={verticalListSortingStrategy}

                

                                                >

                

                                                                                        {tags.map(tag => {

                

                                                                                            // Filter and Sort links for this tag

                

                                                                                            const tagLinks = filteredLinks

                

                                                                                                .filter(l => l.tags && l.tags.some(t => t.id === tag.id))

                

                                                                                                .sort((a, b) => {

                

                                                                                                    const tagA = a.tags.find(t => t.id === tag.id);

                

                                                                                                    const tagB = b.tags.find(t => t.id === tag.id);

                

                                                                                                    return (tagA?.order_index || 0) - (tagB?.order_index || 0);

                

                                                                                                });

                

                                                    

                

                                                                                            const sortableIds = tagLinks.map(l => `tag-${tag.id}-${l.id}`);

                

                                                    

                

                                                                                            return (

                

                                                                                                <SortableTagSection 

                

                                                                                                    key={tag.id} 

                

                                                                                                    tag={tag} 

                

                                                                                                    count={tagLinks.length}

                

                                                                                                    collapsedCategories={collapsedCategories} 

                

                                                                                                    setCollapsedCategories={setCollapsedCategories}

                

                                                                                                >

                

                                                                                                    <SortableContext items={sortableIds} strategy={rectSortingStrategy}>

                

                                                                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                

                                                                                                            {tagLinks.map(link => (

                

                                                                                                                <SortableCard 

                

                                                                                                                    key={`${tag.id}-${link.id}`} 

                

                                                                                                                    id={`tag-${tag.id}-${link.id}`}

                

                                                                                                                    link={link} 

                

                                                                                                                    onEdit={handleEditLink} 

                

                                                                                                                                                                                                                                        onDelete={handleDeleteLink}

                

                                                                                                                />

                

                                                                                                            ))}

                

                                                                                                        </div>

                

                                                                                                    </SortableContext>

                

                                                                                                </SortableTagSection>

                

                                                                                            );

                

                                                                                        })}

                

                                                </SortableContext>

                            </div>

                        )}

                                <DragOverlay>

                                    {activeId ? (

                                        (() => {

                                            const strId = activeId.toString();

                                            if (strId.startsWith('category-')) {

                                                const tagId = parseInt(strId.split('-')[1]);

                                                const tag = tags.find(t => t.id === tagId);

                                                if (!tag) return null;

                                                

                                                return (

                                                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-blue-400 shadow-2xl p-4 flex items-center gap-2 cursor-grabbing scale-105">

                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />

                                                        <span className="font-bold text-slate-800 dark:text-slate-100">{tag.name}</span>

                                                    </div>

                                                );

                                            }

                        

                                            const link = links.find(l => {

                                                if (!strId.includes('-')) {

                                                    return l.id === parseInt(strId);

                                                }

                                                const parts = strId.split('-');

                                                const id = parts[0] === 'uncat' ? parts[1] : parts[2];

                                                return l.id === parseInt(id);

                                            });

                        

                                            if (!link) return null;

                        

                                            return <SortableCard id={activeId} link={link} isOverlay />;

                                        })()

                                    ) : null}

                                </DragOverlay>

                </DndContext>
      </main>

      {(isModalOpen || editingLink) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveLink}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto"
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
              <input
                name="icon_url"
                defaultValue={editingLink?.icon_url}
                placeholder="URL do Ícone (Opcional)"
                type="url"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tags</label>
                 <div className="flex flex-wrap gap-2">
                    {tags.map(tag => {
                        const isSelected = selectedTagIds.has(tag.id);
                        return (
                            <label key={tag.id} className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${isSelected ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                                <input 
                                    type="checkbox" 
                                    name="tags" 
                                    value={tag.id} 
                                    checked={isSelected}
                                    onChange={(e) => {
                                        const newSet = new Set(selectedTagIds);
                                        if (e.target.checked) newSet.add(tag.id);
                                        else newSet.delete(tag.id);
                                        setSelectedTagIds(newSet);
                                    }}
                                    className="hidden"
                                />
                                {tag.name}
                            </label>
                        )
                    })}
                    <div className="flex items-center gap-2">
                         <input 
                            id="newTagInput"
                            placeholder="Nova tag..."
                            className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-blue-500 dark:text-white w-24"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateTag(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                         />
                    </div>
                 </div>
              </div>

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

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleUpdateProfile}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300"
          >
            <h2 className="font-black text-xl mb-6 dark:text-white">
              Minha Conta
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Nome</label>
                <input
                  name="name"
                  defaultValue={user.name || ""}
                  placeholder="Seu nome"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email || ""}
                  placeholder="Seu email"
                  required
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">URL do Avatar</label>
                <input
                  name="avatar_url"
                  defaultValue={user.avatar_url || ""}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wider">Tema</label>
                <div className="grid grid-cols-5 gap-2">
                    {THEMES.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => handleThemeChange(t.id)}
                            className={`h-10 rounded-xl border-2 transition-all ${theme === t.id ? 'border-blue-500 scale-110 shadow-lg' : 'border-slate-200 dark:border-slate-700 hover:scale-105'}`}
                            style={{ backgroundColor: t.color, borderColor: t.border || (theme === t.id ? undefined : 'transparent') }}
                            title={t.name}
                        />
                    ))}
                </div>
                <p className="text-center text-xs text-slate-400 mt-2 font-medium">
                    {THEMES.find(t => t.id === theme)?.name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Modo de Visualização</label>
                <select
                  name="view_mode"
                  defaultValue={user.view_mode || "categorized"}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="categorized">Por Categoria (Tags)</option>
                  <option value="simple">Lista Simples (Ordenável)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Nova Senha</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Deixe em branco para manter"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}