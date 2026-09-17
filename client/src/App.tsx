import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AnalyticsPanel from "./pages/AnalyticsPanel";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TwoFactorPage from "@/pages/TwoFactorPage";
import StatusPage from "@/pages/StatusPage";
import CaseStudy from "@/pages/CaseStudy";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/painel"} component={AnalyticsPanel} />
      <Route path={"/politica-de-privacidade"} component={PrivacyPolicy} />
      <Route path={"/autenticacao-2fa"} component={TwoFactorPage} />
      <Route path={"/status"} component={StatusPage} />
      <Route path={"/estudo-de-caso/:slug"} component={CaseStudy} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => { if ((event.target as HTMLElement).closest(".protected-media")) event.preventDefault(); };
    const onDragStart = (event: DragEvent) => { if ((event.target as HTMLElement).closest(".protected-media")) event.preventDefault(); };
    const onKeyDown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && ["s", "u", "p"].includes(event.key.toLowerCase())) event.preventDefault(); };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("contextmenu", onContextMenu); document.removeEventListener("dragstart", onDragStart); document.removeEventListener("keydown", onKeyDown); };
  }, []);
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
