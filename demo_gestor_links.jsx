import React, { useState } from "react";
import {
  Plus,
  Link as LinkIcon,
  Pencil,
  Trash2,
  Search,
  LogOut,
  ChevronDown,
  Settings,
  User,
  Sun,
  Moon
} from "lucide-react";

// --- Mock Data ---
const MOCK_TABS = [
    { id: 'all', name: 'Todas' },
    { id: 'dev', name: 'Dev' },
    { id: 'social', name: 'Social' },
];

const MOCK_TAGS = [
    { id: 1, name: 'Trabalho', color: '#3b82f6', tab_id: 'dev' },
    { id: 2, name: 'Estudos', color: '#10b981', tab_id: 'dev' },
    { id: 3, name: 'Redes', color: '#ec4899', tab_id: 'social' },
];

const INITIAL_LINKS = [
  {
    id: 1,
    title: "GitHub",
    url: "https://github.com",
    tags: [1, 2], // IDs
    icon_url: "https://github.com/favicon.ico"
  },
  {
    id: 2,
    title: "Stack Overflow",
    url: "https://stackoverflow.com",
    tags: [1],
    icon_url: "https://stackoverflow.com/favicon.ico"
  },
  {
    id: 3,
    title: "Twitter",
    url: "https://twitter.com",
    tags: [3],
    icon_url: "https://abs.twimg.com/favicons/twitter.2.ico"
  },
  {
    id: 4,
    title: "Google",
    url: "https://google.com",
    tags: [],
    icon_url: "https://google.com/favicon.ico"
  }
];

const DemoGestorLinks = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [links] = useState(INITIAL_LINKS);
  const [tags] = useState(MOCK_TAGS);
  
  // Filter Logic for Demo
  const getFilteredLinks = () => {
      // In real app we filter by tag tab_id, here we simplify
      if (activeTab === 'all') return links;
      
      const tabTags = tags.filter(t => t.tab_id === activeTab).map(t => t.id);
      return links.filter(l => l.tags.some(tagId => tabTags.includes(tagId)));
  };

  const filteredLinks = getFilteredLinks();

  return (
    <div className="min-h-full bg-slate-950 font-sans p-6 text-slate-200">
      {/* Navbar Mock */}
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 font-black text-xl text-blue-500">
            <LinkIcon /> <span>LinkHub</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">JD</div>
             <button className="p-2 text-slate-400 hover:text-white"><LogOut size={18}/></button>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
          {MOCK_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-lg scale-105"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.name}
              </button>
          ))}
          <button className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:bg-slate-800">
            <Plus size={16} />
          </button>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
          {/* Uncategorized (Only in All) */}
          {activeTab === 'all' && (
             <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                <div className="w-full flex items-center justify-between p-4 bg-slate-800/50">
                    <h3 className="font-bold text-slate-300 flex items-center gap-2">
                        <Settings size={16} className="text-slate-500" /> Sem Categoria
                        <span className="text-xs font-normal text-slate-500 ml-2">({links.filter(l => l.tags.length === 0).length})</span>
                    </h3>
                    <ChevronDown size={18} className="text-slate-500" />
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {links.filter(l => l.tags.length === 0).map(link => (
                        <MockCard key={link.id} link={link} />
                    ))}
                </div>
             </div>
          )}

          {/* Categorized Sections */}
          {tags
            .filter(tag => activeTab === 'all' || tag.tab_id === activeTab)
            .map(tag => {
                const tagLinks = links.filter(l => l.tags.includes(tag.id));
                if (tagLinks.length === 0) return null;

                return (
                    <div key={tag.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                        <div className="w-full flex items-center justify-between p-4 bg-slate-800/50">
                            <h3 className="font-bold text-slate-300 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                {tag.name}
                                <span className="text-xs font-normal text-slate-500 ml-2">({tagLinks.length})</span>
                            </h3>
                            <div className="flex gap-2">
                                <Settings size={14} className="text-slate-500" />
                                <ChevronDown size={18} className="text-slate-500" />
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {tagLinks.map(link => (
                                <MockCard key={link.id} link={link} />
                            ))}
                        </div>
                    </div>
                );
            })
          }
      </div>
    </div>
  );
};

// Mock Card Component matching the style of SortableCard
const MockCard = ({ link }) => (
    <div className="group relative flex items-center gap-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer">
        <div className="shrink-0">
            <img
                src={link.icon_url}
                className="w-12 h-12 object-contain rounded-xl bg-white p-1"
                alt="icon"
            />
        </div>
        <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-bold text-slate-100 truncate text-sm mb-0.5">
                {link.title}
            </h3>
            <p className="text-[9px] text-slate-500 truncate font-medium lowercase">
                {link.url.replace(/^https?:\/\//, "")}
            </p>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button className="p-1.5 text-slate-400 hover:text-blue-400"><Pencil size={12} /></button>
            <button className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
        </div>
    </div>
);

export default DemoGestorLinks;
