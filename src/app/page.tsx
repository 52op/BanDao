"use client";

import Link from "next/link";
import { tools } from "@/tools/registry";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
        <h1 className="font-heading text-5xl sm:text-6xl md:text-[4.5rem] font-bold tracking-tight leading-tight animate-fade-in-up">
          办到 · 即用即走
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed animate-fade-in-up stagger-1">
          所有工具均在浏览器本地完成处理，您的文件绝不会上传到任何服务器
        </p>
        <div className="flex items-center gap-1.5 mt-4 text-sm text-muted-foreground/60 animate-fade-in-up stagger-2">
          <Shield className="h-4 w-4" />
          无需注册 · 不上传服务器 · 完全免费
        </div>
      </section>

      {/* Tool Cards */}
      <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                <div
                  className={`group relative flex flex-col gap-3 p-6 rounded-xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 cursor-pointer h-full animate-fade-in-up stagger-${i + 1}`}
                >
                  <div className="p-2.5 rounded-lg bg-muted/50 w-fit">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                  <span className="text-muted-foreground/40 text-sm transition-colors group-hover:text-foreground/60 mt-1">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground/50 border-t border-border/40">
        办到 · 所有工具纯前端本地运行，不收集任何用户数据
      </footer>
    </div>
  );
}
