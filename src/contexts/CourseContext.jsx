import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Context per gestire il contesto del corso (Contabilità vs Cloud)
 * Centralizza la logica di routing e dati specifici del corso
 */
const CourseContext = createContext();

export const COURSES = {
  ACCOUNTING: 'accounting',
  CLOUD: 'cloud'
};

export const ROLE_ROUTES = {
  tutor: {
    [COURSES.ACCOUNTING]: '/',
    [COURSES.CLOUD]: '/'
  },
  student: {
    [COURSES.ACCOUNTING]: '/student',
    [COURSES.CLOUD]: '/student'
  }
};

export function CourseProvider({ children }) {
  const { user, getUserRole } = useAuth();
  const [activeCourse, setActiveCourse] = useState(COURSES.ACCOUNTING);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carica il ruolo dell'utente quando è autenticato
  useEffect(() => {
    const loadUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } catch (err) {
        console.error('Error loading user role:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [user, getUserRole]);

  // Determina la rotta corretta basata su ruolo e corso
  const getRouteForRole = useCallback((role, course = activeCourse) => {
    if (!role) return null;
    return ROLE_ROUTES[role]?.[course];
  }, [activeCourse]);

  // Controlla se l'utente ha accesso a un determinato corso
  const hasCourseAccess = useCallback((course) => {
    return Object.values(COURSES).includes(course);
  }, []);

  // Cambia corso attivo con validazione
  const switchCourse = useCallback((newCourse) => {
    if (hasCourseAccess(newCourse)) {
      setActiveCourse(newCourse);
    } else {
      console.warn(`Invalid course: ${newCourse}`);
    }
  }, [hasCourseAccess]);

  const value = {
    activeCourse,
    userRole,
    loading,
    setActiveCourse: switchCourse,
    getRouteForRole,
    hasCourseAccess,
    isTutor: userRole === 'tutor',
    isStudent: userRole === 'student',
    courses: COURSES,
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
