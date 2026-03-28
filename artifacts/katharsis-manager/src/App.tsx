import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/Dashboard";
import Finance from "@/pages/Finance";
import Receipts from "@/pages/Receipts";
import Stickers from "@/pages/Stickers";
import Certificates from "@/pages/Certificates";
import AccountStatement from "@/pages/AccountStatement";
import Sports from "@/pages/Sports";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/finance" component={Finance} />
        <Route path="/receipts" component={Receipts} />
        <Route path="/stickers" component={Stickers} />
        <Route path="/certificates" component={Certificates} />
        <Route path="/statement" component={AccountStatement} />
        <Route path="/sports" component={Sports} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
