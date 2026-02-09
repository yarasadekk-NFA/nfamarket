import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/header";
import HomePage from "@/pages/home";
import ExplorePage from "@/pages/explore";
import AgentDetailPage from "@/pages/agent-detail";
import CreateAgentPage from "@/pages/create";
import ProfilePage from "@/pages/profile";
import MoltbookAgentPage from "@/pages/moltbook-agent";
import ImportPage from "@/pages/import";
import CollectionsPage from "@/pages/collections";
import ActivityPage from "@/pages/activity";
import AnalyticsPage from "@/pages/analytics";
import AboutPage from "@/pages/about";
import LeaderboardPage from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";
import { initAppKit } from "@/lib/walletconnect";

initAppKit();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/agent/:id" component={AgentDetailPage} />
      <Route path="/create" component={CreateAgentPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/import" component={ImportPage} />
      <Route path="/collections" component={CollectionsPage} />
      <Route path="/activity" component={ActivityPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/moltbook/:username" component={MoltbookAgentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
