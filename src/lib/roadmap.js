// src/lib/roadmap.js

export const ROADMAPS = {
  // --- CONTABILITÀ (INVARIATO) ---
  accounting: [
    { id: "acc-01-general", title: "Contabilità Generale", subtitle: "Introduzione", icon: "📘", difficulty: "easy", indent: 0, req: null },
    { id: "acc-02-ratei", title: "Ratei e Risconti", subtitle: "Ratei e Risconti copia.pdf", icon: "⏳", difficulty: "medium", indent: 0, req: "acc-01-general" },
    { id: "acc-03-iva", title: "L'IVA", subtitle: "L'IVA copia.pdf", icon: "💸", difficulty: "hard", indent: 0, req: "acc-02-ratei" }
  ],

  // --- CLOUD COMPUTING (17 LEZIONI) ---
  cloud: [
    // LECTURE 01
    { id: "c-01-intro", title: "Introduction", subtitle: "Lecture 01", icon: "👋", difficulty: "easy", indent: 0, req: null },
    { id: "c-01-arch", title: "Computer Architecture", subtitle: "Lecture 01", icon: "💻", difficulty: "easy", indent: -1, req: "c-01-intro" },
    { id: "c-01-net", title: "Networks", subtitle: "Lecture 01", icon: "🌐", difficulty: "easy", indent: 1, req: "c-01-arch" },

    // LECTURE 02
    { id: "c-02-concepts", title: "Cloud Concepts", subtitle: "Lecture 02", icon: "☁️", difficulty: "medium", indent: 0, req: "c-01-net" },

    // LECTURE 03
    { id: "c-03-models", title: "Cloud Service Models", subtitle: "Lecture 03", icon: "📦", difficulty: "medium", indent: -1, req: "c-02-concepts" },

    // LECTURE 04
    { id: "c-04-virt", title: "Virtualization", subtitle: "Lecture 04", icon: "🖥️", difficulty: "medium", indent: 1, req: "c-03-models" },

    // LECTURE 05
    { id: "c-05-cont", title: "Containers", subtitle: "Lecture 05", icon: "🐳", difficulty: "hard", indent: 0, req: "c-04-virt" },
    { id: "c-05-dist", title: "Distributed computing", subtitle: "Lecture 05", icon: "🔗", difficulty: "hard", indent: -1, req: "c-05-cont" },

    // LECTURE 06
    { id: "c-06-k8s-intro", title: "Kubernetes Intro", subtitle: "Lecture 06", icon: "☸️", difficulty: "hard", indent: 1, req: "c-05-dist" },
    { id: "c-06-micro", title: "Microservices", subtitle: "Lecture 06", icon: "🧩", difficulty: "hard", indent: 0, req: "c-06-k8s-intro" },

    // LECTURE 07
    { id: "c-07-k8s-det", title: "Kubernetes Details", subtitle: "Lecture 07", icon: "⚙️", difficulty: "hard", indent: -1, req: "c-06-micro" },
    { id: "c-07-native", title: "Cloud Native Concepts", subtitle: "Lecture 07", icon: "🚀", difficulty: "hard", indent: 1, req: "c-07-k8s-det" },

    // LECTURE 08
    { id: "c-08-devops", title: "DevOps and Git", subtitle: "Lecture 08", icon: "♾️", difficulty: "medium", indent: 0, req: "c-07-native" },
    { id: "c-08-bigdata", title: "Introduction to Big Data", subtitle: "Lecture 08", icon: "📊", difficulty: "medium", indent: -1, req: "c-08-devops" },

    // LECTURE 09
    { id: "c-09-nosql", title: "NoSQL Databases", subtitle: "Lecture 09", icon: "🗄️", difficulty: "hard", indent: 1, req: "c-08-bigdata" },
    { id: "c-09-serverless", title: "Serverless", subtitle: "Lecture 09", icon: "⚡", difficulty: "hard", indent: 0, req: "c-09-nosql" },
    { id: "c-09-terraform", title: "Terraform", subtitle: "Lecture 09", icon: "🏗️", difficulty: "boss", indent: 0, req: "c-09-serverless" }
  ]
};
console.log("🔹 Roadmap JS Loaded - v2026-01-16-REORDER");