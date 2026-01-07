/**
 * EXERCISES DATABASE (STATIC / LEGACY)
 * * * Questo file contiene i dati statici per il corso di CONTABILITÀ.
 * * I livelli Cloud Computing (c-l01...) NON sono qui: vengono caricati da FIRESTORE.
 * * * Struttura Dati:
 * - type: 'quiz' (Scelta multipla) -> Richiede 'options'
 * - type: 'challenge' (Partita Doppia) -> Richiede 'solution' (Dare/Avere) e 'availableAccounts'
 */

export const EXERCISES_DB = {
  
    // =================================================================
    // CORSO: CONTABILITÀ (Static File)
    // =================================================================
    
    // --- LIVELLO 1: LE BASI ---
    "lvl_1_base": [
      // --- EASY (Concetti) ---
      {
        id: "l1_e1",
        type: "quiz",
        difficulty: "easy",
        question: "Qual è la differenza tra 'Denaro' e 'Utile'?",
        options: [
          { id: "a", text: "Sono sinonimi." },
          { id: "b", text: "Il denaro è la liquidità in cassa, l'utile è la ricchezza creata (Ricavi - Costi).", correct: true },
          { id: "c", text: "Il denaro è economico, l'utile è finanziario." }
        ],
        explanation: "Avere tanti soldi in cassa non significa aver guadagnato (potresti aver chiesto un prestito!). L'utile è la differenza economica tra ricavi e costi."
      },
      // --- MEDIUM (Logica Dare/Avere) ---
      {
        id: "l1_m1",
        type: "quiz",
        difficulty: "medium",
        question: "Se un conto finanziario (es. Banca) ha un'eccedenza in DARE, significa che...",
        options: [
          { id: "a", text: "Siamo in debito verso la banca (scoperto)." },
          { id: "b", text: "Abbiamo soldi depositati in banca (saldo attivo).", correct: true },
          { id: "c", text: "La banca ha chiuso il conto." }
        ],
        explanation: "I conti finanziari (Cassa, Banca, Crediti) accolgono gli aumenti in DARE. Se il saldo è Dare, abbiamo soldi/crediti."
      },
      // --- HARD (Scrittura Base con trabocchetto) ---
      {
        id: "l1_h1",
        type: "challenge",
        difficulty: "hard",
        question: "Prelevi 200€ dalla Banca per pagare un piccolo debito verso un fornitore in contanti (Cassa). Attenzione ai passaggi: prima prelevi, poi paghi. Registra solo il PRELIEVO (Banca -> Cassa).",
        solution: [
          { account: "Denaro in cassa", section: "dare" },
          { account: "Banca X c/c", section: "avere" }
        ],
        availableAccounts: ["Denaro in cassa", "Banca X c/c", "Debiti v/fornitori", "Costi vari"],
        explanation: "L'operazione è un giroconti. I soldi entrano in Cassa (Dare, +Liquidità) ed escono dalla Banca (Avere, -Liquidità)."
      }
    ],
  
    // --- LIVELLO 2: PARTITA DOPPIA ---
    "lvl_2_pd": [
      // --- EASY ---
      {
        id: "l2_e1",
        type: "quiz",
        difficulty: "easy",
        question: "Dove si registrano i COSTI d'esercizio?",
        options: [
          { id: "a", text: "Sempre in DARE (Variazione Economica Negativa)", correct: true },
          { id: "b", text: "Sempre in AVERE (Variazione Economica Positiva)" },
          { id: "c", text: "Dipende se sono stati pagati o no" }
        ],
        explanation: "I costi (acquisti, stipendi, affitti) vanno sempre in Dare. I ricavi sempre in Avere."
      },
      // --- MEDIUM (Incasso Credito) ---
      {
        id: "l2_m1",
        type: "challenge",
        difficulty: "medium",
        question: "Un cliente ti paga una vecchia fattura di 5.000€ tramite bonifico bancario.",
        solution: [
          { account: "Banca X c/c", section: "dare" },
          { account: "Crediti v/clienti", section: "avere" }
        ],
        availableAccounts: ["Banca X c/c", "Crediti v/clienti", "Merci c/vendite", "Cassa"],
        explanation: "Entrano soldi in banca (Dare). Si estingue il credito verso il cliente (Avere, -Crediti)."
      },
      // --- HARD (Pagamento misto) ---
      {
        id: "l2_h1",
        type: "challenge",
        difficulty: "hard",
        question: "Paghi un fornitore di 1.000€: metà con Bonifico e metà in Contanti.",
        solution: [
          { account: "Debiti v/fornitori", section: "dare" },
          { account: "Banca X c/c", section: "avere" },
          { account: "Denaro in cassa", section: "avere" }
        ],
        availableAccounts: ["Debiti v/fornitori", "Banca X c/c", "Denaro in cassa", "Crediti v/clienti"],
        explanation: "Il debito si chiude totalmente (Dare 1000). Le uscite sono due: Banca (Avere 500) e Cassa (Avere 500)."
      }
    ],
  
    // --- LIVELLO 3: MONDO IVA ---
    "lvl_3_iva": [
      // --- EASY (Concettuale) ---
      {
        id: "l3_e1",
        type: "quiz",
        difficulty: "easy",
        question: "L'IVA sulle VENDITE è...",
        options: [
          { id: "a", text: "Un debito verso lo Stato", correct: true },
          { id: "b", text: "Un credito verso lo Stato" },
          { id: "c", text: "Un ricavo per l'azienda" }
        ],
        explanation: "Quando vendi, incassi l'IVA dal cliente ma non è tua. Devi versarla allo Stato, quindi è un Debito."
      },
      // --- MEDIUM (Fattura Acquisto con Immagine) ---
      {
        id: "l3_m1",
        type: "challenge",
        difficulty: "medium",
        imageUrl: "https://placehold.co/600x250/fff/000?text=FATTURA+FORNITORE%0A----------------------%0AMerce:+1.000%E2%82%AC%0AIVA+(22%25):+220%E2%82%AC%0A----------------------%0ATOTALE:+1.220%E2%82%AC",
        question: "Registra la fattura di acquisto che vedi nell'immagine.",
        solution: [
          { account: "Merci c/acquisti", section: "dare" },
          { account: "IVA ns/credito", section: "dare" },
          { account: "Debiti v/fornitori", section: "avere" }
        ],
        availableAccounts: ["Merci c/acquisti", "IVA ns/credito", "Debiti v/fornitori", "IVA ns/debito", "Banca X c/c"],
        explanation: "Costo (1000) + IVA a Credito (220) = Debito totale verso fornitore (1220)."
      },
      // --- HARD (Scorporo IVA e Resi) ---
      {
        id: "l3_h1",
        type: "challenge",
        difficulty: "hard",
        question: "Hai restituito merce difettosa. Il fornitore invia una NOTA DI CREDITO di 100€ + IVA 22%. Registra la rettifica.",
        solution: [
          { account: "Debiti v/fornitori", section: "dare" },
          { account: "Resi su acquisti", section: "avere" },
          { account: "IVA ns/credito", section: "avere" }
        ],
        availableAccounts: ["Debiti v/fornitori", "Resi su acquisti", "IVA ns/credito", "Merci c/acquisti", "IVA ns/debito"],
        explanation: "La nota di credito inverte la fattura. Riduci il debito (Dare). Rettifichi il costo (Resi su acquisti in Avere) e rettifichi l'IVA a credito (Avere)."
      },
      
      // --- ESERCIZI ESTESI (IVA) ---
      {
        id: "lIVA_01",
        type: "challenge",
        difficulty: "easy",
        question: "Acquisto di cancelleria da fornitore italiano: imponibile €200, IVA 22% a credito. Pagamento a 30 giorni (fattura da pagare). Registra la fattura.",
        solution: [
          { account: "Cancelleria c/acquisti", section: "dare" },
          { account: "IVA a credito", section: "dare" },
          { account: "Debiti v/fornitori", section: "avere" }
        ],
        availableAccounts: ["Cancelleria c/acquisti", "IVA a credito", "Debiti v/fornitori", "IVA a debito", "Crediti v/clienti"],
        explanation: "In fattura d’acquisto: il costo e l’IVA a credito vanno in Dare; il debito verso il fornitore va in Avere per il totale fattura."
      },
      {
        id: "lIVA_02",
        type: "challenge",
        difficulty: "easy",
        question: "Vendita di merci a cliente italiano: imponibile €500, IVA 22% a debito. Incasso immediato in banca. Registra la vendita.",
        solution: [
          { account: "Banca c/c", section: "dare" },
          { account: "Ricavi vendite", section: "avere" },
          { account: "IVA a debito", section: "avere" }
        ],
        availableAccounts: ["Banca c/c", "Ricavi vendite", "IVA a debito", "IVA a credito", "Cassa"],
        explanation: "In vendita: incasso in Dare (totale €610); ricavo (€500) e IVA a debito (€110) in Avere."
      },
      {
        id: "lIVA_03",
        type: "challenge",
        difficulty: "easy",
        question: "Acquisto di carburante: imponibile €100, IVA 22% a credito. Pagamento in contanti. Registra l’operazione.",
        solution: [
          { account: "Carburanti c/acquisti", section: "dare" },
          { account: "IVA a credito", section: "dare" },
          { account: "Cassa", section: "avere" }
        ],
        availableAccounts: ["Carburanti c/acquisti", "IVA a credito", "Cassa", "Banca c/c", "IVA a debito"],
        explanation: "Costo + IVA a credito in Dare; uscita di cassa in Avere."
      },
      {
        id: "lIVA_04",
        type: "challenge", 
        difficulty: "easy",
        question: "Fattura di vendita imponibile €1.000 con IVA 22% non ancora incassata: quali conti devono comparire nella scrittura corretta?",
        solution: [
          { account: "Crediti v/clienti", section: "dare" },
          { account: "Ricavi vendite", section: "avere" },
          { account: "IVA a debito", section: "avere" }
        ],
        availableAccounts: ["Crediti v/clienti", "Ricavi vendite", "IVA a debito", "IVA a credito", "Debiti v/fornitori"],
        explanation: "Se non incassi subito, nasce un credito verso il cliente per il totale fattura (€1.220); ricavo (€1.000) e IVA a debito (€220) vanno in Avere."
      },
      {
        id: "lIVA_05",
        type: "challenge",
        difficulty: "medium",
        question: "Nota di credito a cliente per reso merci: imponibile €150, IVA 22%. La vendita originaria era a credito (non incassata). Registra la nota di credito.",
        solution: [
          { account: "Resi su vendite", section: "dare" },
          { account: "IVA a debito", section: "dare" },
          { account: "Crediti v/clienti", section: "avere" }
        ],
        availableAccounts: ["Resi su vendite", "IVA a debito", "Crediti v/clienti", "IVA a credito", "Debiti v/fornitori"],
        explanation: "La nota di credito riduce ricavi (reso) e IVA a debito: entrambi in Dare; diminuisce anche il credito verso il cliente in Avere."
      },
      {
        id: "lIVA_06",
        type: "challenge",
        difficulty: "medium",
        question: "Fattura di acquisto di servizi: imponibile €800, IVA 22%. Il fornitore concede sconto in fattura del 10% sull’imponibile. Pagamento a 60 giorni. Registra la fattura.",
        solution: [
          { account: "Spese per servizi", section: "dare" },
          { account: "IVA a credito", section: "dare" },
          { account: "Debiti v/fornitori", section: "avere" }
        ],
        availableAccounts: ["Spese per servizi", "IVA a credito", "Debiti v/fornitori", "IVA a debito", "Crediti v/clienti"],
        explanation: "Lo sconto riduce l’imponibile: 800 * 90% = 720. IVA 22% su 720 = 158,40. Totale debito 878,40."
      },
      {
        id: "lIVA_07",
        type: "challenge",
        difficulty: "medium",
        question: "Fattura di vendita con acconto già incassato: imponibile €1.000, IVA 22%. Il cliente aveva già versato un acconto di €244. Ora emetti la fattura a saldo. Registra SOLO la fattura a saldo (storno acconto).",
        solution: [
          { account: "Crediti v/clienti", section: "dare" },
          { account: "Anticipi da clienti", section: "dare" },
          { account: "Ricavi vendite", section: "avere" },
          { account: "IVA a debito", section: "avere" }
        ],
        availableAccounts: ["Crediti v/clienti", "Anticipi da clienti", "Ricavi vendite", "IVA a debito", "IVA a credito"],
        explanation: "Il totale fattura è 1.220. Storni l’acconto (passivo) in Dare e il residuo resta a credito verso cliente: 1.220 - 244 = 976."
      },
      {
        id: "lIVA_08",
        type: "challenge",
        difficulty: "medium",
        question: "Acquisto di bene strumentale: imponibile €5.000, IVA 22% a credito. Pagamento immediato tramite bonifico. Registra la fattura e il pagamento contestuale (un’unica scrittura).",
        solution: [
          { account: "Impianti e macchinari", section: "dare" },
          { account: "IVA a credito", section: "dare" },
          { account: "Banca c/c", section: "avere" }
        ],
        availableAccounts: ["Impianti e macchinari", "IVA a credito", "Banca c/c", "Debiti v/fornitori", "IVA a debito"],
        explanation: "Bene strumentale e IVA a credito in Dare; uscita banca in Avere per il totale (€6.100)."
      },
      {
        id: "lIVA_09",
        type: "challenge",
        difficulty: "hard",
        question: "Liquidazione IVA mensile: IVA a debito €2.600 e IVA a credito €1.900. Registra la liquidazione (giroconto su 'Erario c/IVA').",
        solution: [
          { account: "IVA a debito", section: "dare" },
          { account: "Erario c/IVA", section: "avere" },
          { account: "IVA a credito", section: "avere" }
        ],
        availableAccounts: ["IVA a debito", "IVA a credito", "Erario c/IVA", "Debiti v/fornitori", "Crediti v/clienti"],
        explanation: "Con la liquidazione chiudi IVA a debito (in Dare) e IVA a credito (in Avere). La differenza è debito verso Erario: 2.600 - 1.900 = 700 in Avere su Erario c/IVA."
      },
      {
        id: "lIVA_10",
        type: "challenge",
        difficulty: "hard",
        question: "Versamento IVA con F24: devi all’Erario c/IVA €700 (da liquidazione). Paghi tramite banca. Registra il versamento.",
        solution: [
          { account: "Erario c/IVA", section: "dare" },
          { account: "Banca c/c", section: "avere" }
        ],
        availableAccounts: ["Erario c/IVA", "Banca c/c", "IVA a debito", "IVA a credito", "Cassa"],
        explanation: "Pagando, estingui il debito verso Erario (Dare) e riduci la banca (Avere)."
      },
      {
        id: "lIVA_11",
        type: "challenge",
        difficulty: "medium",
        question: "Vendita di beni con IVA 10%: imponibile €900, IVA 10%. Cliente non paga subito (a credito). Registra la vendita.",
        solution: [
          { account: "Crediti v/clienti", section: "dare" },
          { account: "Ricavi vendite", section: "avere" },
          { account: "IVA a debito", section: "avere" }
        ],
        availableAccounts: ["Crediti v/clienti", "Ricavi vendite", "IVA a debito", "IVA a credito", "Banca c/c"],
        explanation: "Credito verso cliente per totale fattura (€990); ricavo (€900) e IVA a debito (€90) in Avere. L’aliquota cambia solo l’importo IVA."
      },
      {
        id: "lIVA_12",
        type: "challenge",
        difficulty: "medium",
        question: "In una fattura di acquisto imponibile €1.000 con IVA 22%, qual è la corretta collocazione dell’IVA nella scrittura?",
        solution: [
          { account: "IVA a credito", section: "dare" },
          { account: "Debiti v/fornitori", section: "avere" }
        ],
        availableAccounts: ["IVA a credito", "IVA a debito", "Debiti v/fornitori", "Crediti v/clienti", "Erario c/IVA"],
        explanation: "Nelle fatture d’acquisto l’IVA è detraibile: va in Dare come IVA a credito (salvo casi particolari). Il debito aumenta in Avere."
      },
      {
        id: "lIVA_13",
        type: "challenge",
        difficulty: "hard",
        question: "Reverse charge: acquisto di servizio soggetto a inversione contabile. Imponibile €1.000. Registra l’operazione (autofattura: IVA a credito e IVA a debito nello stesso momento).",
        solution: [
          { account: "Spese per servizi", section: "dare" },
          { account: "IVA a credito", section: "dare" },
          { account: "Debiti v/fornitori", section: "avere" },
          { account: "IVA a debito", section: "avere" }
        ],
        availableAccounts: ["Spese per servizi", "Debiti v/fornitori", "IVA a credito", "IVA a debito", "Crediti v/clienti"],
        explanation: "Nel reverse charge il fornitore fattura senza IVA. L’IVA viene ‘autoliquidata’: IVA a debito e, se detraibile, IVA a credito per lo stesso importo (€220)."
      },
      {
        id: "lIVA_14",
        type: "challenge",
        difficulty: "medium",
        question: "Nota di debito da fornitore per spese accessorie aggiuntive su fattura già ricevuta: imponibile €120, IVA 22%. Non pagata. Registra la nota di debito.",
        solution: [
          { account: "Spese accessorie su acquisti", section: "dare" },
          { account: "IVA a credito", section: "dare" },
          { account: "Debiti v/fornitori", section: "avere" }
        ],
        availableAccounts: ["Spese accessorie su acquisti", "IVA a credito", "Debiti v/fornitori", "IVA a debito", "Crediti v/clienti"],
        explanation: "La nota di debito aumenta costo e IVA detraibile e incrementa il debito verso fornitore per il totale."
      },
      {
        id: "lIVA_15",
        type: "challenge",
        difficulty: "hard",
        question: "Liquidazione IVA con credito: IVA a debito €1.400, IVA a credito €2.000. Registra la liquidazione (credito IVA da riportare su 'Erario c/IVA').",
        solution: [
          { account: "IVA a debito", section: "dare" },
          { account: "IVA a credito", section: "avere" },
          { account: "Erario c/IVA", section: "dare" }
        ],
        availableAccounts: ["IVA a debito", "IVA a credito", "Erario c/IVA", "Banca c/c", "Debiti v/fornitori"],
        explanation: "Qui l’IVA a credito supera l’IVA a debito: nasce un credito verso Erario. Chiudi IVA a debito in Dare, IVA a credito in Avere; la differenza (600) è Erario c/IVA in Dare."
      },
      {
        id: "lIVA_16",
        type: "challenge",
        difficulty: "medium",
        question: "Incasso di una fattura di vendita già emessa (totale €1.220) tramite banca. Registra l’incasso.",
        solution: [
          { account: "Banca c/c", section: "dare" },
          { account: "Crediti v/clienti", section: "avere" }
        ],
        availableAccounts: ["Banca c/c", "Crediti v/clienti", "Ricavi vendite", "IVA a debito", "Cassa"],
        explanation: "Incassando, trasformi il credito in disponibilità liquide: banca in Dare, crediti in Avere."
      },
      {
        id: "lIVA_17",
        type: "challenge",
        difficulty: "hard",
        question: "Storno per abbuono attivo con IVA: concedi a un cliente uno sconto post-fattura di imponibile €80 con IVA 22% tramite nota di credito. La vendita era già incassata, rimborsi via bonifico.",
        solution: [
          { account: "Resi/abbuoni su vendite", section: "dare" },
          { account: "IVA a debito", section: "dare" },
          { account: "Banca c/c", section: "avere" }
        ],
        availableAccounts: ["Resi/abbuoni su vendite", "IVA a debito", "Banca c/c", "Crediti v/clienti", "IVA a credito"],
        explanation: "La nota di credito riduce ricavi e IVA a debito. Poiché rimborsi subito, l’uscita va direttamente in banca per il totale."
      },
      {
        id: "lIVA_18",
        type: "challenge", 
        difficulty: "hard",
        question: "Nella liquidazione IVA, cosa rappresenta 'Erario c/IVA' quando il saldo è a debito?",
        solution: [
          { account: "Erario c/IVA", section: "avere" },
          { account: "IVA a credito", section: "avere" }
        ],
        availableAccounts: ["Erario c/IVA", "IVA a credito", "IVA a debito", "Debiti v/fornitori", "Ricavi vendite"],
        explanation: "Se il saldo IVA è a debito, 'Erario c/IVA' è un debito verso lo Stato: compare in Avere (saldo passivo). Chiude l'IVA a Credito."
      },
      {
        id: "lIVA_19",
        type: "challenge",
        difficulty: "medium",
        question: "Acquisto di merci con IVA 22% e successivo pagamento immediato. Registra l’acquisto a credito e il pagamento contestuale in un’unica scrittura usando direttamente la banca.",
        solution: [
          { account: "Acquisti merci", section: "dare" },
          { account: "IVA a credito", section: "dare" },
          { account: "Banca c/c", section: "avere" }
        ],
        availableAccounts: ["Acquisti merci", "IVA a credito", "Banca c/c", "Debiti v/fornitori", "IVA a debito"],
        explanation: "Se paghi subito, puoi registrare direttamente l’uscita banca senza passare per Debiti v/fornitori."
      },
      {
        id: "lIVA_20",
        type: "challenge",
        difficulty: "hard",
        question: "Rettifica IVA per indetraibilità parziale: su costi generali hai IVA a credito contabilizzata €500. A fine periodo risulta detraibile solo l’80%. Devi rettificare il 20% (€100) portandolo a costo 'IVA indetraibile'.",
        solution: [
          { account: "IVA indetraibile", section: "dare" },
          { account: "IVA a credito", section: "avere" }
        ],
        availableAccounts: ["IVA indetraibile", "IVA a credito", "IVA a debito", "Erario c/IVA", "Spese per servizi"],
        explanation: "Riduci l’IVA a credito per la quota non detraibile e la trasformi in costo (IVA indetraibile) in Dare."
      }
    ],
  
    // --- LIVELLO 5: RATEI & RISCONTI ---
    "lvl_5_ratei": [
      // --- EASY ---
      {
        id: "l5_e1",
        type: "quiz",
        difficulty: "easy",
        question: "Un Risconto Attivo riguarda...",
        options: [
          { id: "a", text: "Un costo già pagato ma di competenza futura", correct: true },
          { id: "b", text: "Un costo non ancora pagato" },
          { id: "c", text: "Un ricavo futuro" }
        ],
        explanation: "Risconto = Sospensione. Hai pagato (es. assicurazione) ma il servizio vale anche per l'anno prossimo. Sospendi il costo."
      },
      // --- MEDIUM (Calcolo Date) ---
      {
        id: "l5_m1",
        type: "quiz",
        difficulty: "medium",
        imageUrl: "https://placehold.co/600x150/e2e8f0/1e293b?text=Linea+Tempo%0A1/10/2023+-----------+31/12/2023+-----------+1/10/2024%0APremio+Assicurativo+pagato+anticipato",
        question: "Guarda la linea del tempo. Paghi un premio annuo il 01/10. Quanti mesi sono di competenza dell'anno corrente?",
        options: [
          { id: "a", text: "3 mesi (Ott, Nov, Dic)", correct: true },
          { id: "b", text: "9 mesi (Gen-Set)" },
          { id: "c", text: "12 mesi" }
        ],
        explanation: "Dal 1 ottobre al 31 dicembre sono 3 mesi. Gli altri 9 mesi sono di competenza dell'anno prossimo (e saranno il Risconto)."
      },
      // --- HARD (Scrittura Risconto) ---
      {
        id: "l5_h1",
        type: "challenge",
        difficulty: "hard",
        question: "Hai pagato 1.200€ di affitto annuale anticipato. A fine anno devi togliere la parte non di competenza (9 mesi = 900€). Registra il Risconto.",
        solution: [
          { account: "Risconti attivi", section: "dare" },
          { account: "Fitti passivi", section: "avere" }
        ],
        availableAccounts: ["Risconti attivi", "Fitti passivi", "Ratei passivi", "Banca X c/c"],
        explanation: "Togli 900€ dal costo 'Fitti passivi' mettendolo in Avere. Lo parcheggi in 'Risconti attivi' (Dare) che finirà nello Stato Patrimoniale."
      }
    ],

    // =================================================================
    // CORSO: CLOUD COMPUTING
    // =================================================================
    // NOTA: Gli esercizi per il Cloud Computing (ID: c-l01-intro, c-l02-aws, etc.)
    // NON SONO PRESENTI in questo file statico.
    // Essi vengono caricati dinamicamente da FIRESTORE tramite ExerciseArena.jsx.
    // Questa chiave è qui solo come placeholder/promemoria architetturale.
    "cloud_placeholder": []
};