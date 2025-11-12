import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallback from "@/react-app/pages/AuthCallback";
import Dashboard from "@/react-app/pages/Dashboard";
import Transactions from "@/react-app/pages/Transactions";
import Accounts from "@/react-app/pages/Accounts";
import ChartOfAccounts from "@/react-app/pages/ChartOfAccounts";
import CostCenters from "@/react-app/pages/CostCenters";
import ProductsServices from "@/react-app/pages/ProductsServices";
import CashFlowCreation from "@/react-app/pages/CashFlowCreation";
import BankReconciliation from "@/react-app/pages/BankReconciliation";

import Reports from "@/react-app/pages/Reports";
import Insights from "@/react-app/pages/Insights";
import Settings from "@/react-app/pages/Settings";
import Onboarding from "@/react-app/pages/Onboarding";

import TalkToAccountant from "@/react-app/pages/TalkToAccountant";
import Layout from "@/react-app/components/Layout";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transacoes" element={<Transactions />} />
            <Route path="contas" element={<Accounts />} />
            <Route path="plano-contas" element={<ChartOfAccounts />} />
            <Route path="centros-custo" element={<CostCenters />} />
            <Route path="produtos-servicos" element={<ProductsServices />} />
            <Route path="fluxo-caixa" element={<CashFlowCreation />} />
            <Route path="conciliacao" element={<BankReconciliation />} />
            
            <Route path="relatorios" element={<Reports />} />
            <Route path="insights" element={<Insights />} />
            
            <Route path="falar-contador" element={<TalkToAccountant />} />
            <Route path="configuracoes" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
