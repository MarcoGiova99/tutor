import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Service layer per Firebase - astrae le operazioni database
 * Riduce la duplicazione delle importazioni e centralizza la logica
 */

// Servizio per gestione utenti
export const userService = {
  async getUserProfile(uid) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async createUserProfile(uid, data) {
    const ref = doc(db, "users", uid);
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return this.getUserProfile(uid);
  },

  async updateUserProfile(uid, data) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return this.getUserProfile(uid);
  },

  async getUserRole(uid) {
    const profile = await this.getUserProfile(uid);
    return profile?.role || null;
  },

  onUserSnapshot(uid, callback) {
    const ref = doc(db, "users", uid);
    return onSnapshot(ref, callback);
  }
};

// Servizio per gestione studenti
export const studentService = {
  async getStudentsByTutor(tutorUid) {
    const q = query(
      collection(db, "students"),
      where("tutorUid", "==", tutorUid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createStudent(data) {
    const docRef = await addDoc(collection(db, "students"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateStudent(studentId, data) {
    const ref = doc(db, "students", studentId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  onStudentsSnapshot(tutorUid, callback) {
    const q = query(
      collection(db, "students"),
      where("tutorUid", "==", tutorUid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, callback);
  },

  async getStudentByUid(studentUid) {
    const q = query(
      collection(db, "students"),
      where("uid", "==", studentUid),
      limit(1)
    );
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
};

// Servizio per gestione lezioni
export const lessonService = {
  async getLessons(studentId, courseId = 'accounting') {
    const q = query(
      collection(db, "lessons"),
      where("studentId", "==", studentId),
      where("courseId", "==", courseId),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createLesson(data) {
    const docRef = await addDoc(collection(db, "lessons"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateLesson(lessonId, data) {
    const ref = doc(db, "lessons", lessonId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteLesson(lessonId) {
    await deleteDoc(doc(db, "lessons", lessonId));
  },

  onLessonsSnapshot(studentId, courseId, callback) {
    const q = query(
      collection(db, "lessons"),
      where("studentId", "==", studentId),
      where("courseId", "==", courseId),
      orderBy("date", "desc")
    );
    return onSnapshot(q, callback);
  }
};

// Servizio per gestione materiali
export const materialService = {
  async getMaterials(studentId, courseId = 'accounting') {
    const q = query(
      collection(db, "materials"),
      where("studentId", "==", studentId),
      where("courseId", "==", courseId),
      orderBy("order", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createMaterial(data) {
    const docRef = await addDoc(collection(db, "materials"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateMaterial(materialId, data) {
    const ref = doc(db, "materials", materialId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async markMaterialCompleted(materialId) {
    const ref = doc(db, "materials", materialId);
    await updateDoc(ref, {
      completed: true,
      completedAt: serverTimestamp(),
    });
  },

  onMaterialsSnapshot(studentId, courseId, callback) {
    const q = query(
      collection(db, "materials"),
      where("studentId", "==", studentId),
      where("courseId", "==", courseId),
      orderBy("order", "asc")
    );
    return onSnapshot(q, callback);
  }
};

// Servizio per gestione messaggi
export const messageService = {
  async getMessages(studentId, courseId = 'accounting') {
    const q = query(
      collection(db, "messages"),
      where("studentId", "==", studentId),
      where("courseId", "==", courseId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async sendMessage(data) {
    const docRef = await addDoc(collection(db, "messages"), {
      ...data,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  },

  onMessagesSnapshot(studentId, courseId, callback) {
    const q = query(
      collection(db, "messages"),
      where("studentId", "==", studentId),
      where("courseId", "==", courseId),
      orderBy("timestamp", "desc")
    );
    return onSnapshot(q, callback);
  }
};

// Servizio per gestione domande/esercizi
export const questionService = {
  async getQuestionsByLevel(levelId) {
    const q = query(
      collection(db, "questions"),
      where("levelId", "==", levelId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createQuestion(data) {
    const docRef = await addDoc(collection(db, "questions"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateQuestion(questionId, data) {
    const ref = doc(db, "questions", questionId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
};
