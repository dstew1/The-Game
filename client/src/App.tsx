import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import RoadmapPage from "./pages/RoadmapPage";
import ProfilePage from "./pages/ProfilePage";
import NetworkPage from "./pages/NetworkPage";
import JourneyPage from "./pages/JourneyPage";
import MarketPage from "./pages/MarketPage";
import LegalPage from "./pages/LegalPage";
import OnboardingSurvey from "./components/onboarding/OnboardingSurvey";
import IntroAnimation from "./components/IntroAnimation";
import { useUser } from "./hooks/use-user";
import { useState } from "react";

// Protected Route wrapper component
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { user } = useUser();
  return user ? <Component {...rest} /> : <AuthPage />;
};

function App() {
  const { user, isLoading } = useUser();
  const [showIntro, setShowIntro] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show intro animation for authenticated users
  if (user && showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  // Show onboarding survey for new users
  if (user && !user.hasCompletedOnboarding) {
    return <OnboardingSurvey />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Switch>
        {/* Public routes */}
        <Route path="/terms-of-service">
          <LegalPage />
        </Route>
        <Route path="/privacy-policy">
          <LegalPage />
        </Route>
        <Route path="/auth">
          <AuthPage />
        </Route>

        {/* Protected routes */}
        <Route path="/">
          {user ? <Dashboard /> : <AuthPage />}
        </Route>
        <Route path="/journey">
          <ProtectedRoute component={JourneyPage} />
        </Route>
        <Route path="/roadmap">
          <ProtectedRoute component={RoadmapPage} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={ProfilePage} />
        </Route>
        <Route path="/network">
          <ProtectedRoute component={NetworkPage} />
        </Route>
        <Route path="/market">
          <ProtectedRoute component={MarketPage} />
        </Route>
      </Switch>
    </div>
  );
}

export default App;