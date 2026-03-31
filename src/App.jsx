import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import Page1 from "./Page1";
import Page2 from "./Page2";
import Page3 from "./Page3";
import Page4 from "./Page4";
import Page5 from "./Page5";
import Page6 from "./Page6";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import LoginPage from "./auth/LoginPage";
import AuthCallback from "./auth/AuthCallback";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/page1"
            element={
              <RequireAuth>
                <Page1 />
              </RequireAuth>
            }
          />
          <Route
            path="/page2"
            element={
              <RequireAuth>
                <Page2 />
              </RequireAuth>
            }
          />
          <Route
            path="/page3"
            element={
              <RequireAuth>
                <Page3 />
              </RequireAuth>
            }
          />
          <Route
            path="/page4"
            element={
              <RequireAuth>
                <Page4 />
              </RequireAuth>
            }
          />
          <Route
            path="/page5"
            element={
              <RequireAuth>
                <Page5 />
              </RequireAuth>
            }
          />
          <Route
            path="/page6"
            element={
              <RequireAuth>
                <Page6 />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
