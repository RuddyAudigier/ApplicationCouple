import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import LoginPage from "./auth/LoginPage";
import AuthCallback from "./auth/AuthCallback";
import PoetryWidgetPage from "./PoetryWidgetPage";
import CahierApp from "./CahierApp";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/poesie-widget"
            element={
              <RequireAuth>
                <PoetryWidgetPage />
              </RequireAuth>
            }
          />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <CahierApp />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
