import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithCustomToken,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
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
  Chrome
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'link-manager-default';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Autenticação Inicial
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (error) {
        console.error("Erro na autenticação inicial:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Escuta de Dados (Firestore) em Tempo Real
  useEffect(() => {
    if (!user) {
      setLinks([]);
      return;
    }

    const linksCollection = collection(db, 'artifacts', appId, 'users', user.uid, 'links');
    
    const unsubscribe = onSnapshot(
      linksCollection, 
      (snapshot) => {
        const linksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Ordenação manual em memória por orderIndex
        const sortedLinks = linksData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setLinks(sortedLinks);
      },
      (error) => console.error("Erro ao buscar links:", error)
    );

    return () => unsubscribe();
  }, [user]);

  // --- LÓGICA CRUD ---
  const handleSaveLink = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const url = formData.get('url');

    if (!user) return;

    try {
      if (editingLink) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'links', editingLink.id);
        await updateDoc(docRef, { title, url, updatedAt: serverTimestamp() });
      } else {
        const linksCollection = collection(db, 'artifacts', appId, 'users', user.uid, 'links');
        await addDoc(linksCollection, {
          title,
          url,
          orderIndex: links.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingLink(null);
    } catch (error) {
      console.error("Erro ao salvar link:", error);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'links', linkId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const moveLink = async (index, direction) => {
    const newLinks = [...links];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;

    // Troca de posição local
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    // Persistência da nova ordem no Firestore
    try {
      const batchPromises = newLinks.map((link, i) => {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'links', link.id);
        return updateDoc(docRef, { orderIndex: i });
      });
      await Promise.all(batchPromises);
    } catch (error) {
      console.error("Erro ao reordenar:", error);
    }
  };

  // --- INTERFACE ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onGuestLogin={() => signInAnonymously(auth)} />;
  }

  const filteredLinks = links.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header/Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LinkIcon className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl hidden sm:block tracking-tight">LinkHub</span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Pesquisar seus links..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Meus Links</h1>
            <p className="text-slate-500 text-sm">Organize e acesse seus atalhos favoritos.</p>
          </div>
          <button 
            onClick={() => { setEditingLink(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Link</span>
          </button>
        </div>

        {/* Listagem de Cards */}
        {filteredLinks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <LinkIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum link por aqui ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link, index) => (
              <div 
                key={link.id}
                className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors border border-slate-100">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} 
                      alt="favicon" 
                      className="w-7 h-7"
                      onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/1006/1006771.png" }}
                    />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingLink(link); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">{link.title}</h3>
                <p className="text-xs text-slate-400 truncate mb-6">{link.url}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => moveLink(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 text-slate-300 hover:text-slate-600 disabled:opacity-0"
                    >
                      <GripVertical className="w-4 h-4 rotate-90" />
                    </button>
                    <button 
                      onClick={() => moveLink(index, 1)}
                      disabled={index === filteredLinks.length - 1}
                      className="p-1.5 text-slate-300 hover:text-slate-600 disabled:opacity-0"
                    >
                      <GripVertical className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
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
            ))}
          </div>
        )}
      </main>

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-black text-xl">{editingLink ? 'Editar Link' : 'Novo Link'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLink} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Título do Card</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingLink?.title || ''}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="Ex: Meu Portfólio"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">URL Completa</label>
                <input 
                  name="url" 
                  type="url" 
                  required 
                  defaultValue={editingLink?.url || ''}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="https://exemplo.com"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthPage({ onGuestLogin }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] p-10 md:p-14 w-full max-w-lg shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="text-center mb-12">
          <div className="inline-flex bg-blue-600 p-5 rounded-[2rem] mb-8 shadow-2xl shadow-blue-200 animate-bounce-slow">
            <LinkIcon className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">LinkHub</h1>
          <p className="text-slate-500 text-lg leading-relaxed font-medium">
            Sua central moderna para organizar e acessar seus links favoritos.
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={onGuestLogin}
            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl active:scale-[0.98]"
          >
            Acessar como Visitante
          </button>
          
          <div className="flex items-center gap-4 py-6">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Ou usar SSO</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 px-6 py-4 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm">
              <Chrome className="w-5 h-5 text-red-500" /> Google
            </button>
            <button className="flex items-center justify-center gap-3 px-6 py-4 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm">
              <Github className="w-5 h-5" /> GitHub
            </button>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400 font-medium">
          Privacidade garantida com persistência no Firebase.
        </p>
      </div>
    </div>
  );
}
