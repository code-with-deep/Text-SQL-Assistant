'use client';

import React from 'react';
import Link from 'next/link';
import { Database } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-border bg-bg-surface overflow-hidden">
      {/* Background Gradient Accent */}
      <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-t from-indigo-500/10 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Logo & Pitch */}
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                QueryAI
              </span>
            </Link>
            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              Empowering business and technical teams alike to transform natural language into safe, precise SQL queries and actionable interactive charts in seconds.
            </p>
          </div>

          {/* Column 1: Product */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">Product</span>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, '#how-it-works')} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#demo" onClick={(e) => handleSmoothScroll(e, '#demo')} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Live Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">Company</span>
            <ul className="flex flex-col gap-2.5">
              <li>
                <span className="text-sm text-text-muted cursor-not-allowed hover:text-text-primary transition-colors">About Us</span>
              </li>
              <li>
                <span className="text-sm text-text-muted cursor-not-allowed hover:text-text-primary transition-colors">Blog</span>
              </li>
              <li>
                <span className="text-sm text-text-muted cursor-not-allowed hover:text-text-primary transition-colors">Careers</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Developers */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">Developers & Legal</span>
            <ul className="flex flex-col gap-2.5">
              <li>
                <span className="text-sm text-text-muted cursor-not-allowed hover:text-text-primary transition-colors">API Docs</span>
              </li>
              <li>
                <span className="text-sm text-text-muted cursor-not-allowed hover:text-text-primary transition-colors">Terms of Service</span>
              </li>
              <li>
                <span className="text-sm text-text-muted cursor-not-allowed hover:text-text-primary transition-colors">Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-10 border-border" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; {currentYear} QueryAI. Built with best-in-class technology. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-bg-base hover:bg-bg-elevated text-text-muted hover:text-text-primary border border-border transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-bg-base hover:bg-bg-elevated text-text-muted hover:text-text-primary border border-border transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-bg-base hover:bg-bg-elevated text-text-muted hover:text-text-primary border border-border transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
