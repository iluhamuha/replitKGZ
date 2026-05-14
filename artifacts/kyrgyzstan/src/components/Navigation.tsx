import { Link } from "wouter";
import { Mountain } from "lucide-react";
import { Button } from "./ui/button";

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground transition-colors hover:text-primary">
          <Mountain className="h-6 w-6 text-primary" />
          <span>Kyrgyzstán Zájezdy</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Administrace
          </Link>
        </nav>
      </div>
    </header>
  );
}
