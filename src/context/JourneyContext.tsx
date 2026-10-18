import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { UserFoodTracking, Food, District, Division, Achievement } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface JourneyItem extends UserFoodTracking {
  food?: Food;
  district?: District;
  division?: Division;
}

interface JourneyContextType {
  journey: JourneyItem[];
  achievements: Achievement[];
  isLoading: boolean;
  triedFoodIds: Set<string>;
  wantToTryFoodIds: Set<string>;
  visitedDistrictIds: Set<string>;
  visitedDivisionIds: Set<string>;
  trackFood: (
    foodId: string,
    status: 'tried' | 'want_to_try',
    extra?: { triedAt?: string; rating?: number; notes?: string; photoUrl?: string }
  ) => Promise<void>;
  removeFromJourney: (foodId: string) => Promise<void>;
  isFoodTried: (foodId: string) => boolean;
  isFoodWanted: (foodId: string) => boolean;
  getFoodTracking: (foodId: string) => JourneyItem | undefined;
  refreshJourney: () => Promise<void>;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [journey, setJourney] = useState<JourneyItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshJourney = useCallback(async () => {
    if (!isLoggedIn) {
      setJourney([]);
      setAchievements([]);
      return;
    }

    try {
      setIsLoading(true);
      const [journeyData, achData] = await Promise.all([
        api.getUserJourney(),
        api.getUserAchievements(),
      ]);
      setJourney(journeyData);
      setAchievements(achData);
    } catch (err) {
      console.warn('Could not fetch journey:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshJourney();
  }, [refreshJourney]);

  const triedFoodIds = useMemo(() => {
    const set = new Set<string>();
    journey.forEach((item) => {
      if (item.status === 'tried') set.add(item.foodId);
    });
    return set;
  }, [journey]);

  const wantToTryFoodIds = useMemo(() => {
    const set = new Set<string>();
    journey.forEach((item) => {
      if (item.status === 'want_to_try') set.add(item.foodId);
    });
    return set;
  }, [journey]);

  const visitedDistrictIds = useMemo(() => {
    const set = new Set<string>();
    journey.forEach((item) => {
      if (item.status === 'tried' && item.district?.id) {
        set.add(item.district.id);
      }
    });
    return set;
  }, [journey]);

  const visitedDivisionIds = useMemo(() => {
    const set = new Set<string>();
    journey.forEach((item) => {
      if (item.status === 'tried' && item.division?.id) {
        set.add(item.division.id);
      }
    });
    return set;
  }, [journey]);

  const trackFood = async (
    foodId: string,
    status: 'tried' | 'want_to_try',
    extra?: { triedAt?: string; rating?: number; notes?: string; photoUrl?: string }
  ) => {
    if (!isLoggedIn) {
      throw new Error('Please log in to track your food journey.');
    }

    await api.trackFood(foodId, status, extra);
    if (status === 'tried') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#155C3A', '#E74C3C', '#F39C3D'],
        });
      } catch {}
    }
    await refreshJourney();
  };

  const removeFromJourney = async (foodId: string) => {
    if (!isLoggedIn) return;
    await api.removeJourneyFood(foodId);
    await refreshJourney();
  };

  const isFoodTried = (foodId: string) => triedFoodIds.has(foodId);
  const isFoodWanted = (foodId: string) => wantToTryFoodIds.has(foodId);
  const getFoodTracking = (foodId: string) => journey.find((j) => j.foodId === foodId);

  return (
    <JourneyContext.Provider
      value={{
        journey,
        achievements,
        isLoading,
        triedFoodIds,
        wantToTryFoodIds,
        visitedDistrictIds,
        visitedDivisionIds,
        trackFood,
        removeFromJourney,
        isFoodTried,
        isFoodWanted,
        getFoodTracking,
        refreshJourney,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};
