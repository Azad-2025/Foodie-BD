import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './i18n';
import { AuthProvider } from './context/AuthContext';
import { JourneyProvider } from './context/JourneyContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { FoodMapPage } from './pages/FoodMapPage';
import { DiscoverFoodsPage } from './pages/DiscoverFoodsPage';
import { FoodDetailsPage } from './pages/FoodDetailsPage';
import { DistrictDetailsPage } from './pages/DistrictDetailsPage';
import { DistrictListPage } from './pages/DistrictListPage';
import { FoodieCardPage } from './pages/FoodieCardPage';
import { MyJourneyPage } from './pages/MyJourneyPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { District, Division, Food, PlatformStats } from './types';
import { api } from './lib/api';

function AppContent() {
  const { t } = useLanguage();
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);

  const [districts, setDistricts] = useState<District[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoadingCore, setIsLoadingCore] = useState<boolean>(true);

  // Sync route with window.location.hash for smooth deep-linking and browser navigation
  const parseHash = useCallback(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      setCurrentRoute('home');
      setRouteParam(undefined);
      return;
    }

    const parts = hash.split('/');
    const main = parts[0] || 'home';
    const rawParam = parts.slice(1).join('/');
    const param = rawParam ? decodeURIComponent(rawParam) : undefined;

    setCurrentRoute(main);
    setRouteParam(param);
  }, []);

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [parseHash]);

  const navigate = (route: string, param?: string) => {
    if (param) {
      window.location.hash = `#${route}/${param}`;
    } else {
      window.location.hash = `#${route}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load core datasets from persistent backend
  const loadCoreData = useCallback(async () => {
    try {
      setIsLoadingCore(true);
      const [divsData, distsData, foodsData, statsData] = await Promise.all([
        api.getDivisions(),
        api.getDistricts(),
        api.getFoods(),
        api.getStats(),
      ]);

      setDivisions(divsData);
      setDistricts(distsData);
      setFoods(foodsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load initial core data:', err);
    } finally {
      setIsLoadingCore(false);
    }
  }, []);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <HomePage
            navigate={navigate}
            foods={foods}
            districts={districts}
            divisions={divisions}
            stats={stats}
          />
        );

      case 'map': {
        const isDiv = divisions.some((d) => d.id === routeParam);
        const isDist = districts.some((d) => d.id === routeParam);
        return (
          <FoodMapPage
            districts={districts}
            divisions={divisions}
            foods={foods}
            initialDivisionId={isDiv ? routeParam : undefined}
            initialDistrictId={isDist ? routeParam : undefined}
            navigate={navigate}
          />
        );
      }

      case 'discover':
        return (
          <DiscoverFoodsPage
            foods={foods}
            districts={districts}
            divisions={divisions}
            initialSearch={routeParam}
            navigate={navigate}
          />
        );

      case 'food':
        if (!routeParam) {
          return (
            <DiscoverFoodsPage
              foods={foods}
              districts={districts}
              divisions={divisions}
              navigate={navigate}
            />
          );
        }
      case 'food':
        if (!routeParam) {
          return (
            <DiscoverFoodsPage
              foods={foods}
              districts={districts}
              divisions={divisions}
              navigate={navigate}
            />
          );
        }
        return (
          <FoodDetailsPage
            foodId={routeParam}
            navigate={navigate}
            districts={districts}
            divisions={divisions}
            onRefreshFoods={loadCoreData}
          />
        );

      case 'district':
        if (!routeParam) {
          return (
            <DistrictListPage
              districts={districts}
              divisions={divisions}
              foods={foods}
              navigate={navigate}
            />
          );
        }
        return (
          <DistrictDetailsPage
            districtId={routeParam}
            allDistricts={districts}
            allDivisions={divisions}
            navigate={navigate}
          />
        );

      case 'journey':
        return (
          <MyJourneyPage
            districts={districts}
            divisions={divisions}
            navigate={navigate}
          />
        );

      case 'foodie-card':
      case 'card':
        return (
          <FoodieCardPage
            districts={districts}
            divisions={divisions}
            foods={foods}
            navigate={navigate}
          />
        );

      case 'profile':
      case 'contributions':
      case 'suggest':
      case 'suggest-food':
        return <MyProfilePage districts={districts} divisions={divisions} navigate={navigate} />;

      case 'login':
        return <LoginPage navigate={navigate} />;

      case 'register':
        return <RegisterPage districts={districts} navigate={navigate} />;

      case 'admin':
        return (
          <AdminDashboardPage
            districts={districts}
            divisions={divisions}
            foods={foods}
            onRefreshFoods={loadCoreData}
            navigate={navigate}
            initialEditFoodId={routeParam}
          />
        );

      case 'about':
        return <AboutPage navigate={navigate} />;

      case 'contact':
        return <ContactPage districts={districts} navigate={navigate} />;

      case 'privacy':
        return <PrivacyPolicyPage />;

      case 'terms':
        return <TermsPage />;

      default:
        return (
          <HomePage
            navigate={navigate}
            foods={foods}
            districts={districts}
            divisions={divisions}
            stats={stats}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-slate-800 antialiased selection:bg-[#155C3A] selection:text-white">
      <Header currentRoute={currentRoute} navigate={navigate} />

      <main className="flex-1">
        {isLoadingCore && foods.length === 0 ? (
          <div className="max-w-md mx-auto my-32 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-[#155C3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-800 font-bengali">
              {t('map.loadingMap')}
            </p>
            <p className="text-xs text-slate-500">
              Initializing verified 64-district culinary database...
            </p>
          </div>
        ) : (
          renderCurrentPage()
        )}
      </main>

      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <JourneyProvider>
          <AppContent />
        </JourneyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
