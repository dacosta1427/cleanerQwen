// i18n translations for EN, NL, DE
export const translations = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Dashboard
    dashboard: 'Dashboard',
    welcome: 'Welcome to Clean Scheduler',
    totalHouses: 'Total Houses',
    totalBookings: 'Total Bookings',
    pendingJobs: 'Pending Jobs',
    invoicesThisMonth: 'Invoices This Month',
    
    // Owners
    owners: 'Owners',
    ownerName: 'Owner Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    addOwner: 'Add Owner',
    editOwner: 'Edit Owner',
    
    // Houses
    houses: 'Houses',
    houseName: 'House Name',
    houseAddress: 'Address',
    owner: 'Owner',
    costProfile: 'Cost Profile',
    allowsDogs: 'Allows Dogs',
    defaultCleaner: 'Default Cleaner',
    rooms: 'Rooms',
    squareFootage: 'Square Footage',
    notes: 'Notes',
    addHouse: 'Add House',
    editHouse: 'Edit House',
    dogsNotAllowed: 'Dogs not allowed',
    
    // Cost Profiles
    costProfiles: 'Cost Profiles',
    profileName: 'Profile Name',
    basePrice: 'Base Price (€)',
    dogSurcharge: 'Dog Surcharge (€)',
    description: 'Description',
    addProfile: 'Add Profile',
    editProfile: 'Edit Profile',
    
    // Cleaners
    cleaners: 'Cleaners',
    cleanerName: 'Cleaner Name',
    isActive: 'Is Active',
    addCleaner: 'Add Cleaner',
    editCleaner: 'Edit Cleaner',
    
    // Bookings
    bookings: 'Bookings',
    guestName: 'Guest Name',
    guestEmail: 'Guest Email',
    guestPhone: 'Guest Phone',
    checkin: 'Check-in',
    checkout: 'Check-out',
    hasDogs: 'Has Dogs',
    bookingConflict: 'Booking conflict: This house already has a booking that overlaps.',
    addBooking: 'Add Booking',
    editBooking: 'Edit Booking',
    sameTimeNotAllowed: 'Same-day transitions are allowed, but same-time checkin/checkout is not.',
    
    // Cleaning Jobs
    cleaningJobs: 'Cleaning Jobs',
    scheduledTime: 'Scheduled Time',
    status: 'Status',
    baseCost: 'Base Cost (€)',
    extraCharges: 'Extra Charges (€)',
    extraChargesDescription: 'Extra Charges Description',
    totalCost: 'Total Cost (€)',
    completedAt: 'Completed At',
    jobStatus: {
      pending: 'Pending',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    },
    cleanerConflict: 'Cleaner schedule conflict: This cleaner is already busy at this time.',
    addJob: 'Add Job',
    editJob: 'Edit Job',
    
    // Invoices
    invoices: 'Invoices',
    invoiceNumber: 'Invoice Number',
    amount: 'Amount (€)',
    generatedAt: 'Generated At',
    invoiceStatus: {
      pending: 'Pending',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue'
    },
    generateInvoice: 'Generate Invoice',
    viewPDF: 'View PDF',
    
    // Cleaner View (Mobile)
    startCleaning: 'Start Cleaning',
    finishCleaning: 'Finish Cleaning',
    jobDetails: 'Job Details',
    startTime: 'Start Time',
    endTime: 'End Time',
    dogWarning: '⚠️ Dogs present at this property!',
    cleaningStarted: 'Cleaning started!',
    cleaningFinished: 'Cleaning finished!',
    
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      owners: 'Owners',
      houses: 'Houses',
      costProfiles: 'Cost Profiles',
      cleaners: 'Cleaners',
      bookings: 'Bookings',
      cleaningJobs: 'Cleaning Jobs',
      invoices: 'Invoices',
      cleanerView: 'My Schedule'
    }
  },
  
  nl: {
    // Common
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    add: 'Toevoegen',
    close: 'Sluiten',
    confirm: 'Bevestigen',
    loading: 'Laden...',
    error: 'Fout',
    success: 'Succes',
    
    // Dashboard
    dashboard: 'Dashboard',
    welcome: 'Welkom bij Clean Scheduler',
    totalHouses: 'Totaal Huizen',
    totalBookings: 'Totaal Boekingen',
    pendingJobs: 'Openstaande Taken',
    invoicesThisMonth: 'Facturen Deze Maand',
    
    // Owners
    owners: 'Eigenaren',
    ownerName: 'Eigenaar Naam',
    email: 'E-mail',
    phone: 'Telefoon',
    address: 'Adres',
    addOwner: 'Eigenaar Toevoegen',
    editOwner: 'Eigenaar Bewerken',
    
    // Houses
    houses: 'Huizen',
    houseName: 'Huis Naam',
    houseAddress: 'Adres',
    owner: 'Eigenaar',
    costProfile: 'Kostenprofiel',
    allowsDogs: 'Honden Toegestaan',
    defaultCleaner: 'Standaard Schoonmaker',
    rooms: 'Kamers',
    squareFootage: 'Vierkante Meters',
    notes: 'Notities',
    addHouse: 'Huis Toevoegen',
    editHouse: 'Huis Bewerken',
    dogsNotAllowed: 'Honden niet toegestaan',
    
    // Cost Profiles
    costProfiles: 'Kostenprofielen',
    profileName: 'Profiel Naam',
    basePrice: 'Basisprijs (€)',
    dogSurcharge: 'Hond Toeslag (€)',
    description: 'Beschrijving',
    addProfile: 'Profiel Toevoegen',
    editProfile: 'Profiel Bewerken',
    
    // Cleaners
    cleaners: 'Schoonmakers',
    cleanerName: 'Schoonmaker Naam',
    isActive: 'Is Actief',
    addCleaner: 'Schoonmaker Toevoegen',
    editCleaner: 'Schoonmaker Bewerken',
    
    // Bookings
    bookings: 'Boekingen',
    guestName: 'Gast Naam',
    guestEmail: 'Gast E-mail',
    guestPhone: 'Gast Telefoon',
    checkin: 'Inchecken',
    checkout: 'Uitchecken',
    hasDogs: 'Heeft Honden',
    bookingConflict: 'Boeking conflict: Dit huis heeft al een overlappende boeking.',
    addBooking: 'Boeking Toevoegen',
    editBooking: 'Boeking Bewerken',
    sameTimeNotAllowed: 'Overgangen op dezelfde dag zijn toegestaan, maar hetzelfde tijdstip voor in-/uitchecken niet.',
    
    // Cleaning Jobs
    cleaningJobs: 'Schoonmaak Taken',
    scheduledTime: 'Geplande Tijd',
    status: 'Status',
    baseCost: 'Basis Kosten (€)',
    extraCharges: 'Extra Kosten (€)',
    extraChargesDescription: 'Extra Kosten Omschrijving',
    totalCost: 'Totaal Kosten (€)',
    completedAt: 'Voltooid Op',
    jobStatus: {
      pending: 'Openstaand',
      scheduled: 'Gepland',
      in_progress: 'Bezig',
      completed: 'Voltooid',
      cancelled: 'Geannuleerd'
    },
    cleanerConflict: 'Schoonmaker planning conflict: Deze schoonmaker is al bezet op dit tijdstip.',
    addJob: 'Taak Toevoegen',
    editJob: 'Taak Bewerken',
    
    // Invoices
    invoices: 'Facturen',
    invoiceNumber: 'Factuurnummer',
    amount: 'Bedrag (€)',
    generatedAt: 'Gegenereerd Op',
    invoiceStatus: {
      pending: 'Openstaand',
      sent: 'Verzonden',
      paid: 'Betaald',
      overdue: 'Achterstallig'
    },
    generateInvoice: 'Factuur Genereren',
    viewPDF: 'Bekijk PDF',
    
    // Cleaner View (Mobile)
    startCleaning: 'Start Schoonmaken',
    finishCleaning: 'Afronden Schoonmaken',
    jobDetails: 'Taak Details',
    startTime: 'Start Tijd',
    endTime: 'Eind Tijd',
    dogWarning: '⚠️ Honden aanwezig op deze locatie!',
    cleaningStarted: 'Schoonmaken gestart!',
    cleaningFinished: 'Schoonmaken voltooid!',
    
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      owners: 'Eigenaren',
      houses: 'Huizen',
      costProfiles: 'Kostenprofielen',
      cleaners: 'Schoonmakers',
      bookings: 'Boekingen',
      cleaningJobs: 'Schoonmaak Taken',
      invoices: 'Facturen',
      cleanerView: 'Mijn Planning'
    }
  },
  
  de: {
    // Common
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    close: 'Schließen',
    confirm: 'Bestätigen',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    
    // Dashboard
    dashboard: 'Dashboard',
    welcome: 'Willkommen bei Clean Scheduler',
    totalHouses: 'Gesamte Häuser',
    totalBookings: 'Gesamte Buchungen',
    pendingJobs: 'Ausstehende Aufgaben',
    invoicesThisMonth: 'Rechnungen Diesen Monat',
    
    // Owners
    owners: 'Eigentümer',
    ownerName: 'Eigentümer Name',
    email: 'E-Mail',
    phone: 'Telefon',
    address: 'Adresse',
    addOwner: 'Eigentümer Hinzufügen',
    editOwner: 'Eigentümer Bearbeiten',
    
    // Houses
    houses: 'Häuser',
    houseName: 'Haus Name',
    houseAddress: 'Adresse',
    owner: 'Eigentümer',
    costProfile: 'Kostenprofil',
    allowsDogs: 'Hunde Erlaubt',
    defaultCleaner: 'Standard Reiniger',
    rooms: 'Zimmer',
    squareFootage: 'Quadratmeter',
    notes: 'Notizen',
    addHouse: 'Haus Hinzufügen',
    editHouse: 'Haus Bearbeiten',
    dogsNotAllowed: 'Hunde nicht erlaubt',
    
    // Cost Profiles
    costProfiles: 'Kostenprofile',
    profileName: 'Profil Name',
    basePrice: 'Grundpreis (€)',
    dogSurcharge: 'Hund Aufschlag (€)',
    description: 'Beschreibung',
    addProfile: 'Profil Hinzufügen',
    editProfile: 'Profil Bearbeiten',
    
    // Cleaners
    cleaners: 'Reiniger',
    cleanerName: 'Reiniger Name',
    isActive: 'Ist Aktiv',
    addCleaner: 'Reiniger Hinzufügen',
    editCleaner: 'Reiniger Bearbeiten',
    
    // Bookings
    bookings: 'Buchungen',
    guestName: 'Gast Name',
    guestEmail: 'Gast E-Mail',
    guestPhone: 'Gast Telefon',
    checkin: 'Check-in',
    checkout: 'Check-out',
    hasDogs: 'Hat Hunde',
    bookingConflict: 'Buchungskonflikt: Dieses Haus hat bereits eine überlappende Buchung.',
    addBooking: 'Buchung Hinzufügen',
    editBooking: 'Buchung Bearbeiten',
    sameTimeNotAllowed: 'Übergänge am selben Tag sind erlaubt, aber gleiche Uhrzeit für Check-in/Check-out nicht.',
    
    // Cleaning Jobs
    cleaningJobs: 'Reinigungsaufgaben',
    scheduledTime: 'Geplante Zeit',
    status: 'Status',
    baseCost: 'Grundkosten (€)',
    extraCharges: 'Zusatzkosten (€)',
    extraChargesDescription: 'Zusatzkosten Beschreibung',
    totalCost: 'Gesamtkosten (€)',
    completedAt: 'Abgeschlossen Am',
    jobStatus: {
      pending: 'Ausstehend',
      scheduled: 'Geplant',
      in_progress: 'In Bearbeitung',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    },
    cleanerConflict: 'Reiniger Planungskonflikt: Dieser Reiniger ist zu dieser Zeit bereits beschäftigt.',
    addJob: 'Aufgabe Hinzufügen',
    editJob: 'Aufgabe Bearbeiten',
    
    // Invoices
    invoices: 'Rechnungen',
    invoiceNumber: 'Rechnungsnummer',
    amount: 'Betrag (€)',
    generatedAt: 'Erstellt Am',
    invoiceStatus: {
      pending: 'Ausstehend',
      sent: 'Gesendet',
      paid: 'Bezahlt',
      overdue: 'Überfällig'
    },
    generateInvoice: 'Rechnung Erstellen',
    viewPDF: 'PDF Anzeigen',
    
    // Cleaner View (Mobile)
    startCleaning: 'Reinigung Starten',
    finishCleaning: 'Reinigung Abschließen',
    jobDetails: 'Aufgabendetails',
    startTime: 'Startzeit',
    endTime: 'Endzeit',
    dogWarning: '⚠️ Hunde auf diesem Grundstück!',
    cleaningStarted: 'Reinigung gestartet!',
    cleaningFinished: 'Reinigung abgeschlossen!',
    
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      owners: 'Eigentümer',
      houses: 'Häuser',
      costProfiles: 'Kostenprofile',
      cleaners: 'Reiniger',
      bookings: 'Buchungen',
      cleaningJobs: 'Reinigungsaufgaben',
      invoices: 'Rechnungen',
      cleanerView: 'Mein Plan'
    }
  }
};

// Current language state
let currentLang = 'en';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('preferred_language', lang);
    window.dispatchEvent(new CustomEvent('languageChanged'));
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if path not found
    }
  }
  
  return value || key;
}

// Initialize from localStorage on module load
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('preferred_language');
  if (saved && translations[saved]) {
    currentLang = saved;
  }
}
