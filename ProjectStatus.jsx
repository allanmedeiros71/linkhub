import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Link as LinkIcon,
  CheckCircle,
  Zap,
  Shield,
  Layout,
  Move,
  Code2
} from "lucide-react";
import DemoGestorLinks from "./demo_gestor_links";

export default function ProjectStatus() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Detect system theme preference or use local storage if we shared it (we don't easily share localStorage across pages unless we sync it, but for a landing page, default or system is fine)
    // Actually, let's just stick to a clean light/dark support based on system for now or default to light/dark based on class.
    // For simplicity in this status page, let's force a specific look or support the class 'dark' if the parent html has it.
    // But since this is a separate route, the 'dark' class on <html> might not be set if we don't have the logic here.
    // Let's copy the basic theme logic from App.jsx for consistency.
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    const root = window.document.documentElement;
    if (savedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-green-500" />,
      title: "Autenticação Segura",
      description:
        "Login robusto via Google, GitHub ou Email/Senha com criptografia.",
      status: "Implementado",
    },
    {
      icon: <Layout className="w-6 h-6 text-blue-500" />,
      title: "Abas & Categorias",
      description:
        "Organize seus links em abas personalizadas e categorias coloridas.",
      status: "Novo",
    },
    {
      icon: <Move className="w-6 h-6 text-purple-500" />,
      title: "Drag & Drop Total",
      description: "Reordene abas, categorias e links arrastando e soltando.",
      status: "Aprimorado",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "UX Refinada",
      description:
        "Modais de confirmação modernos, temas variados e interações fluidas.",
      status: "Implementado",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 font-black text-xl text-blue-600">
              <LinkIcon />
              <span className="text-slate-900 dark:text-white tracking-tight">
                LinkHub
              </span>
            </div>
            <nav>
              <Link
                to="/app"
                className="bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
              >
                Acessar App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Status do Projeto: Ativo & Evoluindo
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Gerencie seus links com <br className="hidden md:block" /> organização suprema.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            O LinkHub evoluiu. Agora com suporte a múltiplas abas, categorização inteligente
            e uma experiência de usuário totalmente renovada.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
            >
              Começar Agora
            </Link>
            <a
              href="https://github.com/allanmedeiros71/linkhub"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Ver no GitHub
            </a>
          </div>
        </div>
      </section>

      {/* App Demo Preview */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 p-4 md:p-8 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

            <div className="relative text-center mb-10">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
                Nova Interface v2.0
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                Poder Organizacional
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Navegue entre abas, gerencie categorias com cores personalizadas e 
                arraste tudo para onde quiser. Uma interface pensada para produtividade.
              </p>
            </div>

            {/* Mock Window */}
            <div className="relative max-w-5xl mx-auto bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transition-all duration-500 hover:shadow-purple-500/10 h-[600px] overflow-y-auto custom-scrollbar">
              {/* Mock Window Header */}
              <div className="h-10 border-b border-slate-800 bg-slate-900 flex items-center px-4 gap-2 sticky top-0 z-50">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-4 h-6 px-4 bg-slate-800 rounded-md flex items-center justify-center text-[10px] text-slate-400 font-mono flex-1 max-w-sm mx-auto">
                   linkhub-demo.vercel.app
                </div>
              </div>

              {/* Render the imported demo component */}
              <div className="transform scale-[0.9] origin-top h-full">
                 <DemoGestorLinks />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">
              Estado Atual do Desenvolvimento
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Funcionalidades já implementadas e disponíveis para uso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <CheckCircle size={14} />
                  {feature.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-12 flex items-center justify-center gap-3">
            <Code2 className="text-slate-400" />
            Stack Tecnológico
          </h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple text representation for tech stack logos for now */}
            <span className="text-xl font-black text-slate-800 dark:text-white">
              React
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white">
              Node.js
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white">
              PostgreSQL
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white">
              Tailwind
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white">
              Docker
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
        <p>
          Desenvolvido com ❤️ por <a href="https://github.com/allanmedeiros71" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors">Allan Medeiros</a>.
          <br className="md:hidden" /> 
          Código aberto sob a licença MIT.
        </p>
      </footer>
    </div>
  );
}
