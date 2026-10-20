/**
 * Eldroplus Multilingual Translation Dictionary (English & Malayalam)
 * 
 * Organized by UI segments:
 * - buttons: Action and interactive buttons
 * - headings: Page titles, section headers, card titles
 * - descriptions: Subtitles, helper text, explanations, empty states
 * - navigation: Top header, bottom navbar, sidebar items
 * - tasks: Health task titles, instructions, metrics, units
 * - dashboard: Stats, streaks, live sessions, charts
 * - classes: Video tutorials, categories, player controls
 * - challenge: 30-day challenge milestones, day card statuses
 * - settings: Profile attributes, BMI, notifications, preferences
 * - auth: Sign in, phone input, password, brand values
 * - admin: Directory, batches, packages, telecallers, tickets
 * - alerts: Success toasts, error banners, confirm dialogs
 * 
 * Review and adjust any Malayalam phrasing before toggling the language option.
 */

export const translations = {
  // ==========================================
  // 1. BUTTONS & ACTIONS
  // ==========================================
  buttons: {
    save: {
      en: "Save",
      ml: "സേവ് ചെയ്യുക",
      context: "Generic save action"
    },
    saveChanges: {
      en: "Save Changes",
      ml: "മാറ്റങ്ങൾ സേവ് ചെയ്യുക",
      context: "Form submit to update settings or profile"
    },
    cancel: {
      en: "Cancel",
      ml: "റദ്ദാക്കുക",
      context: "Modal dismiss or form cancel"
    },
    delete: {
      en: "Delete",
      ml: "ഡിലീറ്റ് ചെയ്യുക",
      context: "Danger delete action"
    },
    deleteSelected: {
      en: "Delete Selected",
      ml: "തിരഞ്ഞെടുത്തവ ഡിലീറ്റ് ചെയ്യുക",
      context: "Bulk delete action button"
    },
    deleteCustomer: {
      en: "Delete Customer",
      ml: "ഉപഭോക്താവിനെ ഡിലീറ്റ് ചെയ്യുക",
      context: "Delete single customer profile"
    },
    deleteBatch: {
      en: "Delete Batch",
      ml: "ബാച്ച് ഡിലീറ്റ് ചെയ്യുക",
      context: "Delete wellness batch"
    },
    edit: {
      en: "Edit",
      ml: "എഡിറ്റ് ചെയ്യുക",
      context: "Open edit mode"
    },
    editProfile: {
      en: "Edit Profile",
      ml: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
      context: "Edit customer profile details"
    },
    submit: {
      en: "Submit",
      ml: "സമർപ്പിക്കുക",
      context: "Form submission"
    },
    close: {
      en: "Close",
      ml: "അടയ്ക്കുക",
      context: "Close modal or alert"
    },
    back: {
      en: "Back",
      ml: "പുറകോട്ട്",
      context: "Navigate back"
    },
    next: {
      en: "Next",
      ml: "അടുത്തത്",
      context: "Pagination or carousel step forward"
    },
    previous: {
      en: "Previous",
      ml: "മുമ്പത്തേത്",
      context: "Carousel step backward"
    },
    continue: {
      en: "Continue",
      ml: "തുടരുക",
      context: "Resume or continue step"
    },
    done: {
      en: "Done",
      ml: "പൂർത്തിയായി",
      context: "Completion button"
    },
    clear: {
      en: "Clear",
      ml: "മായ്‌ക്കുക",
      context: "Clear search, filter, or selection"
    },
    search: {
      en: "Search",
      ml: "തിരയുക",
      context: "Search action"
    },
    filter: {
      en: "Filter",
      ml: "ഫിൽട്ടർ ചെയ്യുക",
      context: "Filter table or list"
    },
    refresh: {
      en: "Refresh",
      ml: "പുതുക്കുക",
      context: "Reload data from server"
    },
    retry: {
      en: "Retry",
      ml: "വീണ്ടും ശ്രമിക്കുക",
      context: "Retry after an error"
    },
    signIn: {
      en: "Sign In",
      ml: "ലോഗിൻ ചെയ്യുക",
      context: "Login button"
    },
    signOut: {
      en: "Sign Out",
      ml: "ലോഗ് ഔട്ട് ചെയ്യുക",
      context: "Logout button"
    },
    logActivity: {
      en: "Log Activity",
      ml: "രേഖപ്പെടുത്തുക",
      context: "Record task progress"
    },
    markCompleted: {
      en: "Mark as Completed",
      ml: "പൂർത്തിയായതായി അടയാളപ്പെടുത്തുക",
      context: "Quick toggle to complete task"
    },
    viewMembers: {
      en: "View Members",
      ml: "അംഗങ്ങളെ കാണുക",
      context: "View batch roster members"
    },
    viewDetails: {
      en: "View Details",
      ml: "വിശദാംശങ്ങൾ കാണുക",
      context: "Inspect item details"
    },
    backToDirectory: {
      en: "Back to Directory",
      ml: "ഡയറക്ടറിയിലേക്ക് മടങ്ങുക",
      context: "Return to customers directory"
    },
    joinLiveSession: {
      en: "Join Live Session",
      ml: "ലൈവ് ക്ലാസിൽ ചേരുക",
      context: "Open Google Meet / Zoom session"
    },
    watchVideo: {
      en: "Watch Video",
      ml: "വീഡിയോ കാണുക",
      context: "Play tutorial video"
    },
    installApp: {
      en: "Install App",
      ml: "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക",
      context: "PWA install prompt"
    },
    enableNotifications: {
      en: "Enable Notifications",
      ml: "നോട്ടിഫിക്കേഷനുകൾ പ്രവർത്തനക്ഷമമാക്കുക",
      context: "Request push notification permission"
    },
    createBatch: {
      en: "Create New Batch",
      ml: "പുതിയ ബാച്ച് നിർമ്മിക്കുക",
      context: "Admin button to add a new challenge batch"
    },
    createCustomer: {
      en: "Register Customer",
      ml: "പുതിയ ഉപഭോക്താവിനെ ചേർക്കുക",
      context: "Admin button to onboard a customer"
    }
  },

  // ==========================================
  // 2. HEADINGS & TITLES
  // ==========================================
  headings: {
    appTitle: {
      en: "Eldroplus",
      ml: "എൽഡ്രോപ്ലസ്",
      context: "App brand name"
    },
    dashboard: {
      en: "Dashboard",
      ml: "ഡാഷ്‌ബോർഡ്",
      context: "Main client home screen"
    },
    dailyTasks: {
      en: "Daily Tasks",
      ml: "പ്രതിദിന ദിനചര്യകൾ",
      context: "Tasks screen title"
    },
    wellnessClasses: {
      en: "Wellness Classes",
      ml: "വെൽനസ് ക്ലാസുകൾ",
      context: "Recorded tutorial videos title"
    },
    thirtyDayChallenge: {
      en: "30-Day Wellness Challenge",
      ml: "30 ദിവസത്തെ വെൽനസ് ചലഞ്ച്",
      context: "Challenge grid title"
    },
    settings: {
      en: "Settings",
      ml: "ക്രമീകരണങ്ങൾ",
      context: "Account and app settings page"
    },
    todayTasks: {
      en: "Today's Tasks",
      ml: "ഇന്നത്തെ ടാസ്കുകൾ",
      context: "Dashboard today tasks section"
    },
    liveSession: {
      en: "Daily Live Session",
      ml: "ദൈനംദിന ലൈവ് ക്ലാസ്",
      context: "Live meeting card header"
    },
    streakCard: {
      en: "Consistency Streak",
      ml: "തുടർച്ചയായ ദിനചര്യകൾ (സ്ട്രീക്ക്)",
      context: "Streak tracker header"
    },
    overallProgress: {
      en: "Overall Progress",
      ml: "ആകെ പുരോഗതി",
      context: "Summary progress header"
    },
    previousDaySummary: {
      en: "Previous Day Summary",
      ml: "കഴിഞ്ഞ ദിവസത്തെ വിവരങ്ങൾ",
      context: "Yesterday's log summary banner"
    },
    profileDetails: {
      en: "Profile & Health Details",
      ml: "പ്രൊഫൈലും ആരോഗ്യ വിവരങ്ങളും",
      context: "User vitals and personal info section"
    },
    bmiAssessment: {
      en: "Body Mass Index (BMI)",
      ml: "ബോഡി മാസ്സ് ഇൻഡക്സ് (BMI)",
      context: "BMI calculation card"
    },
    batchRoster: {
      en: "Batch Members Roster",
      ml: "ബാച്ച് അംഗങ്ങളുടെ പട്ടിക",
      context: "Roster modal header"
    },
    directory: {
      en: "Customers Directory",
      ml: "ഉപഭോക്താക്കളുടെ വിവരപ്പട്ടിക",
      context: "Admin CRM customer list"
    },
    batchesManagement: {
      en: "Batches Management",
      ml: "ബാച്ചുകളുടെ മേൽനോട്ടം",
      context: "Admin batch management tab"
    },
    packagesManagement: {
      en: "Packages Management",
      ml: "പാക്കേജുകളുടെ മേൽനോട്ടം",
      context: "Admin packages tab"
    },
    loginTitle: {
      en: "Welcome Back",
      ml: "വീണ്ടും സ്വാഗതം",
      context: "Login card main heading"
    },
    loginSubtitle: {
      en: "Sign in to access your daily wellness plan",
      ml: "നിങ്ങളുടെ ദൈനംദിന വെൽനസ് പ്ലാനിലേക്ക് പ്രവേശിക്കുക",
      context: "Login card sub-header"
    }
  },

  // ==========================================
  // 3. DESCRIPTIONS & SUBTITLES
  // ==========================================
  descriptions: {
    dashboardSubtitle: {
      en: "Track your wellness journey, maintain healthy habits, and stay fit every day.",
      ml: "നിങ്ങളുടെ ആരോഗ്യ യാത്ര വിലയിരുത്തുക, നല്ല ശീലങ്ങൾ വളർത്തുക, എല്ലാ ദിവസവും ഉന്മേഷത്തോടെയിരിക്കുക.",
      context: "Dashboard top banner text"
    },
    dailyTasksSubtitle: {
      en: "Complete your assigned wellness tasks to build consistency and unlock future days.",
      ml: "സ്ഥിരത നിലനിർത്താനും വരും ദിവസങ്ങളിലേക്ക് മുന്നേറാനും ഇന്നത്തെ ടാസ്കുകൾ പൂർത്തിയാക്കുക.",
      context: "Daily tasks carousel subtitle"
    },
    classesSubtitle: {
      en: "Watch guided exercise, yoga, stretching, and nutrition sessions tailored for healthy aging.",
      ml: "മുതിർന്നവരുടെ ആരോഗ്യത്തിനായി വിദഗ്ദ്ധർ നയിക്കുന്ന യോഗ, വ്യായാമം, ഭക്ഷണക്രമ ക്ലാസുകൾ കാണുക.",
      context: "Class page subtitle"
    },
    challengeSubtitle: {
      en: "Complete daily tasks sequentially across 30 days to build long-term wellness habits.",
      ml: "30 ദിവസം കൊണ്ട് ആരോഗ്യകരമായ ശീലങ്ങൾ ക്രമമായി വളർത്തിയെടുക്കുക.",
      context: "Challenge grid subtitle"
    },
    liveSessionActive: {
      en: "Today's live interactive session is happening right now! Tap below to join.",
      ml: "ഇന്നത്തെ തത്സമയ ക്ലാസ് ഇപ്പോൾ നടക്കുന്നുണ്ട്! ക്ലാസിൽ ചേരാൻ താഴെ അമർത്തുക.",
      context: "Live session is ongoing"
    },
    liveSessionUpcoming: {
      en: "Today's live interactive session will start at the scheduled time.",
      ml: "ഇന്നത്തെ തത്സമയ ക്ലാസ് നിശ്ചിത സമയത്ത് ആരംഭിക്കുന്നതാണ്.",
      context: "Live session is later today"
    },
    liveSessionFinished: {
      en: "Today's live session has concluded. Check back tomorrow for the next session.",
      ml: "ഇന്നത്തെ ലൈവ് ക്ലാസ് കഴിഞ്ഞിരിക്കുന്നു. അടുത്ത ക്ലാസിനായി നാളെ വീണ്ടും നോക്കുക.",
      context: "Live session finished for the day"
    },
    liveSessionNoBatch: {
      en: "You are not assigned to an active challenge batch. Contact support to join a live batch.",
      ml: "നിങ്ങൾ ഇപ്പോൾ ഒരു ബാച്ചിലും ചേർന്നിട്ടില്ല. ലൈവ് ക്ലാസുകളിൽ പങ്കെടുക്കാൻ സപ്പോർട്ടുമായി ബന്ധപ്പെടുക.",
      context: "No batch assigned to user"
    },
    sleepLockNotice: {
      en: "Complete your previous day's Sleep Task to unlock today's tasks.",
      ml: "ഇന്നത്തെ ടാസ്കുകൾ ആരംഭിക്കാൻ കഴിഞ്ഞ ദിവസത്തെ ഉറക്കം (Sleep Task) രേഖപ്പെടുത്തുക.",
      context: "Lock notice when prior sleep is missing"
    },
    dayLockedNotice: {
      en: "This day is locked and will automatically unlock on its scheduled date.",
      ml: "ഈ ദിവസം ലോക്ക് ചെയ്തിരിക്കുന്നു. നിശ്ചിത തീയതിയിൽ ഇത് സ്വയം അൺലോക്കാവുന്നതാണ്.",
      context: "Future day locked notice"
    },
    emptyTasks: {
      en: "No tasks configured for this day.",
      ml: "ഈ ദിവസത്തേക്ക് ടാസ്കുകൾ ഒന്നും നിശ്ചയിച്ചിട്ടില്ല.",
      context: "Empty state for tasks"
    },
    emptyVideos: {
      en: "No training videos found for the selected category.",
      ml: "ഈ വിഭാഗത്തിൽ ക്ലാസ് വീഡിയോകൾ ലഭ്യമല്ല.",
      context: "Empty state for classes"
    },
    emptyCustomers: {
      en: "No customers match your search filters.",
      ml: "തിരയലിന് അനുയോജ്യമായ ഉപഭോക്താക്കളെ കണ്ടെത്തിയില്ല.",
      context: "Empty state in customer directory"
    },
    emptyBatches: {
      en: "No wellness batches configured yet. Tap \"Create New Batch\" to add one.",
      ml: "ബാച്ചുകൾ ഒന്നും തയ്യാറാക്കിയിട്ടില്ല. ചേർക്കാൻ \"പുതിയ ബാച്ച് നിർമ്മിക്കുക\" അമർത്തുക.",
      context: "Empty state in batch management"
    },
    installAppDesc: {
      en: "Install Eldroplus on your phone home screen for instant one-tap access and reminder notifications.",
      ml: "ഒരു ടാപ്പിൽ ആപ്പ് തുറക്കാനും ഓർമ്മപ്പെടുത്തലുകൾ ലഭിക്കാനും ഫോണിലേക്ക് ഇൻസ്റ്റാൾ ചെയ്യുക.",
      context: "PWA install banner description"
    }
  },

  // ==========================================
  // 4. NAVIGATION & TABS
  // ==========================================
  navigation: {
    navHome: {
      en: "Home",
      ml: "ഹോം",
      context: "Bottom nav: Home / Dashboard"
    },
    navTasks: {
      en: "Tasks",
      ml: "ടാസ്കുകൾ",
      context: "Bottom nav: Daily tasks"
    },
    navClass: {
      en: "Classes",
      ml: "ക്ലാസുകൾ",
      context: "Bottom nav: Video tutorials"
    },
    navChallenge: {
      en: "Challenge",
      ml: "ചലഞ്ച്",
      context: "Bottom nav: 30-day challenge grid"
    },
    navSettings: {
      en: "Settings",
      ml: "ക്രമീകരണങ്ങൾ",
      context: "Bottom nav: User settings"
    },
    adminPanel: {
      en: "Admin Control Panel",
      ml: "അഡ്മിൻ കൺട്രോൾ പാനൽ",
      context: "Admin sidebar heading"
    },
    customersDirectory: {
      en: "Customers Directory",
      ml: "ഉപഭോക്താക്കൾ",
      context: "Admin sidebar: Customers"
    },
    customerOnboarding: {
      en: "Customer Onboarding",
      ml: "രജിസ്ട്രേഷൻ",
      context: "Admin sidebar: Onboarding"
    },
    batchesManagement: {
      en: "Batches Management",
      ml: "ബാച്ച് മാനേജ്‌മെന്റ്",
      context: "Admin sidebar: Batches"
    },
    liveMeetings: {
      en: "Live Meetings",
      ml: "ലൈവ് മീറ്റിംഗുകൾ",
      context: "Admin sidebar: Meetings"
    },
    packages: {
      en: "Packages Management",
      ml: "പാക്കേജുകൾ",
      context: "Admin sidebar: Packages"
    },
    salesReps: {
      en: "Sales Reps (Telecallers)",
      ml: "ടെലികോളർമാർ",
      context: "Admin sidebar: Telecallers"
    },
    pipelines: {
      en: "CRM Pipelines",
      ml: "പൈപ്പ്‌ലൈൻ",
      context: "Admin sidebar: Pipelines"
    },
    enquiryTickets: {
      en: "Enquiry Tickets",
      ml: "അന്വേഷണ ടിക്കറ്റുകൾ",
      context: "Admin sidebar: Tickets"
    },
    recordedVideos: {
      en: "Recorded Videos",
      ml: "റെക്കോർഡ് ചെയ്ത വീഡിയോകൾ",
      context: "Admin sidebar: Recorded videos"
    },
    pushNotifications: {
      en: "Push Notifications",
      ml: "പുഷ് നോട്ടിഫിക്കേഷനുകൾ",
      context: "Admin sidebar: Push notifications"
    }
  },

  // ==========================================
  // 5. HEALTH TASKS & MEASURES
  // ==========================================
  tasks: {
    yogaName: {
      en: "Yoga & Fitness",
      ml: "യോഗയും ഫിറ്റ്‌നസും",
      context: "Yoga task title"
    },
    yogaDesc: {
      en: "Complete light stretching, mobility exercises, or gentle yoga as guided.",
      ml: "നിർദ്ദേശിച്ച പ്രകാരം ലഘുവായ വ്യായാമങ്ങളും യോഗയും ചെയ്യുക.",
      context: "Yoga task description"
    },
    meditationName: {
      en: "Meditation & Breathing",
      ml: "ധ്യാനവും ശ്വസന വ്യായാമവും",
      context: "Meditation task title"
    },
    meditationDesc: {
      en: "Practice calm breathing and mindfulness to reduce stress and improve mental clarity.",
      ml: "മനസ്സിന് ശാന്തതയും ഉന്മേഷവും ലഭിക്കാൻ ശ്വസന വ്യായാമങ്ങളും ധ്യാനവും ചെയ്യുക.",
      context: "Meditation task description"
    },
    waterName: {
      en: "Water Intake",
      ml: "വെള്ളം കുടിക്കൽ",
      context: "Water task title"
    },
    waterDesc: {
      en: "Stay properly hydrated throughout the day by drinking sufficient water.",
      ml: "ശരീരത്തിന് ആവശ്യമായ ശുദ്ധജലം കൃത്യമായി കുടിച്ച് ജലാംശം നിലനിർത്തുക.",
      context: "Water task description"
    },
    proteinName: {
      en: "Protein Nutrition",
      ml: "പ്രോട്ടീൻ പോഷകാഹാരം",
      context: "Protein task title"
    },
    proteinDesc: {
      en: "Ensure adequate protein in your meals for muscle strength and vitality.",
      ml: "പേശികളുടെ ആരോഗ്യത്തിനും ഊർജ്ജത്തിനും ആവശ്യമായ പ്രോട്ടീൻ ആഹാരത്തിൽ ഉൾപ്പെടുത്തുക.",
      context: "Protein task description"
    },
    sleepName: {
      en: "Restful Sleep",
      ml: "സുഖകരമായ ഉറക്കം",
      context: "Sleep task title"
    },
    sleepDesc: {
      en: "Record your hours of restful, undisturbed sleep from the previous night.",
      ml: "കഴിഞ്ഞ രാത്രിയിലെ സുഖകരമായ ഉറക്ക സമയം രേഖപ്പെടുത്തുക.",
      context: "Sleep task description"
    },
    // Metrics & Units
    unitMinutes: {
      en: "minutes",
      ml: "മിനിറ്റ്",
      context: "Duration unit"
    },
    unitMinShort: {
      en: "min",
      ml: "മിനിറ്റ്",
      context: "Duration unit abbreviation"
    },
    unitHours: {
      en: "hours",
      ml: "മണിക്കൂർ",
      context: "Sleep duration unit"
    },
    unitHrsShort: {
      en: "hrs",
      ml: "മണി.",
      context: "Sleep unit abbreviation"
    },
    unitMilliliters: {
      en: "ml",
      ml: "മില്ലിലിറ്റർ",
      context: "Volume unit"
    },
    unitGlasses: {
      en: "glasses",
      ml: "ഗ്ലാസ്",
      context: "Water glasses unit"
    },
    unitGrams: {
      en: "grams",
      ml: "ഗ്രാം",
      context: "Protein weight unit"
    },
    unitGShort: {
      en: "g",
      ml: "ഗ്രാം",
      context: "Grams abbreviation"
    },
    target: {
      en: "Target",
      ml: "ലക്ഷ്യം",
      context: "Goal value"
    },
    completedAmount: {
      en: "Logged",
      ml: "രേഖപ്പെടുത്തിയത്",
      context: "Amount logged so far"
    },
    dailyTarget: {
      en: "Daily Target",
      ml: "പ്രതിദിന ലക്ഷ്യം",
      context: "Target metric for task"
    },
    enterMeasure: {
      en: "Enter Measure",
      ml: "അളവ് രേഖപ്പെടുത്തുക",
      context: "Measure modal input prompt"
    },
    quickAdd: {
      en: "Quick Add",
      ml: "വേഗത്തിൽ ചേർക്കുക",
      context: "Quick add buttons (e.g. +250ml)"
    }
  },

  // ==========================================
  // 6. STATUSES & BADGES
  // ==========================================
  statuses: {
    completed: {
      en: "Completed",
      ml: "പൂർത്തിയായി",
      context: "Task / Day status completed"
    },
    inProgress: {
      en: "In Progress",
      ml: "പുരോഗമിക്കുന്നു",
      context: "Task started but not finished"
    },
    pending: {
      en: "Pending",
      ml: "ബാക്കിയുണ്ട്",
      context: "Task not yet completed"
    },
    locked: {
      en: "Locked",
      ml: "ലോക്ക് ചെയ്‌തു",
      context: "Day / Task locked"
    },
    unlocked: {
      en: "Unlocked",
      ml: "തുറന്നു",
      context: "Available for user"
    },
    active: {
      en: "Active",
      ml: "സജീവം",
      context: "Active batch or session"
    },
    upcoming: {
      en: "Upcoming",
      ml: "വരാനിരിക്കുന്നത്",
      context: "Future scheduled batch or class"
    },
    missed: {
      en: "Missed",
      ml: "വിട്ടുപോയി",
      context: "Past incomplete day"
    },
    partial: {
      en: "Partially Done",
      ml: "ഭാഗികമായി പൂർത്തിയായി",
      context: "Some tasks finished for the day"
    },
    today: {
      en: "Today",
      ml: "ഇന്ന്",
      context: "Current active day"
    },
    safeToDelete: {
      en: "0 customers · Eligible for deletion",
      ml: "0 ഉപഭോക്താക്കൾ · ഡിലീറ്റ് ചെയ്യാൻ സാധിക്കും",
      context: "Empty batch badge"
    },
    cannotDelete: {
      en: "Has customers · Cannot be deleted",
      ml: "ഉപഭോക്താക്കൾ ഉണ്ട് · ഡിലീറ്റ് ചെയ്യാനാവില്ല",
      context: "Occupied batch badge"
    }
  },

  // ==========================================
  // 7. DASHBOARD & STATS
  // ==========================================
  dashboard: {
    welcomeBack: {
      en: "Welcome Back",
      ml: "സ്വാഗതം",
      context: "Greeting on dashboard"
    },
    currentDay: {
      en: "Day {day} of 30",
      ml: "30-ൽ {day}-ാം ദിവസം",
      context: "Challenge day badge"
    },
    currentStreak: {
      en: "Current Streak",
      ml: "നിലവിലെ സ്ട്രീക്ക്",
      context: "Current consecutive completed days"
    },
    bestStreak: {
      en: "Best Streak",
      ml: "മികച്ച സ്ട്രീക്ക്",
      context: "Highest consecutive completed days"
    },
    daysStreak: {
      en: "{days} Days",
      ml: "{days} ദിവസങ്ങൾ",
      context: "Streak count display"
    },
    totalDaysCompleted: {
      en: "Days Completed",
      ml: "പൂർത്തിയാക്കിയ ദിവസങ്ങൾ",
      context: "Count of completed days"
    },
    dailyCompliance: {
      en: "Task Compliance",
      ml: "പൂർത്തീകരണ നിരക്ക്",
      context: "Percentage of tasks completed"
    },
    weeklyTrend: {
      en: "Weekly Activity Trend",
      ml: "ആഴ്ചയിലെ പ്രവർത്തന പുരോഗതി",
      context: "Activity chart title"
    },
    joinLivePrompt: {
      en: "Join your batch members for today's guided session.",
      ml: "ഇന്നത്തെ ലൈവ് ക്ലാസിൽ ബാച്ച് അംഗങ്ങളോടൊപ്പം പങ്കെടുക്കുക.",
      context: "Live session prompt"
    },
    instructor: {
      en: "Instructor",
      ml: "പരിശീലകൻ",
      context: "Trainer name label"
    },
    meetingTime: {
      en: "Meeting Time",
      ml: "സമയം",
      context: "Scheduled meeting time"
    }
  },

  // ==========================================
  // 8. CLASSES & TUTORIALS
  // ==========================================
  classes: {
    allCategories: {
      en: "All Categories",
      ml: "എല്ലാ വിഭാഗങ്ങളും",
      context: "Category filter default"
    },
    searchPlaceholder: {
      en: "Search classes by title or topic...",
      ml: "ക്ലാസുകൾ പേരോ വിഷയമോ ഉപയോഗിച്ച് തിരയുക...",
      context: "Search input placeholder"
    },
    duration: {
      en: "Duration",
      ml: "ദൈർഘ്യം",
      context: "Video duration label"
    },
    instructorName: {
      en: "Instructor",
      ml: "പരിശീലകൻ",
      context: "Trainer label"
    },
    noVideosFound: {
      en: "No classes match your search query.",
      ml: "നിങ്ങൾ തിരഞ്ഞ ക്ലാസുകൾ ലഭ്യമല്ല.",
      context: "Empty search results in classes"
    },
    watchAgain: {
      en: "Watch Again",
      ml: "വീണ്ടും കാണുക",
      context: "Replay video"
    }
  },

  // ==========================================
  // 9. PROFILE & SETTINGS
  // ==========================================
  settings: {
    personalInfo: {
      en: "Personal Information",
      ml: "വ്യക്തിഗത വിവരങ്ങൾ",
      context: "Personal info section"
    },
    fullName: {
      en: "Full Name",
      ml: "പൂർണ്ണ പേര്",
      context: "Name input label"
    },
    phoneNumber: {
      en: "Phone Number",
      ml: "ഫോൺ നമ്പർ",
      context: "Phone label"
    },
    age: {
      en: "Age",
      ml: "പ്രായം",
      context: "Age label"
    },
    gender: {
      en: "Gender",
      ml: "ലിംഗഭേദം",
      context: "Gender label"
    },
    male: {
      en: "Male",
      ml: "പുരുഷൻ",
      context: "Gender option"
    },
    female: {
      en: "Female",
      ml: "സ്ത്രീ",
      context: "Gender option"
    },
    other: {
      en: "Other",
      ml: "മറ്റുള്ളവ",
      context: "Gender option"
    },
    height: {
      en: "Height (cm)",
      ml: "ഉയരം (സെ.മീ)",
      context: "Height input label"
    },
    weight: {
      en: "Weight (kg)",
      ml: "തൂക്കം (കി.ഗ്രാം)",
      context: "Weight input label"
    },
    packageAssigned: {
      en: "Wellness Package",
      ml: "വെൽനസ് പാക്കേജ്",
      context: "Package label"
    },
    batchAssigned: {
      en: "Challenge Batch",
      ml: "ചലഞ്ച് ബാച്ച്",
      context: "Batch label"
    },
    startDate: {
      en: "Challenge Start Date",
      ml: "ആരംഭ തീയതി",
      context: "Start date label"
    },
    bmiStatus: {
      en: "BMI Status",
      ml: "ബി.എം.ഐ നില",
      context: "BMI status tag"
    },
    underweight: {
      en: "Underweight",
      ml: "കുറഞ്ഞ തൂക്കം",
      context: "BMI category"
    },
    normalWeight: {
      en: "Healthy Weight",
      ml: "ആരോഗ്യകരമായ തൂക്കം",
      context: "BMI category"
    },
    overweight: {
      en: "Overweight",
      ml: "കൂടിയ തൂക്കം",
      context: "BMI category"
    },
    obese: {
      en: "Obese",
      ml: "അമിതഭാരം (Obese)",
      context: "BMI category"
    },
    notificationSettings: {
      en: "Notification Preferences",
      ml: "നോട്ടിഫിക്കേഷൻ ക്രമീകരണങ്ങൾ",
      context: "Notification preferences title"
    },
    pushAlerts: {
      en: "Daily Task Reminders",
      ml: "ദൈനംദിന ടാസ്ക് ഓർമ്മപ്പെടുത്തലുകൾ",
      context: "Push notification toggle label"
    },
    appLanguage: {
      en: "App Language",
      ml: "ആപ്പ് ഭാഷ",
      context: "Language selector label"
    },
    version: {
      en: "App Version",
      ml: "ആപ്പ് വേർഷൻ",
      context: "Software version label"
    }
  },

  // ==========================================
  // 10. AUTH & LOGIN
  // ==========================================
  auth: {
    welcomeHeader: {
      en: "Elderly Wellness Simplified",
      ml: "മുതിർന്നവരുടെ ആരോഗ്യം എളുപ്പത്തിൽ",
      context: "Login splash tagline"
    },
    phoneLabel: {
      en: "Phone Number",
      ml: "ഫോൺ നമ്പർ",
      context: "Phone input label"
    },
    phonePlaceholder: {
      en: "Enter 10-digit mobile number",
      ml: "10 അക്ക മൊബൈൽ നമ്പർ നൽകുക",
      context: "Phone input placeholder"
    },
    passwordLabel: {
      en: "Password",
      ml: "പാസ്‌വേഡ്",
      context: "Password input label"
    },
    passwordPlaceholder: {
      en: "Enter your password",
      ml: "നിങ്ങളുടെ പാസ്‌വേഡ് നൽകുക",
      context: "Password input placeholder"
    },
    forgotPassword: {
      en: "Forgot Password?",
      ml: "പാസ്‌വേഡ് മറന്നുപോയോ?",
      context: "Password recovery link"
    },
    loggingIn: {
      en: "Signing in...",
      ml: "പ്രവേശിക്കുന്നു...",
      context: "Login button loading state"
    },
    contactSupport: {
      en: "Need assistance? Contact Eldroplus Care Support",
      ml: "സഹായം ആവശ്യമുണ്ടോ? എൽഡ്രോപ്ലസ് കെയർ സപ്പോർട്ടുമായി ബന്ധപ്പെടുക",
      context: "Login support link"
    }
  },

  // ==========================================
  // 11. ADMIN CRM & DIRECTORY
  // ==========================================
  admin: {
    totalCustomers: {
      en: "Total Customers",
      ml: "ആകെ ഉപഭോക്താക്കൾ",
      context: "Stat card total customers"
    },
    activeBatches: {
      en: "Active Batches",
      ml: "സജീവ ബാച്ചുകൾ",
      context: "Stat card active batches"
    },
    totalBatches: {
      en: "Total Batches",
      ml: "ആകെ ബാച്ചുകൾ",
      context: "Stat card total batches"
    },
    totalEnrolled: {
      en: "Total Enrolled",
      ml: "രജിസ്റ്റർ ചെയ്തവർ",
      context: "Total enrolled members"
    },
    searchCustomerPlaceholder: {
      en: "Search by name or phone number...",
      ml: "പേരോ ഫോൺ നമ്പറോ ഉപയോഗിച്ച് തിരയുക...",
      context: "Directory search placeholder"
    },
    allBatches: {
      en: "All Batches",
      ml: "എല്ലാ ബാച്ചുകളും",
      context: "Batch filter default"
    },
    matchCount: {
      en: "{count} match(es)",
      ml: "{count} ഫലങ്ങൾ",
      context: "Search matches badge"
    },
    selectedCount: {
      en: "{count} selected",
      ml: "{count} എണ്ണം തിരഞ്ഞെടുത്തു",
      context: "Bulk selection counter"
    },
    columnName: {
      en: "Name",
      ml: "പേര്",
      context: "Table header: Name"
    },
    columnPhone: {
      en: "Phone",
      ml: "ഫോൺ",
      context: "Table header: Phone"
    },
    columnPackage: {
      en: "Package",
      ml: "പാക്കേജ്",
      context: "Table header: Package"
    },
    columnBatch: {
      en: "Batch",
      ml: "ബാച്ച്",
      context: "Table header: Batch"
    },
    columnTelecaller: {
      en: "Telecaller",
      ml: "ടെലികോളർ",
      context: "Table header: Telecaller"
    },
    columnCreatedDate: {
      en: "Created Date",
      ml: "ചേർത്ത തീയതി",
      context: "Table header: Created Date"
    },
    columnActions: {
      en: "Actions",
      ml: "നടപടികൾ",
      context: "Table header: Actions"
    },
    batchNameLabel: {
      en: "Batch Name *",
      ml: "ബാച്ചിന്റെ പേര് *",
      context: "Batch modal name input"
    },
    batchStartDateLabel: {
      en: "Challenge Start Date *",
      ml: "ആരംഭ തീയതി *",
      context: "Batch modal start date input"
    }
  },

  // ==========================================
  // 12. ALERTS, MODALS & CONFIRMATIONS
  // ==========================================
  alerts: {
    success: {
      en: "Success!",
      ml: "വിജയം!",
      context: "General success title"
    },
    error: {
      en: "Error",
      ml: "പിഴവ്",
      context: "General error title"
    },
    changesSaved: {
      en: "Changes saved successfully!",
      ml: "മാറ്റങ്ങൾ വിജയകരമായി സേവ് ചെയ്‌തു!",
      context: "Success notification"
    },
    taskLoggedSuccess: {
      en: "Task logged successfully! Keep going!",
      ml: "ടാസ്ക് വിജയകരമായി രേഖപ്പെടുത്തി! തുടരുക!",
      context: "Task completed toast"
    },
    // Customer Delete Confirmation
    deleteCustomerModalTitle: {
      en: "Delete Customer",
      ml: "ഉപഭോക്താവിനെ ഡിലീറ്റ് ചെയ്യുക",
      context: "Modal title"
    },
    bulkDeleteModalTitle: {
      en: "Bulk Delete Customers",
      ml: "ഉപഭോക്താക്കളെ ഒരുമിച്ച് ഡിലീറ്റ് ചെയ്യുക",
      context: "Bulk delete modal title"
    },
    deleteCustomerPrompt: {
      en: "Are you sure you want to permanently delete customer \"{name}\"? Their account, challenge history, and all logged tasks will be permanently removed.",
      ml: "\"{name}\" എന്ന ഉപഭോക്താവിനെ സ്ഥിരമായി ഡിലീറ്റ് ചെയ്യണമെന്ന് ഉറപ്പാണോ? ഇവരുടെ അക്കൗണ്ടും എല്ലാ ടാസ്ക് വിവരങ്ങളും എന്നെന്നേക്കുമായി നീക്കം ചെയ്യപ്പെടും.",
      context: "Single customer delete warning"
    },
    bulkDeleteCustomerPrompt: {
      en: "Are you sure you want to permanently delete {count} selected customer(s)? Their accounts, challenge history, and all logged tasks will be permanently removed.",
      ml: "തിരഞ്ഞെടുത്ത {count} ഉപഭോക്താക്കളെ സ്ഥിരമായി ഡിലീറ്റ് ചെയ്യണമെന്ന് ഉറപ്പാണോ? ഇവരുടെ അക്കൗണ്ടുകളും രേഖപ്പെടുത്തിയ വിവരങ്ങളും എന്നെന്നേക്കുമായി നീക്കം ചെയ്യപ്പെടും.",
      context: "Bulk customer delete warning"
    },
    customerDeletedSuccess: {
      en: "Customer deleted successfully.",
      ml: "ഉപഭോക്താവിനെ വിജയകരമായി ഡിലീറ്റ് ചെയ്‌തു.",
      context: "Single customer deleted toast"
    },
    bulkCustomersDeletedSuccess: {
      en: "Successfully deleted {count} customer(s).",
      ml: "{count} ഉപഭോക്താക്കളെ വിജയകരമായി ഡിലീറ്റ് ചെയ്‌തു.",
      context: "Bulk customer deleted toast"
    },
    // Batch Delete Confirmation & Condition
    deleteBatchModalTitle: {
      en: "Delete Batch",
      ml: "ബാച്ച് ഡിലീറ്റ് ചെയ്യുക",
      context: "Batch delete modal title"
    },
    cannotDeleteBatchModalTitle: {
      en: "Cannot Delete Batch",
      ml: "ബാച്ച് ഡിലീറ്റ് ചെയ്യാനാവില്ല",
      context: "Blocked batch delete title"
    },
    deleteBatchPrompt: {
      en: "Are you sure you want to permanently delete batch \"{name}\"? This batch currently has 0 customers enrolled and can be safely removed.",
      ml: "\"{name}\" എന്ന ബാച്ച് ഡിലീറ്റ് ചെയ്യണമെന്ന് ഉറപ്പാണോ? ഈ ബാച്ചിൽ ഉപഭോക്താക്കൾ ആരും തന്നെയില്ലാത്തതിനാൽ ഇത് നീക്കം ചെയ്യാവുന്നതാണ്.",
      context: "Empty batch delete confirmation"
    },
    cannotDeleteBatchNotice: {
      en: "Batch \"{name}\" currently has {count} enrolled customer(s). Only batches without any customers can be deleted. Please reassign or delete the enrolled customers before deleting this batch.",
      ml: "\"{name}\" എന്ന ബാച്ചിൽ നിലവിൽ {count} ഉപഭോക്താക്കൾ ഉണ്ട്. ഉപഭോക്താക്കൾ ഇല്ലാത്ത ബാച്ചുകൾ മാത്രമേ ഡിലീറ്റ് ചെയ്യാൻ സാധിക്കൂ. ദയവായി ഈ ബാച്ചിലെ ഉപഭോക്താക്കളെ മാറ്റിയ ശേഷം മാത്രം വീണ്ടും ശ്രമിക്കുക.",
      context: "Batch delete blocked notice"
    },
    batchDeletedSuccess: {
      en: "Batch \"{name}\" deleted successfully!",
      ml: "\"{name}\" എന്ന ബാച്ച് വിജയകരമായി ഡിലീറ്റ് ചെയ്‌തു!",
      context: "Batch deleted toast"
    },
    irreversibleWarning: {
      en: "This action is permanent and cannot be undone.",
      ml: "ഈ പ്രവർത്തനം ഒരിക്കലും തിരിച്ചെടുക്കാനാവില്ല.",
      context: "Permanent deletion warning badge"
    }
  }
};

/**
 * Helper function to retrieve a translation string
 * 
 * @param {string} segment - Segment name (e.g., 'buttons', 'headings')
 * @param {string} key - String key inside segment (e.g., 'save', 'dashboard')
 * @param {'en'|'ml'} [lang='en'] - Selected language
 * @param {Object} [params={}] - Interpolation parameters (e.g., { name: 'John', count: 5 })
 * @returns {string} Translated and interpolated string
 */
export function translate(segment, key, lang = 'en', params = {}) {
  const item = translations[segment]?.[key];
  if (!item) {
    console.warn(`[i18n] Missing translation for ${segment}.${key}`);
    return key;
  }

  let text = item[lang] || item.en || key;

  // Replace {paramKey} with values
  Object.entries(params).forEach(([paramKey, paramVal]) => {
    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
  });

  return text;
}

// Shorthand alias
export const t = translate;

export default translations;
